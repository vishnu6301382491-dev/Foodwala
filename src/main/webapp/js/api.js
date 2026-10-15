/**
 * FoodWala - Unified Data & Authentication API (api.js)
 * 
 * Single Source of Truth: MySQL Backend (fudwala) on Render / Localhost
 * All operations interact with the backend API using prepared statements.
 * Features automatic retry and cold-start wake up detection for Render free-tier.
 */

(function (window) {
  'use strict';

  // =======================================================================
  // 1. BACKEND API CONFIGURATION
  // - Localhost / 127.0.0.1: Uses http://localhost:5000
  // - GitHub Pages / Production: Uses https://foodwala-backend-api.onrender.com
  // =======================================================================
  
  const HOSTED_BACKEND_URL = 'https://foodwala-backend-api.onrender.com';

  const API_BASE_URL = (function () {
    if (typeof window !== 'undefined') {
      if (window.FOODWALA_BACKEND_URL) return window.FOODWALA_BACKEND_URL.replace(/\/+$/, '');
      if (window.FOODWALA_API_URL) return window.FOODWALA_API_URL.replace(/\/+$/, '');
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      return HOSTED_BACKEND_URL;
    }
    return 'http://localhost:5000';
  })();

  const BACKEND_URL = API_BASE_URL;
  const SERVER_WAKE_UP_MSG = 'Server is waking up, please retry in 30 seconds.';

  const STORAGE_KEYS = {
    CURRENT_USER: 'foodwala_current_user',
    AUTH_TOKEN: 'foodwala_auth_token',
    PENDING_OTP: 'foodwala_pending_otp'
  };

  function getLocal(key, defaultVal) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function getAuthHeader() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    if (user && (user.userId || user.user_id)) {
      headers['X-User-Id'] = String(user.userId || user.user_id);
    }
    return headers;
  }

  // Normalize Indian mobile numbers: 10 digits
  function normalizeIndianPhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.substring(2))) {
      return digits.substring(2);
    }
    if (digits.startsWith('0') && digits.length === 11 && /^[6-9]/.test(digits.substring(1))) {
      return digits.substring(1);
    }
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return digits;
    }
    return null;
  }

  // Toast De-duplication and Red Error Styling
  let lastToastMsg = '';
  let lastToastTime = 0;

  function showErrorToast(msg) {
    if (typeof window === 'undefined' || !window.FoodWalaApp || typeof window.FoodWalaApp.showToast !== 'function') {
      return;
    }
    const now = Date.now();
    if (msg === lastToastMsg && (now - lastToastTime) < 5000) {
      return; // Suppress duplicate toast within 5 seconds
    }
    lastToastMsg = msg;
    lastToastTime = now;
    window.FoodWalaApp.showToast(msg, 'danger');
  }

  // Silent server warm-up ping on page load
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      fetch(`${API_BASE_URL}/api/health`, { method: 'GET', mode: 'cors' })
        .then(r => r.json())
        .then(data => {
          console.log('[FoodWalaApi] Silent warm-up ping completed. Server:', data.status, 'DB:', data.db);
        })
        .catch(err => {
          console.info('[FoodWalaApi] Silent warm-up ping sent (server may be spinning up):', err.message);
        });
    }, 100);
  }

  /**
   * Central fetch wrapper with automatic retry for Render free-tier cold starts.
   * Auto-retries 3 times with a 3-second delay silently before displaying any error.
   * Distinguishes failure types (network/CORS vs HTTP 5xx vs DB error).
   */
  async function apiFetch(endpoint, options = {}, retries = 3, delayMs = 3000) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    let lastError = null;
    let lastRes = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        lastRes = res;

        // If response is successful or a standard client error (e.g. 400 bad phone, 401 unauth, 422, 423 locked), return immediately
        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408)) {
          return res;
        }

        // Render cold start or transient 502/503/504/500
        if ((res.status === 502 || res.status === 503 || res.status === 504 || res.status === 500) && attempt < retries) {
          console.info(`[FoodWalaApi] Server waking up / retrying (${res.status}). Attempt ${attempt + 1}/${retries}...`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }

        return res;
      } catch (err) {
        lastError = err;
        console.info(`[FoodWalaApi] Attempt ${attempt + 1}/${retries + 1} failed:`, err.message);
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }

    // All retries exhausted -> classify failure type accurately
    let errorDetail = '';
    if (lastError) {
      errorDetail = 'Unable to connect to backend server. Server might be waking up or blocked by CORS.';
    } else if (lastRes) {
      if (lastRes.status === 404) {
        errorDetail = 'Backend service is not running or endpoint not found on Render. Please verify Render service status.';
      } else if (lastRes.status >= 500) {
        errorDetail = 'Database or backend service unavailable. Please retry in a few moments.';
      } else {
        errorDetail = `Request failed with HTTP status ${lastRes.status}.`;
      }
    } else {
      errorDetail = 'Unable to connect to backend server. Please retry in 30 seconds.';
    }

    const err = new Error(errorDetail);
    err.status = lastRes ? lastRes.status : 0;
    err.isNetworkOrCors = Boolean(lastError);
    err.response = lastRes;

    // Show single deduplicated red error toast only for interactive operations
    if (!endpoint.includes('/api/health') && !endpoint.includes('/api/restaurants') && !endpoint.includes('/api/categories')) {
      showErrorToast(errorDetail);
    }

    throw err;
  }

  const FoodWalaApi = {
    API_BASE_URL: API_BASE_URL,
    BACKEND_URL: BACKEND_URL,
    SERVER_WAKE_UP_MSG: SERVER_WAKE_UP_MSG,

    normalizePhone: function (phone) {
      return normalizeIndianPhone(phone);
    },

    getAuthToken: function () {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || '';
    },

    getCurrentUser: function () {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (user && typeof user === 'object' && user.name && String(user.name).trim().length > 0) {
        return user;
      }
      return null;
    },

    // 1. Check Phone Availability
    checkPhone: async function (rawPhone) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { available: false, error: 'Please enter a valid 10-digit mobile number.' };
      }
      try {
        const res = await apiFetch(`/api/auth/check-phone?phone=${encodeURIComponent(normalized)}`, {
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { available: true, error: null };
      }
    },

    // 2. Send Mobile OTP
    sendOtp: async function (rawPhone) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      try {
        const res = await apiFetch('/api/auth/send-otp', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: normalized })
        });
        const data = await res.json();
        return data;
      } catch (err) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    // 3. Verify OTP
    verifyOtp: async function (rawPhone, code) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
      }

      const cleanCode = (code || '').trim();
      if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        return { success: false, error: 'INVALID_CODE', message: 'Please enter the 6-digit verification code.' };
      }

      try {
        const res = await apiFetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: normalized, otp: cleanCode })
        });
        const data = await res.json();
        if (data.success && data.user && data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
          setLocal(STORAGE_KEYS.CURRENT_USER, data.user);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
        }
        return data;
      } catch (err) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    // 4. Register Mobile Profile
    registerMobile: async function (data) {
      try {
        const res = await apiFetch('/api/auth/register-mobile', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(data)
        });
        const resData = await res.json();
        if (resData.success && resData.user && resData.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, resData.token);
          setLocal(STORAGE_KEYS.CURRENT_USER, resData.user);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: resData.user }));
        }
        return resData;
      } catch (err) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    // 5. User Sign Up (Register)
    signup: async function (data) {
      const cleanName = (data.name || data.username || '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanPhone = normalizeIndianPhone(data.phone || '');
      const password = data.password || '';

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
      }

      if (data.confirmPassword && password !== data.confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
      }

      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
      }

      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            username: cleanName,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || '',
            password: password,
            confirmPassword: data.confirmPassword || password,
            address: data.address || ''
          })
        });

        const resData = await res.json();

        // Check for duplicate phone or duplicate email (HTTP 409)
        if (res.status === 409 || resData.code === 'PHONE_EXISTS' || resData.code === 'EMAIL_EXISTS') {
          return {
            success: false,
            status: 409,
            code: resData.code,
            phone: resData.phone || cleanPhone,
            email: resData.email || cleanEmail,
            error: resData.error || resData.message || 'Account already exists. Please login.',
            message: resData.error || resData.message || 'Account already exists. Please login.'
          };
        }

        if (res.ok && resData.success && resData.user) {
          if (resData.token) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, resData.token);
          }
          setLocal(STORAGE_KEYS.CURRENT_USER, resData.user);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: resData.user }));
        }

        return resData;

      } catch (err) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    // 6. User Login (Email or Phone + Password)
    loginEmail: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      if (!cleanId || !password) {
        return { success: false, message: 'Please enter your email or mobile number and password.' };
      }

      const isPhone = /^[6-9]\d{9}$/.test(cleanId) || /^\+91[6-9]\d{9}$/.test(cleanId);
      const payload = isPhone
        ? { phone: normalizeIndianPhone(cleanId), password: password }
        : { email: cleanId.toLowerCase(), password: password };

      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        // Check for account lockout (HTTP 423)
        if (res.status === 423 || data.error === 'ACCOUNT_LOCKED') {
          return {
            success: false,
            status: 423,
            error: 'ACCOUNT_LOCKED',
            message: data.message || 'Account locked due to multiple failed login attempts. Please try again after 15 minutes or reset your password.',
            lockRemainingMinutes: data.lockRemainingMinutes || 15
          };
        }

        if (res.ok && data.success && data.user) {
          if (data.token) {
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
          }
          setLocal(STORAGE_KEYS.CURRENT_USER, data.user);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
        }

        return data;

      } catch (err) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    // 7. Password Management
    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
      }
      if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long.' };
      }

      try {
        const res = await apiFetch('/api/auth/change-password', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
          })
        });
        return await res.json();
      } catch (err) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    // 8. Forgot & Reset Password
    forgotPassword: async function (emailOrPhone) {
      try {
        const res = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: emailOrPhone })
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    resetPassword: async function (token, newPassword) {
      try {
        const res = await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, newPassword: newPassword })
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    // 9. Sign Out
    logout: async function () {
      try {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeader()
        });
      } catch (e) {}

      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      if (typeof window.FoodWalaApp !== 'undefined' && window.FoodWalaApp.updateNavUI) {
        window.FoodWalaApp.updateNavUI();
      }
      return { success: true };
    },

    // 10. Catalog: Restaurants & Menus (fudwala)
    getRestaurants: async function () {
      try {
        const res = await apiFetch('/api/restaurants');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
        throw new Error('Empty restaurants array from API');
      } catch (e) {
        console.warn('[FoodWalaApi] Backend API unreachable, falling back to local static dataset:', e.message);
        try {
          const fallbackRes = await fetch('./data/restaurants.json');
          if (fallbackRes.ok) {
            const list = await fallbackRes.json();
            if (Array.isArray(list) && list.length > 0) return list;
          }
        } catch (err) {}
        if (typeof window !== 'undefined' && window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
          return window.FOODWALA_RESTAURANTS;
        }
        if (typeof window !== 'undefined' && window.FOODWALA_FEATURED_8) {
          return window.FOODWALA_FEATURED_8;
        }
        return [];
      }
    },

    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      try {
        const res = await apiFetch(`/api/restaurants/${rId}/menu`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      } catch (e) {
        console.warn(`[FoodWalaApi] API menu unreachable for ${rId}, loading static items:`, e.message);
      }
      try {
        const fallbackRes = await fetch('./data/menu-items.json');
        if (fallbackRes.ok) {
          const allItems = await fallbackRes.json();
          const matched = allItems.filter(m => (m.restaurantId === rId || m.restaurant_id === rId));
          if (matched.length > 0) return matched;
        }
      } catch (err) {}
      return [];
    },

    getCategories: async function () {
      try {
        const res = await apiFetch('/api/categories');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      } catch (e) {
        console.warn('[FoodWalaApi] Backend API unreachable, loading static categories fallback:', e.message);
      }
      try {
        const fallbackRes = await fetch('./data/categories.json');
        if (fallbackRes.ok) {
          const list = await fallbackRes.json();
          if (Array.isArray(list) && list.length > 0) return list;
        }
      } catch (err) {}
      return [
        { id: 1, name: 'South Indian' },
        { id: 2, name: 'North Indian' },
        { id: 3, name: 'Biryani' },
        { id: 4, name: 'Burgers & Fast Food' },
        { id: 5, name: 'Desserts & Sweets' },
        { id: 6, name: 'Beverages' }
      ];
    },

    // 11. Saved Addresses (fudwala.address)
    getAddresses: async function () {
      try {
        const res = await apiFetch('/api/user/addresses', {
          headers: getAuthHeader()
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return [];
      }
    },

    saveAddress: async function (addressData) {
      try {
        const res = await apiFetch('/api/user/addresses', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(addressData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    deleteAddress: async function (addressId) {
      try {
        const res = await apiFetch(`/api/user/addresses/${addressId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    setDefaultAddress: async function (addressId) {
      try {
        const res = await apiFetch(`/api/user/addresses/${addressId}/default`, {
          method: 'PUT',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    // 12. Persistent Cart (fudwala.cart & cart_item)
    getCart: async function () {
      try {
        const res = await apiFetch('/api/cart', {
          headers: getAuthHeader()
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    syncCart: async function (cartData) {
      try {
        const res = await apiFetch('/api/cart/sync', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(cartData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    // 13. Coupons (fudwala.coupons)
    validateCoupon: async function (code, total, userId) {
      try {
        const res = await apiFetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, orderTotal: total, userId: userId })
        });
        return await res.json();
      } catch (e) {
        return { valid: false, message: 'Server waking up, please retry coupon in 30 seconds.' };
      }
    },

    // 14. Transactional Orders (fudwala.orders)
    placeOrder: async function (orderPayload) {
      try {
        const res = await apiFetch('/api/orders/place', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        return data;
      } catch (e) {
        return {
          success: false,
          error: 'SERVER_WAKING_UP',
          message: SERVER_WAKE_UP_MSG
        };
      }
    },

    getOrders: async function (userId, phone) {
      try {
        let url = '/api/orders';
        const params = [];
        if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
        if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        const res = await apiFetch(url, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        console.warn('[FoodWalaApi] Failed to fetch orders (server waking up):', e.message);
        return [];
      }
    },

    getOrderById: async function (orderId) {
      try {
        const res = await apiFetch(`/api/orders/${orderId}`, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    // 15. Administrator Database Audits
    getAdminUsers: async function () {
      try {
        const res = await apiFetch('/api/admin/users', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    getAdminOrders: async function () {
      try {
        const res = await apiFetch('/api/admin/orders', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    },

    getAdminLoginHistory: async function () {
      try {
        const res = await apiFetch('/api/admin/login-history', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVER_WAKING_UP', message: SERVER_WAKE_UP_MSG };
      }
    }
  };

  window.FoodWalaApi = FoodWalaApi;

})(typeof window !== 'undefined' ? window : this);
