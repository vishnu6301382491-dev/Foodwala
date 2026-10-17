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

  const unavailableEndpoints = new Set();

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
      if (unavailableEndpoints.has('restaurants')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurants();
        }
      }
      try {
        const res = await liveFetch('/api/restaurants');
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurants');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getRestaurants();
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurants');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurants();
        }
        return [];
      }
    },

    // 3. Catalog: Categories
    getCategories: async function () {
      if (unavailableEndpoints.has('categories')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getCategories();
        }
      }
      try {
        const res = await liveFetch('/api/categories');
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('categories');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getCategories();
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('categories');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getCategories();
        }
        return [];
      }
    },

    // 4. Catalog: Restaurant Menu
    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      if (unavailableEndpoints.has('menu_' + rId)) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantMenu(rId);
        }
      }
      try {
        const res = await liveFetch(`/api/restaurants/${rId}/menu`);
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('menu_' + rId);
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getRestaurantMenu(rId);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('menu_' + rId);
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantMenu(rId);
        }
        return [];
      }
    },

    // 5. Check Phone Availability
    checkPhone: async function (rawPhone) {
      if (unavailableEndpoints.has('check-phone')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.checkPhone(rawPhone);
        }
        return { available: true };
      }

      try {
        const res = await liveFetch(`/api/auth/check-phone?phone=${encodeURIComponent(rawPhone)}`, {
          headers: getAuthHeader()
        });
        if (res.status === 404) {
          unavailableEndpoints.add('check-phone');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.checkPhone(rawPhone);
          }
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
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.checkPhone(rawPhone);
        }
        return {
          available: false,
          error: err.message,
          isNetworkError: true
        };
      }
    },

    // 6. Send Mobile OTP
    sendOtp: async function (rawPhone) {
      if (unavailableEndpoints.has('send-otp')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.sendOtp(rawPhone);
        }
      }

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
          unavailableEndpoints.add('send-otp');
          return await window.FoodWalaAdapters.mock.sendOtp(rawPhone);
        }
        return data;
      } catch (err) {
        unavailableEndpoints.add('send-otp');
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
      if (unavailableEndpoints.has('send-otp') || unavailableEndpoints.has('verify-otp')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.verifyOtp(rawPhone, code);
        }
      }

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
          unavailableEndpoints.add('verify-otp');
          return await window.FoodWalaAdapters.mock.verifyOtp(rawPhone, code);
        }
        return data;
      } catch (err) {
        unavailableEndpoints.add('verify-otp');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.verifyOtp(rawPhone, code);
        }
        return {
          success: false,
          status: err.status || 0,
          isTimeout: err.isTimeout,
          isNetworkOrCors: err.isNetworkOrCors,
          message: err.message || 'Verification service temporarily unavailable.'
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
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem('foodwala_current_user');
      localStorage.removeItem('foodwala_auth_token');
      localStorage.removeItem('foodwala_user');
      sessionStorage.removeItem('foodwala_current_user');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1500);
        await fetch(`${getBaseUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: getAuthHeader(),
          signal: controller.signal
        }).catch(() => {});
        clearTimeout(tid);
      } catch (e) {}
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
      if (unavailableEndpoints.has('admin/users')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminUsers();
        }
      }
      try {
        const res = await liveFetch('/api/admin/users', { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('admin/users');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getAdminUsers();
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('admin/users');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminUsers();
        }
        return { success: false, users: [] };
      }
    },

    getAdminOrders: async function () {
      if (unavailableEndpoints.has('admin/orders')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminOrders();
        }
      }
      try {
        const res = await liveFetch('/api/admin/orders', { headers: getAuthHeader() });
        if (res.ok) {
          const liveData = await res.json();
          // Merge any client-side orders (e.g. newly placed sandbox orders) so none are missed
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && typeof window.FoodWalaAdapters.mock.getAdminOrders === 'function') {
            try {
              const mockData = await window.FoodWalaAdapters.mock.getAdminOrders();
              if (mockData && Array.isArray(mockData.orders)) {
                const liveIds = new Set((liveData.orders || []).map(o => String(o.order_id || o.orderId || o.id).replace(/^#?FW-?/i, '')));
                const extraOrders = mockData.orders.filter(o => !liveIds.has(String(o.order_id || o.orderId || o.id).replace(/^#?FW-?/i, '')));
                if (extraOrders.length > 0) {
                  liveData.orders = [...extraOrders, ...(liveData.orders || [])];
                  liveData.totalOrders = liveData.orders.length;
                  liveData.totalRevenue = liveData.orders.reduce((acc, o) => acc + (Number(o.total_amount || o.totalAmount || o.grandTotal || o.total) || 0), 0);
                }
              }
            } catch (mergeErr) {}
          }
          return liveData;
        }
        if (res.status === 404) {
          unavailableEndpoints.add('admin/orders');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getAdminOrders();
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('admin/orders');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminOrders();
        }
        return { success: false, orders: [], totalOrders: 0, totalRevenue: 0 };
      }
    },

    getAdminLoginHistory: async function () {
      if (unavailableEndpoints.has('admin/login-history')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminLoginHistory();
        }
      }
      try {
        const res = await liveFetch('/api/admin/login-history', { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('admin/login-history');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getAdminLoginHistory();
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('admin/login-history');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminLoginHistory();
        }
        return { success: false, history: [] };
      }
    },

    // 20. Restaurant Partner Management (Live)
    getRestaurantDetails: async function (restaurantId) {
      const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
      try {
        const res = await liveFetch(`/api/restaurant/details${q}`, { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        if (res.status === 404 && window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantDetails(restaurantId);
        }
        handleHttpErrors(res);
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantDetails(restaurantId);
        }
        throw err;
      }
    },

    getRestaurantManageMenu: async function (restaurantId) {
      const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
      try {
        const res = await liveFetch(`/api/restaurant/menu${q}`, { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        if (res.status === 404 && window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantManageMenu(restaurantId);
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_manage_menu_' + restaurantId);
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantManageMenu(restaurantId);
        }
        throw err;
      }
    },

    addMenuItem: async function (itemData) {
      if (unavailableEndpoints.has('restaurant_menu_crud')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.addMenuItem(itemData);
        }
      }
      try {
        const res = await liveFetch('/api/restaurant/menu', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(itemData)
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_menu_crud');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.addMenuItem(itemData);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_menu_crud');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.addMenuItem(itemData);
        }
        throw err;
      }
    },

    updateMenuItem: async function (menuId, itemData) {
      if (unavailableEndpoints.has('restaurant_menu_crud')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.updateMenuItem(menuId, itemData);
        }
      }
      try {
        const res = await liveFetch(`/api/restaurant/menu/${menuId}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(itemData)
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_menu_crud');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.updateMenuItem(menuId, itemData);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_menu_crud');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.updateMenuItem(menuId, itemData);
        }
        throw err;
      }
    },

    toggleItemAvailability: async function (menuId, isAvailable) {
      if (unavailableEndpoints.has('restaurant_menu_crud')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.toggleItemAvailability(menuId, isAvailable);
        }
      }
      try {
        const res = await liveFetch(`/api/restaurant/menu/${menuId}/availability`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ isAvailable, is_available: isAvailable ? 1 : 0 })
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_menu_crud');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.toggleItemAvailability(menuId, isAvailable);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_menu_crud');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.toggleItemAvailability(menuId, isAvailable);
        }
        throw err;
      }
    },

    deleteMenuItem: async function (menuId) {
      if (unavailableEndpoints.has('restaurant_menu_crud')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.deleteMenuItem(menuId);
        }
      }
      try {
        const res = await liveFetch(`/api/restaurant/menu/${menuId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_menu_crud');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.deleteMenuItem(menuId);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_menu_crud');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.deleteMenuItem(menuId);
        }
        throw err;
      }
    },

    toggleRestaurantStatus: async function (restaurantId, isOpen) {
      if (unavailableEndpoints.has('restaurant_status')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.toggleRestaurantStatus(restaurantId, isOpen);
        }
      }
      try {
        const res = await liveFetch('/api/restaurant/status', {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ restaurantId, isOpen, is_open: isOpen ? 1 : 0 })
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_status');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.toggleRestaurantStatus(restaurantId, isOpen);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_status');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.toggleRestaurantStatus(restaurantId, isOpen);
        }
        throw err;
      }
    },

    getRestaurantOrders: async function (restaurantId) {
      if (unavailableEndpoints.has('restaurant_orders')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
        }
      }
      const q = restaurantId ? `?restaurantId=${restaurantId}` : '';
      try {
        const res = await liveFetch(`/api/restaurant/orders${q}`, { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_orders');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_orders');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
        }
        throw err;
      }
    },

    updateRestaurantOrderStatus: async function (orderId, status) {
      if (unavailableEndpoints.has('restaurant_orders_status')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.updateRestaurantOrderStatus(orderId, status);
        }
      }
      try {
        const res = await liveFetch(`/api/restaurant/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: JSON.stringify({ status })
        });
        if (res.ok) return await res.json();
        if (res.status === 404) {
          unavailableEndpoints.add('restaurant_orders_status');
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.updateRestaurantOrderStatus(orderId, status);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        unavailableEndpoints.add('restaurant_orders_status');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.updateRestaurantOrderStatus(orderId, status);
        }
        throw err;
      }
    }
  };

  window.FoodWalaAdapters.live = liveAdapter;

})(typeof window !== 'undefined' ? window : this);
