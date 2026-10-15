/**
 * FoodWala - Unified Data & Authentication API (api.js)
 * 
 * Architecture:
 * - Browsing (restaurants, categories, menus, search): Handled instantly from local static JSON
 *   data with a 10-minute Stale-While-Revalidate localStorage cache when USE_BACKEND_FOR_BROWSING = false.
 * - Transactions (auth, OTP, orders, addresses, admin): Communicates with Render MySQL backend
 *   after validating backend availability with a fast 3-second GET /api/health pre-flight check.
 */

(function (window) {
  'use strict';

  // =======================================================================
  // 1. CONFIGURATION FLAGS & API ENDPOINT
  // =======================================================================

  // When false, ALL browsing operations (restaurants, categories, menus, search)
  // use only local static data with 10-minute stale-while-revalidate caching.
  // When true, browsing operations route through the backend API.
  const USE_BACKEND_FOR_BROWSING = false;

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
  const SERVICE_UNAVAILABLE_MSG = 'Account and order service is temporarily unavailable. Please try again shortly.';

  const STORAGE_KEYS = {
    CURRENT_USER: 'foodwala_current_user',
    AUTH_TOKEN: 'foodwala_auth_token',
    PENDING_OTP: 'foodwala_pending_otp'
  };

  // Safe relative path resolver for GitHub Pages and sub-directory deployments
  function resolveDataPath(relPath) {
    if (typeof window !== 'undefined' && window.location) {
      const cleanRel = relPath.replace(/^\.?\//, '');
      const pathname = window.location.pathname || '';
      const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
      return `${baseDir}${cleanRel}`;
    }
    return `./${relPath.replace(/^\.?\//, '')}`;
  }

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

  // --- FAST LOCALSTORAGE CACHE HELPERS (10-minute TTL) ---
  const CACHE_TTL_MS = 600000; // 10 minutes

  function getCachedData(key) {
    try {
      const raw = localStorage.getItem(`foodwala_cache_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        const isFresh = (Date.now() - parsed.timestamp) < CACHE_TTL_MS;
        return { data: parsed.data, isFresh: isFresh };
      }
    } catch (e) {}
    return null;
  }

  function setCachedData(key, data) {
    try {
      localStorage.setItem(`foodwala_cache_${key}`, JSON.stringify({
        data: data,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  // =======================================================================
  // 2. BACKEND HEALTH CHECK (Pre-flight for interactive operations)
  // =======================================================================
  let backendHealthCache = {
    isHealthy: null,
    lastChecked: 0
  };

  /**
   * Checks if backend is reachable with a strict 3-second timeout.
   * Caches results for maxAgeMs to avoid spamming the health endpoint.
   */
  async function checkBackendHealth(maxAgeMs = 5000) {
    const now = Date.now();
    if (backendHealthCache.isHealthy !== null && (now - backendHealthCache.lastChecked) < maxAgeMs) {
      return backendHealthCache.isHealthy;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const healthy = Boolean(data && data.status === 'ok');
        backendHealthCache = { isHealthy: healthy, lastChecked: now };
        return healthy;
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }

    backendHealthCache = { isHealthy: false, lastChecked: now };
    return false;
  }

  // Only warm up /api/health on pages that actually require the backend (register, login, checkout, orders)
  if (typeof window !== 'undefined' && window.location) {
    const path = (window.location.pathname || '').toLowerCase();
    const isInteractivePage = /register|login|checkout|orders/i.test(path);
    if (isInteractivePage) {
      setTimeout(() => {
        checkBackendHealth(0).catch(() => {});
      }, 300);
    }
  }

  // --- CIRCUIT BREAKER FOR USE_BACKEND_FOR_BROWSING = true ---
  const CIRCUIT_BREAKER_WINDOW_MS = 60000;
  let circuitBreakerTrippedUntil = 0;

  function isCircuitBreakerOpen() {
    return Date.now() < circuitBreakerTrippedUntil;
  }

  function tripCircuitBreaker() {
    circuitBreakerTrippedUntil = Date.now() + CIRCUIT_BREAKER_WINDOW_MS;
  }

  function resetCircuitBreaker() {
    circuitBreakerTrippedUntil = 0;
  }

  /**
   * Central fetch wrapper for backend API calls with strict 3-second timeout.
   */
  async function apiFetch(endpoint, options = {}, retries = 0, delayMs = 1000) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    let lastError = null;
    let lastRes = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const res = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        lastRes = res;

        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408)) {
          resetCircuitBreaker();
          return res;
        }

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        return res;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }

    tripCircuitBreaker();
    showErrorToast(SERVICE_UNAVAILABLE_MSG);

    const err = new Error(SERVICE_UNAVAILABLE_MSG);
    err.status = lastRes ? lastRes.status : 0;
    err.isNetworkOrCors = Boolean(lastError);
    err.response = lastRes;
    throw err;
  }

  // =======================================================================
  // 3. FOODWALA API CLIENT
  // =======================================================================
  const FoodWalaApi = {
    USE_BACKEND_FOR_BROWSING: USE_BACKEND_FOR_BROWSING,
    API_BASE_URL: API_BASE_URL,
    BACKEND_URL: BACKEND_URL,
    SERVICE_UNAVAILABLE_MSG: SERVICE_UNAVAILABLE_MSG,

    checkBackendHealth: checkBackendHealth,

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

    // ---------------------------------------------------------------------
    // A. CATALOG & BROWSING (Static by default, zero console errors)
    // ---------------------------------------------------------------------
    getRestaurants: async function () {
      const cacheKey = 'restaurants_list';
      const cached = getCachedData(cacheKey);

      // Fast path: Fresh cache exists in localStorage (0ms instant render)
      if (cached && cached.isFresh && Array.isArray(cached.data) && cached.data.length >= 10) {
        return cached.data;
      }

      // Stale path: Stale cache exists -> return immediately, refresh in background
      if (cached && Array.isArray(cached.data) && cached.data.length >= 10) {
        setTimeout(async () => {
          try {
            if (USE_BACKEND_FOR_BROWSING) {
              const res = await apiFetch('/api/restaurants', {}, 0);
              if (res.ok) {
                const freshData = await res.json();
                if (Array.isArray(freshData) && freshData.length >= 10) {
                  setCachedData(cacheKey, freshData);
                  window.dispatchEvent(new CustomEvent('foodwala:restaurantsUpdated', { detail: freshData }));
                }
              }
            } else {
              const res = await fetch(resolveDataPath('data/restaurants.json'));
              if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length >= 10) {
                  setCachedData(cacheKey, list);
                  window.dispatchEvent(new CustomEvent('foodwala:restaurantsUpdated', { detail: list }));
                }
              }
            }
          } catch (e) {}
        }, 50);
        return cached.data;
      }

      // No cache: fetch directly
      if (!USE_BACKEND_FOR_BROWSING) {
        try {
          const res = await fetch(resolveDataPath('data/restaurants.json'));
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              setCachedData(cacheKey, list);
              return list;
            }
          }
        } catch (e) {}
      } else {
        try {
          const res = await apiFetch('/api/restaurants', {}, 0);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length >= 10) {
              setCachedData(cacheKey, data);
              return data;
            }
          }
        } catch (e) {}
      }

      // Final fallback to global object if available
      if (typeof window !== 'undefined' && window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
        return window.FOODWALA_RESTAURANTS;
      }
      return [];
    },

    getCategories: async function () {
      const cacheKey = 'categories_list';
      const cached = getCachedData(cacheKey);

      if (cached && cached.isFresh && Array.isArray(cached.data) && cached.data.length > 0) {
        return cached.data;
      }

      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        setTimeout(async () => {
          try {
            if (USE_BACKEND_FOR_BROWSING) {
              const res = await apiFetch('/api/categories', {}, 0);
              if (res.ok) {
                const fresh = await res.json();
                if (Array.isArray(fresh) && fresh.length > 0) setCachedData(cacheKey, fresh);
              }
            } else {
              const res = await fetch(resolveDataPath('data/categories.json'));
              if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) setCachedData(cacheKey, list);
              }
            }
          } catch (e) {}
        }, 50);
        return cached.data;
      }

      if (!USE_BACKEND_FOR_BROWSING) {
        try {
          const res = await fetch(resolveDataPath('data/categories.json'));
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list.length > 0) {
              setCachedData(cacheKey, list);
              return list;
            }
          }
        } catch (e) {}
      } else {
        try {
          const res = await apiFetch('/api/categories', {}, 0);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setCachedData(cacheKey, data);
              return data;
            }
          }
        } catch (e) {}
      }

      return [
        { id: 1, name: 'South Indian' },
        { id: 2, name: 'North Indian' },
        { id: 3, name: 'Biryani' },
        { id: 4, name: 'Burgers & Fast Food' },
        { id: 5, name: 'Desserts & Sweets' },
        { id: 6, name: 'Beverages' }
      ];
    },

    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      const cacheKey = `menu_rest_${rId}`;
      const cached = getCachedData(cacheKey);

      if (cached && cached.isFresh && Array.isArray(cached.data) && cached.data.length > 0) {
        return cached.data;
      }

      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        setTimeout(async () => {
          try {
            if (USE_BACKEND_FOR_BROWSING) {
              const res = await apiFetch(`/api/restaurants/${rId}/menu`, {}, 0);
              if (res.ok) {
                const fresh = await res.json();
                if (Array.isArray(fresh) && fresh.length > 0) setCachedData(cacheKey, fresh);
              }
            }
          } catch (e) {}
        }, 50);
        return cached.data;
      }

      if (!USE_BACKEND_FOR_BROWSING) {
        // Try individual menu file first
        try {
          const res = await fetch(resolveDataPath(`data/menus/${rId}.json`));
          if (res.ok) {
            const items = await res.json();
            if (Array.isArray(items) && items.length > 0) {
              setCachedData(cacheKey, items);
              return items;
            }
          }
        } catch (e) {}

        // Fallback: load full menu-items.json and filter by restaurant ID
        try {
          const fallbackRes = await fetch(resolveDataPath('data/menu-items.json'));
          if (fallbackRes.ok) {
            const allItems = await fallbackRes.json();
            const matched = allItems.filter(m => (m.restaurantId === rId || m.restaurant_id === rId));
            if (matched.length > 0) {
              setCachedData(cacheKey, matched);
              return matched;
            }
          }
        } catch (err) {}
      } else {
        try {
          const res = await apiFetch(`/api/restaurants/${rId}/menu`, {}, 0);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setCachedData(cacheKey, data);
              return data;
            }
          }
        } catch (e) {}
      }

      return [];
    },

    // ---------------------------------------------------------------------
    // B. AUTHENTICATION (Pre-flights /api/health with 3s timeout)
    // ---------------------------------------------------------------------
    checkPhone: async function (rawPhone) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { available: false, error: 'Please enter a valid 10-digit mobile number.' };
      }

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { available: false, error: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch(`/api/auth/check-phone?phone=${encodeURIComponent(normalized)}`, {
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { available: false, error: SERVICE_UNAVAILABLE_MSG };
      }
    },

    sendOtp: async function (rawPhone) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/auth/send-otp', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ phone: normalized })
        });
        return await res.json();
      } catch (err) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    verifyOtp: async function (rawPhone, code) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
      }

      const cleanCode = (code || '').trim();
      if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        return { success: false, error: 'INVALID_CODE', message: 'Please enter the 6-digit verification code.' };
      }

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
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
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    registerMobile: async function (data) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

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
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

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

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
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
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    loginEmail: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      if (!cleanId || !password) {
        return { success: false, message: 'Please enter your email or mobile number and password.' };
      }

      const isPhone = /^[6-9]\d{9}$/.test(cleanId) || /^\+91[6-9]\d{9}$/.test(cleanId);
      const payload = isPhone
        ? { phone: normalizeIndianPhone(cleanId), password: password }
        : { email: cleanId.toLowerCase(), password: password };

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

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
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
      }
      if (newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long.' };
      }

      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
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
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    forgotPassword: async function (emailOrPhone) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: emailOrPhone })
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    resetPassword: async function (token, newPassword) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: token, newPassword: newPassword })
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

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

    // ---------------------------------------------------------------------
    // C. USER ADDRESSES
    // ---------------------------------------------------------------------
    getAddresses: async function () {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) return [];

      try {
        const res = await apiFetch('/api/user/addresses', { headers: getAuthHeader() });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return [];
      }
    },

    saveAddress: async function (addressData) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/user/addresses', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(addressData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    deleteAddress: async function (addressId) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch(`/api/user/addresses/${addressId}`, {
          method: 'DELETE',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    setDefaultAddress: async function (addressId) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch(`/api/user/addresses/${addressId}/default`, {
          method: 'PUT',
          headers: getAuthHeader()
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    // ---------------------------------------------------------------------
    // D. CART & COUPONS
    // ---------------------------------------------------------------------
    getCart: async function () {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) return null;

      try {
        const res = await apiFetch('/api/cart', { headers: getAuthHeader() });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    syncCart: async function (cartData) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) return { success: false };

      try {
        const res = await apiFetch('/api/cart/sync', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(cartData)
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    validateCoupon: async function (code, total, userId) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        return { valid: false, message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, orderTotal: total, userId: userId })
        });
        return await res.json();
      } catch (e) {
        return { valid: false, message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    // ---------------------------------------------------------------------
    // E. ORDERS & RECEIPTS
    // ---------------------------------------------------------------------
    placeOrder: async function (orderPayload) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/orders/place', {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify(orderPayload)
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    getOrders: async function (userId, phone) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) return [];

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
        return [];
      }
    },

    getOrderById: async function (orderId) {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) return null;

      try {
        const res = await apiFetch(`/api/orders/${orderId}`, { headers: getAuthHeader() });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    // ---------------------------------------------------------------------
    // F. ADMIN AUDITS
    // ---------------------------------------------------------------------
    getAdminUsers: async function () {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/admin/users', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    getAdminOrders: async function () {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/admin/orders', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    },

    getAdminLoginHistory: async function () {
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        showErrorToast(SERVICE_UNAVAILABLE_MSG);
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }

      try {
        const res = await apiFetch('/api/admin/login-history', { headers: getAuthHeader() });
        return await res.json();
      } catch (e) {
        return { success: false, error: 'SERVICE_UNAVAILABLE', message: SERVICE_UNAVAILABLE_MSG };
      }
    }
  };

  window.FoodWalaApi = FoodWalaApi;

})(typeof window !== 'undefined' ? window : this);
