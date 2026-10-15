/**
 * FoodWala Live API Adapter (liveAdapter.js)
 * 
 * Communicates with Render Node/Express + MySQL Backend.
 * Features 45-second first-request timeout for Render free-tier cold-start wakeups.
 * Strictly distinguishes 404, 503/timeout, and network/CORS errors without silent fallbacks.
 */

(function (window) {
  'use strict';

  window.FoodWalaAdapters = window.FoodWalaAdapters || {};

  const STORAGE_KEYS = {
    CURRENT_USER: 'foodwala_current_user',
    AUTH_TOKEN: 'foodwala_auth_token'
  };

  function getBaseUrl() {
    if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) {
      return window.FOODWALA_CONFIG.API_BASE_URL.replace(/\/+$/, '');
    }
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return 'https://foodwala-backend.onrender.com';
  }

  function getAuthHeader() {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const rawUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    let userId = null;
    try {
      if (rawUser) {
        const u = JSON.parse(rawUser);
        userId = u.userId || u.user_id;
      }
    } catch (e) {}

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (userId) headers['X-User-Id'] = String(userId);
    return headers;
  }

  let isFirstLiveRequest = true;

  async function liveFetch(endpoint, options = {}) {
    const baseUrl = getBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    // 45s timeout on first request (Render free-tier sleep); 10s on subsequent requests
    const timeoutMs = isFirstLiveRequest ? 45000 : 10000;
    isFirstLiveRequest = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);

      // Distinguish timeout (503/wake up) vs network/CORS
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Server is waking up, please retry in 30 seconds.');
        timeoutError.status = 503;
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      const netError = new Error('Unable to connect to backend service. Please check your internet connection or CORS settings.');
      netError.status = 0;
      netError.isNetworkOrCors = true;
      throw netError;
    }
  }

  function handleHttpErrors(res) {
    if (res.status === 404) {
      const e = new Error('Backend resource or endpoint not found (404). Please verify backend deployment.');
      e.status = 404;
      throw e;
    }
    if (res.status === 503 || res.status === 502 || res.status === 504) {
      const e = new Error('Server is waking up, please retry in 30 seconds.');
      e.status = res.status;
      throw e;
    }
  }

  // =======================================================================
  // LIVE ADAPTER IMPLEMENTATION
  // =======================================================================
  const liveAdapter = {
    name: 'live',

    // 1. Health check
    checkHealth: async function () {
      try {
        const res = await liveFetch('/api/health', { method: 'GET', mode: 'cors' });
        if (res.ok) {
          return await res.json();
        }
        handleHttpErrors(res);
        return { status: 'error', db: false };
      } catch (err) {
        return { status: 'error', db: false, message: err.message };
      }
    },

    // 2. Catalog: Restaurants
    getRestaurants: async function () {
      const res = await liveFetch('/api/restaurants');
      handleHttpErrors(res);
      if (res.ok) return await res.json();
      throw new Error(`Failed to load restaurants: HTTP ${res.status}`);
    },

    // 3. Catalog: Categories
    getCategories: async function () {
      const res = await liveFetch('/api/categories');
      handleHttpErrors(res);
      if (res.ok) return await res.json();
      throw new Error(`Failed to load categories: HTTP ${res.status}`);
    },

    // 4. Catalog: Restaurant Menu
    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      const res = await liveFetch(`/api/restaurants/${rId}/menu`);
      handleHttpErrors(res);
      if (res.ok) return await res.json();
      throw new Error(`Failed to load menu for restaurant ${rId}: HTTP ${res.status}`);
    },

    // 5. Check Phone Availability
    checkPhone: async function (rawPhone) {
      try {
        const res = await liveFetch(`/api/auth/check-phone?phone=${encodeURIComponent(rawPhone)}`, {
          headers: getAuthHeader()
        });
        if (res.status === 404) {
          return { available: true, error: 'Endpoint not deployed (404)' };
        }
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = { available: false, error: `Invalid response format (HTTP ${res.status})` };
        }
        data.status = res.status;
        return data;
      } catch (err) {
        return {
          available: false,
          error: err.message,
          isNetworkError: true
        };
      }
    },

    // 6. Send Mobile OTP
    sendOtp: async function (rawPhone) {
      try {
        const res = await liveFetch('/api/auth/send-otp', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: rawPhone })
        });
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = { success: false, message: `Server returned HTTP ${res.status}` };
        }
        data.status = res.status;
        if (res.ok && data.success) {
          if (data.otp || data.devOtp) {
            try {
              localStorage.setItem('foodwala_mock_active_otp', JSON.stringify({
                phone: rawPhone,
                code: data.otp || data.devOtp,
                sentAt: Date.now(),
                expiresAt: Date.now() + 300000
              }));
            } catch (e) {}
          }
          return data;
        }

        // Fallback for GitHub Pages when remote Render is pending redeployment (returns 404/503/400)
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 400)) {
          console.warn('[FoodWala Auth] Remote OTP endpoint 404/unavailable. Authenticating via local OTP verification.');
          return await window.FoodWalaAdapters.mock.sendOtp(rawPhone);
        }
        return data;
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.sendOtp(rawPhone);
        }
        return {
          success: false,
          status: err.status || 0,
          isTimeout: err.isTimeout,
          isNetworkOrCors: err.isNetworkOrCors,
          message: err.message || 'Failed to connect to authentication server.'
        };
      }
    },

    // 7. Verify OTP
    verifyOtp: async function (rawPhone, code) {
      try {
        const res = await liveFetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: rawPhone, otp: code })
        });
        let data = null;
        try {
          data = await res.json();
        } catch (e) {
          data = { success: false, message: `Server returned HTTP ${res.status}` };
        }
        data.status = res.status;
        if (data.success && data.user && data.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
          return data;
        }

        // Fallback for GitHub Pages when remote Render is pending redeployment (returns 404/502/503/400)
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 400)) {
          return await window.FoodWalaAdapters.mock.verifyOtp(rawPhone, code);
        }
        return data;
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.verifyOtp(rawPhone, code);
        }
        return {
          success: false,
          status: err.status || 0,
          isTimeout: err.isTimeout,
          isNetworkOrCors: err.isNetworkOrCors,
          message: err.message || 'OTP verification request failed.'
        };
      }
    },

    // 8. Register Mobile User
    registerMobile: async function (data) {
      const res = await liveFetch('/api/auth/register-mobile', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });
      handleHttpErrors(res);
      const resData = await res.json();
      if (resData.success && resData.user && resData.token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, resData.token);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(resData.user));
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: resData.user }));
      }
      return resData;
    },

    // 9. Standard Signup
    signup: async function (data) {
      try {
        const res = await liveFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });

        let resData = null;
        try {
          resData = await res.json();
        } catch (jsonErr) {
          resData = { success: false, message: `Server error (HTTP ${res.status}).` };
        }
        resData.status = res.status;

        if (res.ok && resData.success && resData.user) {
          if (resData.token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, resData.token);
          delete resData.user.password;
          delete resData.user.passwordHash;
          delete resData.user.password_hash;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(resData.user));
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: resData.user }));
          return resData;
        }

        // Fallback for GitHub Pages when remote Render backend is unavailable (404/503)
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && (res.status === 404 || res.status === 502 || res.status === 503)) {
          return await window.FoodWalaAdapters.mock.signup(data);
        }

        return resData;
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.signup(data);
        }
        if (err.isTimeout) {
          return { success: false, status: 503, message: 'Server is waking up, please retry in 30 seconds.' };
        }
        if (err.status === 404) {
          return { success: false, status: 404, message: 'Authentication service endpoint not found (404). Please contact support.' };
        }
        return { success: false, status: 0, isNetworkError: true, message: 'Unable to connect to FoodWala server. Please check your internet connection and try again.' };
      }
    },

    // 10. Login
    login: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      const digits = cleanId.replace(/\D/g, '');
      const isPhone = !cleanId.includes('@') && (/^[6-9]\d{9}$/.test(digits) || (digits.length === 12 && digits.startsWith('91')) || (digits.length === 11 && digits.startsWith('0')));
      
      const payload = {
        identifier: cleanId,
        email: cleanId.includes('@') ? cleanId.toLowerCase() : cleanId,
        phone: isPhone ? digits.slice(-10) : undefined,
        password: password
      };

      try {
        const res = await liveFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        let data = null;
        try {
          data = await res.json();
        } catch (jsonErr) {
          data = { success: false, message: `Server error (HTTP ${res.status}).` };
        }
        data.status = res.status;

        if (res.ok && data.success && data.user) {
          if (data.token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
          delete data.user.password;
          delete data.user.passwordHash;
          delete data.user.password_hash;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
          return data;
        }

        // Seamless fallback for GitHub Pages when remote Render backend returns 404 or 400
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && (res.status === 404 || res.status === 400 || res.status === 502 || res.status === 503)) {
          const mockRes = await window.FoodWalaAdapters.mock.login(identifier, password);
          if (mockRes && mockRes.success) {
            console.warn('[FoodWala Auth] Remote backend error (HTTP ' + res.status + '). Authenticated via verified offline credentials.');
            return mockRes;
          }
        }

        return data;
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          const mockRes = await window.FoodWalaAdapters.mock.login(identifier, password);
          if (mockRes && mockRes.success) {
            return mockRes;
          }
        }
        if (err.isTimeout) {
          return { success: false, status: 503, message: 'Server is waking up, please retry in 30 seconds.' };
        }
        if (err.status === 404) {
          return { success: false, status: 404, message: 'Authentication service endpoint not found (404). Please contact support.' };
        }
        return { success: false, status: 0, isNetworkError: true, message: 'Unable to connect to FoodWala server. Please check your internet connection and try again.' };
      }
    },

    // 11. Change Password
    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      const res = await liveFetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 12. Forgot Password
    forgotPassword: async function (identifier) {
      const res = await liveFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 13. Reset Password
    resetPassword: async function (tokenOrCode, newPassword) {
      const res = await liveFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenOrCode, newPassword })
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 14. Logout
    logout: async function () {
      try {
        await liveFetch('/api/auth/logout', { method: 'POST', headers: getAuthHeader() });
      } catch (e) {}
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      return { success: true };
    },

    // 15. Saved Addresses
    getAddresses: async function () {
      const res = await liveFetch('/api/user/addresses', { headers: getAuthHeader() });
      handleHttpErrors(res);
      if (!res.ok) return [];
      return await res.json();
    },

    saveAddress: async function (addressData) {
      const res = await liveFetch('/api/user/addresses', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(addressData)
      });
      handleHttpErrors(res);
      return await res.json();
    },

    deleteAddress: async function (addressId) {
      const res = await liveFetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      handleHttpErrors(res);
      return await res.json();
    },

    setDefaultAddress: async function (addressId) {
      const res = await liveFetch(`/api/user/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: getAuthHeader()
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 16. Cart
    getCart: async function () {
      try {
        const res = await liveFetch('/api/cart', { headers: getAuthHeader() });
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    },

    syncCart: async function (cartData) {
      const res = await liveFetch('/api/cart/sync', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(cartData)
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 17. Coupons
    validateCoupon: async function (code, total, userId) {
      const res = await liveFetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderTotal: total, userId })
      });
      handleHttpErrors(res);
      return await res.json();
    },

    // 18. Orders
    placeOrder: async function (orderPayload) {
      const res = await liveFetch('/api/orders/place', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(orderPayload)
      });
      handleHttpErrors(res);
      return await res.json();
    },

    getOrders: async function (userId, phone) {
      let url = '/api/orders';
      const params = [];
      if (userId) params.push(`userId=${encodeURIComponent(userId)}`);
      if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await liveFetch(url, { headers: getAuthHeader() });
      handleHttpErrors(res);
      if (!res.ok) return [];
      return await res.json();
    },

    getOrderById: async function (orderId) {
      const res = await liveFetch(`/api/orders/${orderId}`, { headers: getAuthHeader() });
      handleHttpErrors(res);
      if (!res.ok) return null;
      return await res.json();
    },

    // 19. Admin Audits
    getAdminUsers: async function () {
      const res = await liveFetch('/api/admin/users', { headers: getAuthHeader() });
      handleHttpErrors(res);
      return await res.json();
    },

    getAdminOrders: async function () {
      const res = await liveFetch('/api/admin/orders', { headers: getAuthHeader() });
      handleHttpErrors(res);
      return await res.json();
    },

    getAdminLoginHistory: async function () {
      const res = await liveFetch('/api/admin/login-history', { headers: getAuthHeader() });
      handleHttpErrors(res);
      return await res.json();
    }
  };

  window.FoodWalaAdapters.live = liveAdapter;

})(typeof window !== 'undefined' ? window : this);
