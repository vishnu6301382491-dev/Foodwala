/**
 * FoodWala - Unified Data & Authentication API (api.js)
 * 
 * Single Source of Truth: MySQL Backend (fudwala)
 * All operations interact with the backend API using prepared statements.
 * LocalStorage is strictly restricted to active user session token and UI preferences.
 */

(function (window) {
  'use strict';

  // =======================================================================
  // BACKEND API CONFIGURATION
  // - Localhost / 127.0.0.1: Uses http://localhost:5000
  // - GitHub Pages (github.io): Uses hosted cloud backend (Render / Railway)
  // =======================================================================
  
  // PLACEHOLDER FOR HOSTED BACKEND URL (HTTPS)
  // After deploying your server/ directory to Render or Railway, paste your live backend URL here:
  // e.g., 'https://foodwala-backend.onrender.com'
  const HOSTED_BACKEND_URL = 'https://foodwala-backend-api.onrender.com'; // <-- REPLACE_WITH_HOSTED_BACKEND_URL

  const API_BASE_URL = (function () {
    if (typeof window !== 'undefined') {
      if (window.FOODWALA_BACKEND_URL) return window.FOODWALA_BACKEND_URL;
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      return HOSTED_BACKEND_URL;
    }
    return 'http://localhost:5000';
  })();

  const BACKEND_URL = API_BASE_URL;

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

  const FoodWalaApi = {
    BACKEND_URL: BACKEND_URL,

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
        const res = await fetch(`${BACKEND_URL}/api/auth/check-phone?phone=${encodeURIComponent(normalized)}`);
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
        const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: normalized })
        });
        const data = await res.json();
        return data;
      } catch (err) {
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Unable to connect to FoodWala server. Please check your connection.'
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
        const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
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
        return { success: false, error: 'NETWORK_ERROR', message: 'Failed to connect to authentication server.' };
      }
    },

    // 4. Register Mobile Profile
    registerMobile: async function (data) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/register-mobile`, {
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
        return { success: false, message: 'Registration failed. Please check connection.' };
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
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
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
          error: 'SERVER_UNAVAILABLE',
          message: 'Unable to connect to database server. Please ensure the FoodWala backend is running.'
        };
      }
    },

    // 6. User Login
    loginEmail: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      if (!cleanId || !password) {
        return { success: false, message: 'Please enter your email or mobile number and password.' };
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ identifier: cleanId, password: password })
        });

        const data = await res.json();

        if (res.status === 423 || data.error === 'ACCOUNT_LOCKED') {
          return {
            success: false,
            locked: true,
            status: 423,
            message: data.message || 'Account is temporarily locked due to multiple failed attempts.'
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
          message: 'Unable to connect to database server. Please ensure the FoodWala backend is running.'
        };
      }
    },

    // 7. Change Password
    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
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
        return { success: false, message: 'Unable to connect to server.' };
      }
    },

    // 8. Forgot Password & Reset
    forgotPassword: async function (identifier) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier })
        });
        return await res.json();
      } catch (err) {
        return { success: false, message: 'Unable to connect to server.' };
      }
    },

    resetPassword: async function (resetToken, otp, newPassword, confirmPassword) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetToken: resetToken,
            otp: otp,
            newPassword: newPassword,
            confirmPassword: confirmPassword
          })
        });
        return await res.json();
      } catch (err) {
        return { success: false, message: 'Unable to connect to server.' };
      }
    },

    // 9. Logout
    logout: async function () {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
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
        const res = await fetch(`${BACKEND_URL}/api/restaurants`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        console.error('[FoodWalaApi] Failed to fetch restaurants from MySQL:', e);
        return [];
      }
    },

    getRestaurantMenu: async function (restaurantId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/restaurants/${restaurantId}/menu`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        console.error(`[FoodWalaApi] Failed to fetch menu for restaurant ${restaurantId} from MySQL:`, e);
        return [];
      }
    },

    getCategories: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/categories`);
        return await res.json();
      } catch (e) {
        return [];
      }
    },

    // 11. Saved Addresses (fudwala.address)
    getAddresses: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/addresses`, {
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
        const res = await fetch(`${BACKEND_URL}/api/user/addresses`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(addressData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, message: e.message };
      }
    },

    deleteAddress: async function (addressId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/addresses/${addressId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, message: e.message };
      }
    },

    setDefaultAddress: async function (addressId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/addresses/${addressId}/default`, {
          method: 'PUT',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, message: e.message };
      }
    },

    // 12. Persistent Cart (fudwala.cart & cart_item)
    getCart: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cart`, {
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
        const res = await fetch(`${BACKEND_URL}/api/cart/sync`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(cartData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, message: e.message };
      }
    },

    // 13. Coupons (fudwala.coupons)
    validateCoupon: async function (code, total, userId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/coupons/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, orderTotal: total, userId: userId })
        });
        return await res.json();
      } catch (e) {
        return { valid: false, message: 'Failed to validate coupon code.' };
      }
    },

    // 14. Transactional Orders (fudwala.orders)
    placeOrder: async function (orderPayload) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/place`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        return data;
      } catch (e) {
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Unable to connect to order processing server.'
        };
      }
    },

    getOrders: async function (userId, phone) {
      try {
        let url = `${BACKEND_URL}/api/orders`;
        const params = [];
        if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
        if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        const res = await fetch(url, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        console.error('[FoodWalaApi] Failed to fetch orders from database:', e);
        return [];
      }
    },

    getOrderById: async function (orderId) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    // 15. Administrator Database Audits
    getAdminUsers: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/users`, { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'NETWORK_ERROR', message: 'Failed to fetch admin users from database.' };
      }
    },

    getAdminOrders: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/orders`, { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'NETWORK_ERROR', message: 'Failed to fetch admin orders from database.' };
      }
    },

    getAdminLoginHistory: async function () {
      try {
        const res = await fetch(`${BACKEND_URL}/api/admin/login-history`, { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'NETWORK_ERROR', message: 'Failed to fetch login history from database.' };
      }
    }
  };

  window.FoodWalaApi = FoodWalaApi;

})(typeof window !== 'undefined' ? window : this);
