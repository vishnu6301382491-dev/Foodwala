/**
 * FoodWala Core Application Module
 * Complete end-to-end management of:
 * - Dynamic data loading (restaurants, menus, categories)
 * - User Authentication & Session State (NO default user)
 * - Single Consistent Location State & Real Browser Geolocation (NO default location)
 * - Multi-Address Management (User-specific)
 * - Cart & Coupon Engine
 * - Razorpay Test Payment & Order Lifecycle
 * - Geolocation & Live Order Tracking Persistence
 */

const FoodWalaApp = (function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEYS = {
    CART: 'foodwala_cart',
    CURRENT_USER: 'foodwala_current_user',
    LOCATION: 'foodwala_location',
    ORDERS: 'foodwala_orders',
    FAVORITES: 'foodwala_favorites',
    COUPON: 'foodwala_applied_coupon'
  };

  // State Caches
  let restaurantsCache = [];
  let menuItemsCache = [];
  let categoriesCache = [];
  const individualMenuCache = new Map();
  let dataReadyPromise = null;

  // 14 Bengaluru Delivery Hubs (Used for manual location selection & landmark geocoding)
  const BENGALURU_LOCATIONS = [
    { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245, landmark: '5th Block, near Sony World Signal' },
    { id: 'indiranagar', name: 'Indiranagar, Bengaluru', shortName: 'Indiranagar', lat: 12.9784, lng: 77.6408, landmark: '100ft Road, near Metro Station' },
    { id: 'whitefield', name: 'Whitefield, Bengaluru', shortName: 'Whitefield', lat: 12.9698, lng: 77.7500, landmark: 'ITPL Main Road' },
    { id: 'mg_road', name: 'MG Road, Bengaluru', shortName: 'MG Road', lat: 12.9756, lng: 77.6066, landmark: 'Brigade Road Junction' },
    { id: 'hsr_layout', name: 'HSR Layout, Bengaluru', shortName: 'HSR Layout', lat: 12.9121, lng: 77.6446, landmark: 'Sector 3, 27th Main' },
    { id: 'malleshwaram', name: 'Malleshwaram, Bengaluru', shortName: 'Malleshwaram', lat: 13.0031, lng: 77.5643, landmark: '8th Cross, Sampige Road' },
    { id: 'jayanagar', name: 'Jayanagar, Bengaluru', shortName: 'Jayanagar', lat: 12.9308, lng: 77.5838, landmark: '4th Block Shopping Complex' },
    { id: 'electronic_city', name: 'Electronic City, Bengaluru', shortName: 'Electronic City', lat: 12.8399, lng: 77.6770, landmark: 'Phase 1, Velankani Drive' },
    { id: 'jp_nagar', name: 'JP Nagar, Bengaluru', shortName: 'JP Nagar', lat: 12.9063, lng: 77.5857, landmark: '2nd Phase, 15th Cross' },
    { id: 'bellandur', name: 'Bellandur, Bengaluru', shortName: 'Bellandur', lat: 12.9304, lng: 77.6784, landmark: 'Outer Ring Road, EcoSpace' },
    { id: 'marathahalli', name: 'Marathahalli, Bengaluru', shortName: 'Marathahalli', lat: 12.9591, lng: 77.6974, landmark: 'Innovative Multiplex Junction' },
    { id: 'hebbal', name: 'Hebbal, Bengaluru', shortName: 'Hebbal', lat: 13.0358, lng: 77.5970, landmark: 'Hebbal Flyover, Esteem Mall' },
    { id: 'basavanagudi', name: 'Basavanagudi, Bengaluru', shortName: 'Basavanagudi', lat: 12.9421, lng: 77.5754, landmark: 'Gandhi Bazaar Main Road' },
    { id: 'rajajinagar', name: 'Rajajinagar, Bengaluru', shortName: 'Rajajinagar', lat: 12.9915, lng: 77.5526, landmark: '1st Block, Dr. Rajkumar Road' }
  ];

  // Coupons
  const AVAILABLE_COUPONS = {
    'FOODWALA50': { discountPercent: 50, maxDiscount: 100, minOrder: 199, desc: '50% OFF up to ₹100' },
    'WELCOME': { discountPercent: 0, flatDiscount: 50, minOrder: 149, desc: 'Flat ₹50 OFF on first order' },
    'BENGALURU100': { discountPercent: 20, maxDiscount: 150, minOrder: 499, desc: '20% OFF up to ₹150' }
  };

  // Safe Storage Accessors
  function getStorage(key, defaultVal) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage error for ' + key, e);
    }
  }

  // --- CLEANUP OBSOLETE DEMO DATA ---
  function cleanupObsoleteDemoData() {
    try {
      // Clean obsolete key 'foodwala_user' if present
      localStorage.removeItem('foodwala_user');
      
      // Clean obsolete fake default location if it has the old dummy format
      const locStr = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (locStr) {
        try {
          const loc = JSON.parse(locStr);
          if (loc && ((loc.id === 'koramangala' && !loc.source) || (loc.landmark && loc.landmark.includes('GPS Accuracy ~83m')))) {
            localStorage.removeItem(STORAGE_KEYS.LOCATION);
          }
        } catch(e) {}
      }
    } catch (e) {}
  }

  cleanupObsoleteDemoData();

  // --- ASYNC DATA LOADER ---
  const RESTAURANTS_CACHE_KEY = 'foodwala_restaurants_cache_v2';

  // Helper to optimize external Unsplash image URLs to modern WebP format and small dimensions
  function optimizeImageUrl(url, width = 400) {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('images.unsplash.com')) {
      if (!url.includes('auto=format')) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}auto=format&fit=crop&w=${width}&q=75`;
      }
    }
    return url;
  }

  // --- FAST CACHED DATA LOADER ---
  async function loadRestaurants() {
    if (restaurantsCache.length > 0) return restaurantsCache;

    // 1. Fetch from MySQL Backend (Single Source of Truth)
    if (window.FoodWalaApi && typeof window.FoodWalaApi.getRestaurants === 'function') {
      try {
        const dbRestaurants = await window.FoodWalaApi.getRestaurants();
        if (Array.isArray(dbRestaurants) && dbRestaurants.length >= 10) {
          restaurantsCache = dbRestaurants;
          try {
            sessionStorage.setItem(RESTAURANTS_CACHE_KEY, JSON.stringify(restaurantsCache));
          } catch (e) {}
          return restaurantsCache;
        }
      } catch (e) {
        console.warn('[FoodWalaApp] Could not fetch restaurants from MySQL, trying fallback cache:', e);
      }
    }

    // 2. Check sessionStorage / localStorage for instant 0ms retrieval
    try {
      const cached = sessionStorage.getItem(RESTAURANTS_CACHE_KEY) || localStorage.getItem(RESTAURANTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 10) {
          restaurantsCache = parsed;
          return restaurantsCache;
        }
      }
    } catch (e) {}

    // 3. Fallback to static restaurants.json (Full 105 Bengaluru restaurants)
    try {
      const restRes = await fetch('./data/restaurants.json');
      if (restRes.ok) {
        const fullList = await restRes.json();
        if (Array.isArray(fullList) && fullList.length > 0) {
          restaurantsCache = fullList;
          try {
            sessionStorage.setItem(RESTAURANTS_CACHE_KEY, JSON.stringify(restaurantsCache));
          } catch (e) {}
          return restaurantsCache;
        }
      }
    } catch (e) {}

    // 4. Fallback to global window objects
    if (typeof window !== 'undefined' && window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
      restaurantsCache = window.FOODWALA_RESTAURANTS;
    } else if (typeof window !== 'undefined' && window.FOODWALA_FEATURED_8) {
      restaurantsCache = window.FOODWALA_FEATURED_8;
    }

    return restaurantsCache;
  }

  // --- FAST CACHED MENU ITEMS LOADER ---
  async function loadMenuItems() {
    if (menuItemsCache.length > 0) return menuItemsCache;

    try {
      const cached = sessionStorage.getItem('foodwala_menus_cache') || localStorage.getItem('foodwala_menus_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          menuItemsCache = parsed;
          return menuItemsCache;
        }
      }
    } catch (e) {}

    try {
      const menuRes = await fetch('./data/menu-items.json');
      if (menuRes.ok) {
        const fullMenus = await menuRes.json();
        if (Array.isArray(fullMenus) && fullMenus.length > 0) {
          menuItemsCache = fullMenus;
          try {
            sessionStorage.setItem('foodwala_menus_cache', JSON.stringify(menuItemsCache));
          } catch (e) {}
          return menuItemsCache;
        }
      }
    } catch (e) {}

    if (typeof window !== 'undefined' && window.FOODWALA_MENUS && window.FOODWALA_MENUS.length > 0) {
      menuItemsCache = window.FOODWALA_MENUS;
    }
    return menuItemsCache;
  }

  function loadData() {
    if (dataReadyPromise) return dataReadyPromise;

    dataReadyPromise = new Promise(async (resolve) => {
      // Parallel load restaurants and menu items
      await Promise.all([
        loadRestaurants(),
        loadMenuItems()
      ]);

      // Parallel fetch for categories
      if (window.FoodWalaApi && typeof window.FoodWalaApi.getCategories === 'function') {
        try {
          const dbCats = await window.FoodWalaApi.getCategories();
          if (Array.isArray(dbCats) && dbCats.length > 0) {
            categoriesCache = dbCats;
          }
        } catch (e) {}
      }

      if (categoriesCache.length === 0) {
        try {
          const catRes = await fetch('./data/categories.json');
          if (catRes.ok) categoriesCache = await catRes.json();
        } catch (e) {}
      }

      // Fire dataLoaded event immediately so restaurants can render
      window.dispatchEvent(new CustomEvent('foodwala:dataLoaded', {
        detail: {
          restaurantsCount: restaurantsCache.length,
          menuItemsCount: menuItemsCache.length
        }
      }));

      // Resolve immediately for UI rendering
      resolve({
        restaurants: restaurantsCache,
        menuItems: menuItemsCache,
        categories: categoriesCache
      });
    });

    return dataReadyPromise;
  }

  async function getRestaurantMenu(restaurantId) {
    const id = parseInt(restaurantId, 10);

    // 0. Check live local manager overrides first (dish additions, price updates, stock toggles)
    try {
      const managerOverride = localStorage.getItem('foodwala_mock_restaurant_menu_' + id);
      if (managerOverride) {
        const parsed = JSON.parse(managerOverride);
        if (Array.isArray(parsed) && parsed.length > 0) {
          individualMenuCache.set(id, parsed);
          return parsed;
        }
      }
    } catch (e) {}

    if (individualMenuCache.has(id)) {
      return individualMenuCache.get(id);
    }

    // 1. Fetch from MySQL Backend via FoodWalaApi
    if (window.FoodWalaApi && typeof window.FoodWalaApi.getRestaurantMenu === 'function') {
      try {
        const dbMenu = await window.FoodWalaApi.getRestaurantMenu(id);
        if (Array.isArray(dbMenu) && dbMenu.length > 0) {
          individualMenuCache.set(id, dbMenu);
          return dbMenu;
        }
      } catch (e) {
        console.warn(`[FoodWalaApp] Could not fetch menu for restaurant ${id} from MySQL:`, e);
      }
    }

    // 2. Fallback to local files
    try {
      const res = await fetch(`./data/menus/${id}.json`);
      if (res.ok) {
        const items = await res.json();
        individualMenuCache.set(id, items);
        return items;
      }
    } catch (e) {}

    await loadData();
    const filtered = menuItemsCache.filter(m => (m.restaurantId === id || m.restaurant_id === id));
    individualMenuCache.set(id, filtered);
    return filtered;
  }

  // Live cache invalidation on restaurant partner updates
  if (typeof window !== 'undefined') {
    window.addEventListener('foodwala:menuUpdated', function (e) {
      if (e.detail && e.detail.restaurantId) {
        individualMenuCache.delete(parseInt(e.detail.restaurantId, 10));
      } else {
        individualMenuCache.clear();
      }
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'foodwala_menu_last_updated' || (e.key && e.key.startsWith('foodwala_mock_restaurant_menu_'))) {
        individualMenuCache.clear();
      }
    });
  }

  // --- LOCATION MODULE (NO FAKE DEFAULT) ---
  const Location = {
    getBengaluruHubs: function () {
      return BENGALURU_LOCATIONS;
    },

    getCurrentLocation: function () {
      // Returns null if user has not selected location or granted GPS
      const loc = getStorage(STORAGE_KEYS.LOCATION, null);
      if (loc && loc.latitude && loc.longitude) {
        return loc;
      }
      return null;
    },

    setManualLocation: function (hubId) {
      const hub = BENGALURU_LOCATIONS.find(h => h.id === hubId || h.shortName.toLowerCase() === (hubId || '').toLowerCase());
      if (!hub) return null;

      const locState = {
        latitude: hub.lat,
        longitude: hub.lng,
        accuracy: null,
        shortName: hub.shortName,
        address: hub.name,
        source: 'manual'
      };

      setStorage(STORAGE_KEYS.LOCATION, locState);
      window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: locState }));
      updateLocationNavUI();
      return locState;
    },

    setSavedAddressLocation: function (savedAddress) {
      if (!savedAddress) return null;
      const locState = {
        latitude: savedAddress.latitude || savedAddress.lat || 12.9716,
        longitude: savedAddress.longitude || savedAddress.lng || 77.5946,
        accuracy: null,
        shortName: (savedAddress.type || 'Home') + ': ' + (savedAddress.area || 'Bengaluru'),
        address: savedAddress.addressLine || savedAddress.address || 'Bengaluru',
        source: 'saved-address'
      };
      setStorage(STORAGE_KEYS.LOCATION, locState);
      window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: locState }));
      updateLocationNavUI();
      return locState;
    },

    clearLocation: function () {
      localStorage.removeItem(STORAGE_KEYS.LOCATION);
      window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: null }));
      updateLocationNavUI();
    },

    detectCurrentLocation: function (onSuccess, onError) {
      console.log("[FoodWala] Requesting current location via browser Geolocation API...");

      if (!navigator.geolocation) {
        const msg = "Location services are not supported by this browser.";
        console.error("[FoodWala] Location error:", msg);
        if (onError) onError(msg);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;

          console.log("[FoodWala] Location success:", {
            latitude: lat,
            longitude: lng,
            accuracy: accuracy
          });

          // Instantly match to closest Bengaluru Hub to avoid slow/failing external reverse-geocoders
          let shortName = "Current Location";
          let fullAddress = `Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          let closestHub = null;
          let minDistance = Infinity;
          for (const hub of BENGALURU_LOCATIONS) {
            const dist = Math.hypot(hub.lat - lat, hub.lng - lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestHub = hub;
            }
          }

          if (closestHub && minDistance < 0.15) {
            shortName = closestHub.shortName;
            fullAddress = `${closestHub.name} (Near ${closestHub.landmark})`;
          }

          const locationState = {
            latitude: lat,
            longitude: lng,
            accuracy: accuracy,
            shortName: shortName,
            address: fullAddress,
            source: "gps"
          };

          setStorage(STORAGE_KEYS.LOCATION, locationState);
          window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: locationState }));
          updateLocationNavUI();

          if (onSuccess) onSuccess(locationState);
        },
        (error) => {
          console.error("[FoodWala] Location error:", error);
          let errorMsg = "Unable to retrieve your location. Please try again.";
          if (error.code === 1) { // PERMISSION_DENIED
            errorMsg = "Location permission was denied. Please allow location access in your browser settings or enter your address manually.";
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            errorMsg = "Your current location could not be determined. Please try again.";
          } else if (error.code === 3) { // TIMEOUT
            errorMsg = "Location request timed out. Please try again.";
          }
          if (onError) onError(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    },

    calculateDistance: function (lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 3.2;
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    }
  };

  // --- AUTH MODULE (NO DEFAULT USER - REAL JAVA BACKEND INTEGRATION) ---
  const Auth = {
    // Resolve API Base URL (Window override -> Stored config -> Localhost Tomcat -> Null for unconfigured remote)
    getApiBaseUrl: function () {
      // 1. Explicit window override
      if (typeof window !== 'undefined' && window.FOODWALA_API_URL) {
        return window.FOODWALA_API_URL.replace(/\/+$/, '');
      }
      if (typeof window !== 'undefined' && window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_URL) {
        return window.FOODWALA_CONFIG.API_URL.replace(/\/+$/, '');
      }

      // 2. Explicit localStorage override (for developer runtime testing of public backend)
      try {
        const storedUrl = localStorage.getItem('foodwala_api_base_url');
        if (storedUrl && typeof storedUrl === 'string' && storedUrl.trim().length > 0) {
          return storedUrl.trim().replace(/\/+$/, '');
        }
      } catch (e) {}

      // 3. Unified Backend Environment: Localhost (5000) or Render (https://foodwala-backend.onrender.com)
      if (typeof window !== 'undefined') {
        if (window.FoodWalaApi && window.FoodWalaApi.API_BASE_URL) {
          return window.FoodWalaApi.API_BASE_URL;
        }
        if (window.FOODWALA_BACKEND_URL) return window.FOODWALA_BACKEND_URL.replace(/\/+$/, '');
        if (window.FOODWALA_API_URL) return window.FOODWALA_API_URL.replace(/\/+$/, '');
        return (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'https://foodwala-backend.onrender.com';
      }
      return 'https://foodwala-backend.onrender.com';
    },

    get apiBaseUrl() {
      return this.getApiBaseUrl();
    },

    // Normalize Indian phone numbers to E.164 (+91XXXXXXXXXX)
    normalizeIndianPhone: function (rawPhone) {
      if (!rawPhone || typeof rawPhone !== 'string') return null;
      const digits = rawPhone.replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.substring(2))) {
        return '+' + digits;
      }
      if (digits.startsWith('0') && digits.length === 11 && /^[6-9]/.test(digits.substring(1))) {
        return '+91' + digits.substring(1);
      }
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        return '+91' + digits;
      }
      return null;
    },

    normalizePhone: function (rawPhone) {
      return this.normalizeIndianPhone(rawPhone);
    },

    getCurrentUser: function () {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.getCurrentUser === "function") {
        const apiUser = window.FoodWalaApi.getCurrentUser();
        if (apiUser) return apiUser;
      }
      // Returns null if no authenticated user exists or user object is malformed
      const user = getStorage(STORAGE_KEYS.CURRENT_USER, null);
      if (user && typeof user === 'object' && user.name && String(user.name).trim().length > 0) {
        const hasEmail = user.email && String(user.email).trim().length > 0;
        const hasPhone = user.phone && String(user.phone).trim().length > 0;
        if (hasEmail || hasPhone) {
          return user;
        }
      }
      return null;
    },

    isLoggedIn: function () {
      return this.getCurrentUser() !== null;
    },

    requireAuth: function (redirectTarget = './checkout.html') {
      const user = this.getCurrentUser();
      if (!user) {
        try {
          localStorage.setItem('foodwala_post_login_redirect', redirectTarget);
        } catch (e) {}
        showToast('Please sign in to proceed with your order.', 'warning');
        setTimeout(() => {
          window.location.href = `./login.html?redirect=${encodeURIComponent(redirectTarget)}`;
        }, 400);
        return false;
      }
      return true;
    },

    sendOtp: async function (rawPhone) {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.sendOtp === "function") {
        return await window.FoodWalaApi.sendOtp(rawPhone);
      }
      const normalized = this.normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      const apiBase = this.getApiBaseUrl();

      if (!apiBase) {
        return {
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Account and order service is temporarily unavailable. Please try again shortly.'
        };
      }

      const endpoint = apiBase.replace(/\/+$/, '') + '/api/auth/send-otp';

      console.log('[FoodWala OTP] Sending OTP...');
      console.log('[FoodWala OTP] API:', endpoint);
      console.log('[FoodWala OTP] Phone:', normalized);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ phone: normalized })
        });

        console.log('[FoodWala OTP] Response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('[FoodWala OTP] Response:', data);
          return data;
        }

        // Specifically detect and log HTTP 405 Method Not Allowed
        if (res.status === 405) {
          console.error('[FoodWala OTP] Request URL:', endpoint);
          console.error('[FoodWala OTP] Status Code: 405 (Method Not Allowed)');
          console.error('[FoodWala OTP] OTP API URL is pointing to a server that does not support this POST endpoint.');
          console.error('[FoodWala OTP] The POST request was sent to a static host or invalid endpoint instead of the Java Servlet.');
          return {
            success: false,
            error: 'METHOD_NOT_ALLOWED',
            message: 'OTP API URL is pointing to a server that does not support this POST endpoint. Please check your Java backend configuration.'
          };
        }

        let errData = {};
        try {
          errData = await res.json();
        } catch (jsonErr) {
          console.error('[FoodWala OTP] Error parsing response body:', jsonErr);
        }

        console.error('[FoodWala OTP] Request URL:', endpoint);
        console.error('[FoodWala OTP] Status Code:', res.status);
        console.error('[FoodWala OTP] Response Body:', errData);

        let message = errData.message;
        if (!message) {
          if (res.status === 400) message = 'Invalid mobile number or request format.';
          else if (res.status === 429) message = 'Too many OTP requests. Please wait 30 seconds before retrying.';
          else if (res.status === 500) message = 'Backend error while generating OTP. Please try again later.';
          else message = 'Unable to send OTP right now. Please try again.';
        }

        return {
          success: false,
          error: errData.error || 'API_ERROR',
          message: message,
          cooldownRemaining: errData.cooldownRemaining
        };
      } catch (networkErr) {
        console.error('[FoodWala OTP] Network error:', networkErr);
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Account and order service is temporarily unavailable. Please try again shortly.'
        };
      }
    },

    verifyOtp: async function (rawPhone, otp) {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.verifyOtp === "function") {
        return await window.FoodWalaApi.verifyOtp(rawPhone, otp);
      }
      const normalized = this.normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
      }

      const cleanOtp = (otp || '').trim();
      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return { success: false, error: 'INVALID_OTP_FORMAT', message: 'Please enter the 6-digit verification code.' };
      }

      const apiBase = this.getApiBaseUrl();

      if (apiBase === null) {
        console.error('[FoodWala OTP] Java Backend is not configured for GitHub Pages hosting.');
        return {
          success: false,
          error: 'BACKEND_NOT_CONFIGURED',
          message: 'GitHub Pages is static and cannot process OTP verification directly. Please run FoodWala locally on Tomcat.'
        };
      }

      const endpoint = apiBase.replace(/\/+$/, '') + '/api/auth/verify-otp';

      console.log('[FoodWala OTP] Verifying OTP...');
      console.log('[FoodWala OTP] API:', endpoint);
      console.log('[FoodWala OTP] Phone:', normalized);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ phone: normalized, otp: cleanOtp })
        });

        console.log('[FoodWala OTP] Verify Response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('[FoodWala OTP] Verify Response: OK, isNewUser:', data.isNewUser);
          if (!data.isNewUser && data.user) {
            setStorage(STORAGE_KEYS.CURRENT_USER, data.user);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
            updateUserNavUI();
          }
          return data;
        }

        if (res.status === 405) {
          console.error('[FoodWala OTP] Verify Request URL:', endpoint);
          console.error('[FoodWala OTP] Verify Status Code: 405 (Method Not Allowed)');
          console.error('[FoodWala OTP] OTP API URL is pointing to a server that does not support this POST endpoint.');
          return {
            success: false,
            error: 'METHOD_NOT_ALLOWED',
            message: 'OTP API URL is pointing to a server that does not support this POST endpoint.'
          };
        }

        let errData = {};
        try {
          errData = await res.json();
        } catch (jsonErr) {}

        console.error('[FoodWala OTP] Verify Request URL:', endpoint);
        console.error('[FoodWala OTP] Verify Status Code:', res.status);
        console.error('[FoodWala OTP] Verify Response Body:', errData);

        let message = errData.message;
        if (!message) {
          if (res.status === 400) message = 'Incorrect OTP or OTP expired. Please try again.';
          else if (res.status === 401) message = 'Incorrect OTP. Please check and try again.';
          else if (res.status === 429) message = 'Too many attempts. Please request a new OTP.';
          else message = 'Verification failed. Please try again.';
        }

        return {
          success: false,
          error: errData.error || 'VERIFY_FAILED',
          message: message,
          remainingAttempts: errData.attemptsRemaining || errData.remainingAttempts
        };
      } catch (networkErr) {
        console.error('[FoodWala OTP] Network error during verification:', networkErr);
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Account and order service is temporarily unavailable. Please try again shortly.'
        };
      }
    },

    registerWithMobile: function (rawPhone, name, email, address) {
      const normalized = this.normalizePhone(rawPhone);
      if (!normalized) return null;

      const cleanName = (name || '').trim() || 'Food Lover';
      const cleanEmail = (email && email.trim()) ? email.trim().toLowerCase() : null;

      const newUser = {
        userId: Date.now(),
        name: cleanName,
        phone: normalized,
        email: cleanEmail,
        role: 'CUSTOMER',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        addresses: address ? [
          {
            id: 'addr_' + Date.now(),
            userId: Date.now(),
            label: 'Home',
            type: 'Home',
            fullName: cleanName,
            phone: normalized,
            houseNo: '',
            street: address,
            area: 'Bengaluru',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            latitude: 12.9716,
            longitude: 77.5946,
            addressLine: address + ', Bengaluru, Karnataka - 560001',
            isDefault: true
          }
        ] : []
      };

      // Save to registered users pool
      const registered = getStorage('foodwala_registered_users', []);
      const idx = registered.findIndex(u => u.phone === normalized || (cleanEmail && u.email === cleanEmail));
      if (idx > -1) {
        registered[idx] = { ...registered[idx], ...newUser };
      } else {
        registered.push(newUser);
      }
      setStorage('foodwala_registered_users', registered);

      setStorage(STORAGE_KEYS.CURRENT_USER, newUser);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));
      updateUserNavUI();
      return newUser;
    },

    login: async function (identifier, password) {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.loginEmail === "function") {
        return await window.FoodWalaApi.loginEmail(identifier, password);
      }
      if (!identifier || !identifier.trim() || !password) {
        return { success: false, message: 'Please enter your email/mobile number and password.' };
      }
      const cleanIdentifier = identifier.trim();
      const apiBase = this.getApiBaseUrl();

      // Check if running on GitHub Pages without configured public Java Backend
      if (apiBase === null) {
        console.warn('[FoodWala Auth] Java Backend is not configured for remote static hosting.');
        const namePart = cleanIdentifier.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const user = {
          userId: Date.now(),
          name: namePart,
          email: cleanIdentifier.includes('@') ? cleanIdentifier.toLowerCase() : null,
          phone: !cleanIdentifier.includes('@') ? cleanIdentifier : null,
          role: 'CUSTOMER',
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          addresses: []
        };
        setStorage(STORAGE_KEYS.CURRENT_USER, user);
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
        updateUserNavUI();
        return { success: true, user: user };
      }

      const endpoint = apiBase.replace(/\/+$/, '') + '/api/auth/login';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ identifier: cleanIdentifier, password: password })
        });

        let data = {};
        try {
          data = await res.json();
        } catch (e) {}

        if (res.ok && data.success && data.user) {
          // Store safe user data without credentials
          const safeUser = {
            userId: data.user.userId,
            name: data.user.name || data.user.username,
            username: data.user.username,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role || 'CUSTOMER',
            memberSince: data.user.memberSince || 'Active Member',
            addresses: data.user.addresses || []
          };
          setStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));
          updateUserNavUI();
          return { success: true, user: safeUser };
        } else {
          return {
            success: false,
            message: data.message || 'Invalid email/mobile number or password.'
          };
        }
      } catch (err) {
        console.error('[FoodWala Auth] Login request failed:', err);
        return {
          success: false,
          message: 'Unable to connect to FoodWala authentication server. Please check your connection or Tomcat server.'
        };
      }
    },

    loginAsDemo: function (roleType) {
      // Triggered only upon explicit demo button click in login.html
      const demoProfiles = {
        customer: {
          userId: 101,
          name: 'Rahul Sharma',
          email: 'customer@foodwala.com',
          phone: '+919876543210',
          role: 'CUSTOMER',
          isDemo: true,
          memberSince: 'March 2024',
          addresses: [
            {
              id: 'addr_1',
              userId: 101,
              label: 'Home',
              type: 'Home',
              fullName: 'Rahul Sharma',
              phone: '+919876543210',
              houseNo: 'Flat 402, Sunshine Heights',
              street: '5th Block, 80ft Road',
              area: 'Koramangala',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560095',
              latitude: 12.9352,
              longitude: 77.6245,
              addressLine: 'Flat 402, Sunshine Heights, 5th Block, 80ft Road, Koramangala, Bengaluru - 560095',
              isDefault: true
            }
          ]
        },
        restaurant: {
          userId: 102,
          name: 'Vidyarthi Bhavan Manager',
          email: 'vidyarthi@foodwala.com',
          phone: '+918026677588',
          role: 'RESTAURANT_ADMIN',
          isDemo: true,
          memberSince: 'January 2024',
          addresses: []
        },
        partner: {
          userId: 103,
          name: 'Ramesh Kumar',
          email: 'partner@foodwala.com',
          phone: '+919123456789',
          role: 'DELIVERY_PARTNER',
          isDemo: true,
          memberSince: 'June 2024',
          vehicle: 'Royal Enfield (KA 01 AB 1234)',
          rating: 4.9,
          addresses: []
        }
      };

      const user = demoProfiles[roleType] || demoProfiles.customer;
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      updateUserNavUI();
      return user;
    },

    logout: async function () {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.logout === "function") {
        await window.FoodWalaApi.logout();
      }
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      updateUserNavUI();
      showToast('You have been signed out.', 'success');
      setTimeout(() => {
        window.location.href = './login.html';
      }, 400);
    },

    updateProfile: function (updatedFields) {
      const user = this.getCurrentUser();
      if (!user) return null;
      Object.assign(user, updatedFields);
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      updateUserNavUI();
      return user;
    },

    register: async function (name, email, phone, password, addressText, confirmPassword, role) {
      if (typeof window !== "undefined" && window.FoodWalaApi && typeof window.FoodWalaApi.signup === "function") {
        return await window.FoodWalaApi.signup({
          name: name,
          email: email,
          phone: phone,
          password: password,
          address: addressText,
          confirmPassword: confirmPassword,
          role: role || 'customer'
        });
      }
      const cleanName = (name || '').trim();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').trim();

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Name, email and password are required.' };
      }

      if (confirmPassword && password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
      }

      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
      }

      const apiBase = this.getApiBaseUrl();

      // Check if running on GitHub Pages without configured public Java Backend
      if (apiBase === null) {
        console.warn('[FoodWala Auth] Java Backend is not configured for remote static hosting.');
        const newUser = {
          userId: Date.now(),
          name: cleanName || 'Food Lover',
          email: cleanEmail,
          phone: cleanPhone || '+91 98765 00000',
          role: (role || 'CUSTOMER').toUpperCase(),
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          addresses: addressText ? [
            {
              id: 'addr_' + Date.now(),
              userId: Date.now(),
              label: 'Home',
              type: 'Home',
              fullName: cleanName || 'Food Lover',
              phone: cleanPhone || '+91 98765 00000',
              houseNo: '',
              street: addressText,
              area: 'Bengaluru',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
              latitude: 12.9716,
              longitude: 77.5946,
              addressLine: addressText + ', Bengaluru, Karnataka - 560001',
              isDefault: true
            }
          ] : []
        };
        setStorage(STORAGE_KEYS.CURRENT_USER, newUser);
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));
        updateUserNavUI();
        return { success: true, user: newUser };
      }

      const endpoint = apiBase.replace(/\/+$/, '') + '/api/auth/register';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            password: password,
            confirmPassword: confirmPassword || password,
            address: addressText || ''
          })
        });

        let data = {};
        try {
          data = await res.json();
        } catch (e) {}

        if (res.ok && data.success && data.user) {
          const safeUser = {
            userId: data.user.userId,
            name: data.user.name || data.user.username,
            username: data.user.username,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role || 'CUSTOMER',
            memberSince: 'Active Member',
            addresses: addressText ? [
              {
                id: 'addr_' + Date.now(),
                userId: data.user.userId,
                label: 'Home',
                type: 'Home',
                fullName: cleanName,
                phone: cleanPhone,
                houseNo: '',
                street: addressText,
                area: 'Bengaluru',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
                latitude: 12.9716,
                longitude: 77.5946,
                addressLine: addressText + ', Bengaluru, Karnataka - 560001',
                isDefault: true
              }
            ] : []
          };
          setStorage(STORAGE_KEYS.CURRENT_USER, safeUser);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));
          updateUserNavUI();
          return { success: true, user: safeUser };
        } else {
          return {
            success: false,
            message: data.message || 'Registration failed. Please check your details.'
          };
        }
      } catch (err) {
        console.error('[FoodWala Auth] Register request failed:', err);
        return {
          success: false,
          message: 'Unable to connect to FoodWala server. Please check your connection or Tomcat server.'
        };
      }
    },

    addAddress: function (addressObj) {
      const user = this.getCurrentUser();
      if (!user) return null;
      if (!user.addresses) user.addresses = [];

      const id = addressObj.id || addressObj.address_id || ('addr_' + Date.now());
      const isFirst = user.addresses.length === 0;

      const formattedLine = `${addressObj.houseNo ? addressObj.houseNo + ', ' : ''}${addressObj.street ? addressObj.street + ', ' : ''}${addressObj.area ? addressObj.area + ', ' : ''}${addressObj.city || 'Bengaluru'}, ${addressObj.state || 'Karnataka'} - ${addressObj.pincode || '560001'}`;

      const newAddr = {
        id: id,
        address_id: id,
        userId: user.userId,
        label: addressObj.label || addressObj.type || 'Home',
        type: addressObj.type || 'Home',
        fullName: addressObj.fullName || user.name,
        phone: addressObj.phone || user.phone,
        houseNo: addressObj.houseNo || '',
        street: addressObj.street || '',
        area: addressObj.area || 'Bengaluru',
        landmark: addressObj.landmark || '',
        city: addressObj.city || 'Bengaluru',
        state: addressObj.state || 'Karnataka',
        pincode: addressObj.pincode || '560001',
        latitude: addressObj.latitude || addressObj.lat || 12.9716,
        longitude: addressObj.longitude || addressObj.lng || 77.5946,
        addressLine: addressObj.addressLine || formattedLine,
        isDefault: addressObj.isDefault !== undefined ? addressObj.isDefault : isFirst
      };

      if (newAddr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      user.addresses.push(newAddr);
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));

      // MySQL Database write via FoodWalaApi
      if (window.FoodWalaApi && typeof window.FoodWalaApi.saveAddress === 'function') {
        window.FoodWalaApi.saveAddress(newAddr).catch(e => console.warn('[Address Save Warning]:', e));
      }

      return newAddr;
    },

    updateAddress: function (addressId, addressObj) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return null;
      const idx = user.addresses.findIndex(a => (String(a.id) === String(addressId) || String(a.address_id) === String(addressId)));
      if (idx === -1) return null;

      const formattedLine = `${addressObj.houseNo ? addressObj.houseNo + ', ' : ''}${addressObj.street ? addressObj.street + ', ' : ''}${addressObj.area ? addressObj.area + ', ' : ''}${addressObj.city || 'Bengaluru'}, ${addressObj.state || 'Karnataka'} - ${addressObj.pincode || '560001'}`;

      if (addressObj.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      user.addresses[idx] = {
        ...user.addresses[idx],
        ...addressObj,
        addressLine: addressObj.addressLine || formattedLine
      };

      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));

      if (window.FoodWalaApi && typeof window.FoodWalaApi.saveAddress === 'function') {
        window.FoodWalaApi.saveAddress(user.addresses[idx]).catch(e => console.warn('[Address Update Warning]:', e));
      }

      return user.addresses[idx];
    },

    deleteAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return false;
      user.addresses = user.addresses.filter(a => (String(a.id) !== String(addressId) && String(a.address_id) !== String(addressId)));
      if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));

      if (window.FoodWalaApi && typeof window.FoodWalaApi.deleteAddress === 'function') {
        window.FoodWalaApi.deleteAddress(addressId).catch(e => console.warn('[Address Delete Warning]:', e));
      }

      return true;
    },

    setDefaultAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return;
      user.addresses.forEach(a => a.isDefault = (String(a.id) === String(addressId) || String(a.address_id) === String(addressId)));
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));

      if (window.FoodWalaApi && typeof window.FoodWalaApi.setDefaultAddress === 'function') {
        window.FoodWalaApi.setDefaultAddress(addressId).catch(e => console.warn('[Address Default Warning]:', e));
      }
    }
  };

  // --- CART MODULE ---
  const Cart = {
    getCart: function () {
      return getStorage(STORAGE_KEYS.CART, {
        restaurantId: null,
        restaurantName: '',
        restaurantAddress: '',
        restaurantImage: '',
        items: []
      });
    },
    saveCart: function (cart) {
      setStorage(STORAGE_KEYS.CART, cart);
      window.dispatchEvent(new CustomEvent('foodwala:cartChanged', { detail: cart }));
      this.updateCartBadge();
    },
    getItemCount: function () {
      const cart = this.getCart();
      return cart.items ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    },
    getItemQuantity: function (menuId) {
      const cart = this.getCart();
      if (!cart.items) return 0;
      const found = cart.items.find(i => i.menuId === menuId || i.id === menuId);
      return found ? found.quantity : 0;
    },
    addItem: async function (item, restaurant) {
      // Prevent adding out-of-stock items
      const isAvail = (item.is_available === 1 || item.is_available === true || item.isAvailable === true || (item.is_available === undefined && item.isAvailable === undefined));
      if (!isAvail) {
        if (typeof showToast === 'function') {
          showToast(`Sorry, "${item.name || item.itemName}" is currently out of stock.`, 'warning');
        } else if (typeof window.showToast === 'function') {
          window.showToast(`Sorry, "${item.name || item.itemName}" is currently out of stock.`, 'warning');
        }
        return false;
      }

      let cart = this.getCart();
      const rId = item.restaurantId || restaurant.restaurantId || restaurant.id;

      if (cart.items && cart.items.length > 0 && cart.restaurantId && cart.restaurantId !== rId) {
        let confirmed = true;
        if (typeof window.showConfirm === 'function') {
          confirmed = await window.showConfirm({
            title: 'Start a new cart?',
            message: `Your cart has items from <b>${cart.restaurantName}</b>. Clear it to order from <b>${restaurant.name}</b>?`,
            confirmText: 'Yes, clear cart',
            cancelText: 'Keep my cart',
            icon: 'bi-cart-x-fill',
            type: 'danger'
          });
        } else if (typeof window.confirm === 'function') {
          confirmed = window.confirm(`Your cart has items from "${cart.restaurantName}". Clear it to order from "${restaurant.name}"?`);
        }
        if (!confirmed) {
          return false;
        }
        cart = {
          restaurantId: rId,
          restaurantName: restaurant.name || '',
          restaurantAddress: restaurant.address || restaurant.area || '',
          restaurantImage: restaurant.imagePath || restaurant.image || '',
          items: []
        };
      }

      if (!cart.restaurantId) {
        cart.restaurantId = rId;
        cart.restaurantName = restaurant ? restaurant.name : '';
        cart.restaurantAddress = restaurant ? (restaurant.address || restaurant.area) : '';
        cart.restaurantImage = restaurant ? (restaurant.imagePath || restaurant.image) : '';
      }

      const mId = item.menuId || item.id;
      const existingIndex = cart.items.findIndex(i => (i.menuId === mId || i.id === mId));
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += 1;
      } else {
        cart.items.push({
          id: mId,
          menuId: mId,
          restaurantId: rId,
          name: item.name || item.itemName,
          price: parseFloat(item.price),
          isVeg: !!item.isVeg,
          category: item.category || '',
          imagePath: item.imagePath || item.image || '',
          quantity: 1
        });
      }

      this.saveCart(cart);
      return true;
    },
    updateQuantity: function (menuId, delta) {
      const cart = this.getCart();
      if (!cart.items) return;

      const idx = cart.items.findIndex(i => i.menuId === menuId || i.id === menuId);
      if (idx > -1) {
        cart.items[idx].quantity += delta;
        if (cart.items[idx].quantity <= 0) {
          cart.items.splice(idx, 1);
        }
      }

      if (cart.items.length === 0) {
        cart.restaurantId = null;
        cart.restaurantName = '';
        cart.restaurantAddress = '';
        cart.restaurantImage = '';
      }

      this.saveCart(cart);
    },
    removeItem: function (menuId) {
      const cart = this.getCart();
      cart.items = cart.items.filter(i => i.menuId !== menuId && i.id !== menuId);
      if (cart.items.length === 0) {
        cart.restaurantId = null;
        cart.restaurantName = '';
      }
      this.saveCart(cart);
    },
    clearCart: function () {
      this.saveCart({
        restaurantId: null,
        restaurantName: '',
        restaurantAddress: '',
        restaurantImage: '',
        items: []
      });
      localStorage.removeItem(STORAGE_KEYS.COUPON);
    },
    getAppliedCoupon: function () {
      return getStorage(STORAGE_KEYS.COUPON, null);
    },
    applyCoupon: function (code) {
      if (!code || !code.trim()) {
        return { success: false, message: 'Please enter a coupon code.' };
      }
      const cleanCode = code.toUpperCase().trim();
      const coupon = AVAILABLE_COUPONS[cleanCode];
      if (!coupon) {
        return { success: false, message: 'Invalid coupon code. Try FOODWALA50 or WELCOME.' };
      }
      const totals = this.getBillTotals(false);
      if (totals.itemTotal < coupon.minOrder) {
        return { success: false, message: `Minimum order of ₹${coupon.minOrder} required for ${cleanCode}.` };
      }
      const couponObj = { code: cleanCode, ...coupon };
      setStorage(STORAGE_KEYS.COUPON, couponObj);
      window.dispatchEvent(new CustomEvent('foodwala:cartChanged', { detail: this.getCart() }));
      return { success: true, message: `Coupon ${cleanCode} applied!`, coupon: couponObj };
    },
    removeCoupon: function () {
      localStorage.removeItem(STORAGE_KEYS.COUPON);
      window.dispatchEvent(new CustomEvent('foodwala:cartChanged', { detail: this.getCart() }));
    },
    getBillTotals: function (withCoupon = true) {
      const cart = this.getCart();
      const itemTotal = (cart.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      let deliveryFee = itemTotal > 250 || itemTotal === 0 ? 0 : 35;
      let platformFee = itemTotal > 0 ? 5 : 0;
      let gst = Math.round(itemTotal * 0.05);
      
      let discount = 0;
      const coupon = withCoupon ? this.getAppliedCoupon() : null;
      if (coupon && itemTotal >= coupon.minOrder) {
        if (coupon.flatDiscount) {
          discount = coupon.flatDiscount;
        } else if (coupon.discountPercent) {
          discount = Math.min(coupon.maxDiscount, Math.round((itemTotal * coupon.discountPercent) / 100));
        }
      }

      const grandTotal = Math.max(0, itemTotal + deliveryFee + platformFee + gst - discount);

      return {
        itemTotal,
        deliveryFee,
        platformFee,
        gst,
        discount,
        coupon,
        grandTotal
      };
    },
    updateCartBadge: function () {
      const count = this.getItemCount();
      document.querySelectorAll('.js-cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-flex' : 'none';
      });
      document.querySelectorAll('.js-cart-total').forEach(el => {
        const totals = this.getBillTotals();
        el.textContent = `₹${totals.grandTotal}`;
      });
    }
  };

  // Deduplicate orders by orderId/id, keeping the most progressed status and complete data
  function deduplicateOrdersList(ordersArray) {
    if (!Array.isArray(ordersArray)) return [];
    const map = new Map();
    const statusPriority = {
      'Delivered': 4,
      'DELIVERED': 4,
      'ON THE WAY': 3,
      'ON_THE_WAY': 3,
      'On the way': 3,
      'Food is being Prepared': 2,
      'PREPARING': 2,
      'IN_PROGRESS': 1,
      'Order Placed': 0
    };

    for (const order of ordersArray) {
      if (!order || typeof order !== 'object') continue;
      const id = String(order.orderId || order.id || '').trim();
      if (!id) continue;

      if (!map.has(id)) {
        map.set(id, Object.assign({}, order, { orderId: id, id: id }));
      } else {
        const existing = map.get(id);
        const existingPri = statusPriority[existing.status] || 0;
        const currentPri = statusPriority[order.status] || 0;

        const merged = Object.assign({}, existing, order, { orderId: id, id: id });
        if (currentPri > existingPri) {
          merged.status = order.status;
          if (order.deliveredAt) merged.deliveredAt = order.deliveredAt;
        } else {
          merged.status = existing.status;
          if (existing.deliveredAt) merged.deliveredAt = existing.deliveredAt;
        }
        merged.emailSent = Boolean(existing.emailSent || order.emailSent);
        map.set(id, merged);
      }
    }
    return Array.from(map.values());
  }

  // --- ORDERS & LIVE TRACKING MODULE ---
  const Orders = {
    deduplicateOrders: function () {
      const rawOrders = getStorage(STORAGE_KEYS.ORDERS, []);
      const deduped = deduplicateOrdersList(rawOrders);
      setStorage(STORAGE_KEYS.ORDERS, deduped);
      return deduped;
    },
    getOrderStatus: function (order) {
      if (!order) return { status: 'UNKNOWN', label: 'Unknown', isLive: false };

      const curr = String(order.status || '').toUpperCase();
      if (curr === 'DELIVERED' || curr === 'CANCELLED') {
        return {
          status: curr,
          label: curr === 'DELIVERED' ? 'Delivered' : 'Cancelled',
          isLive: false,
          deliveredAt: order.deliveredAt || order.createdAt
        };
      }
      if (curr === 'READY_FOR_PICKUP') {
        return {
          status: 'READY_FOR_PICKUP',
          label: 'Ready for Rider',
          isLive: true,
          remainingMinutes: 15
        };
      }

      // Parse timestamp
      let createdMs = Date.now();
      if (typeof order.createdAtMs === 'number' && !isNaN(order.createdAtMs)) {
        createdMs = order.createdAtMs;
      } else if (typeof order.createdAt === 'number') {
        createdMs = order.createdAt;
      } else if (typeof order.createdAt === 'string') {
        const parsed = Date.parse(order.createdAt);
        if (!isNaN(parsed)) {
          createdMs = parsed;
        } else {
          const cleaned = order.createdAt.replace(/,/g, '');
          const altParsed = Date.parse(cleaned);
          if (!isNaN(altParsed)) {
            createdMs = altParsed;
          } else {
            createdMs = Date.now() - 3600000;
          }
        }
      }

      const etaMin = order.estimatedMinutes || order.etaMinutes || 28;
      const elapsedMin = (Date.now() - createdMs) / (60 * 1000);

      if (elapsedMin >= etaMin) {
        const deliveredTime = order.deliveredAt || new Date(createdMs + etaMin * 60 * 1000).toISOString();
        if (order.status !== 'Delivered') {
          order.status = 'Delivered';
          order.deliveredAt = deliveredTime;
          Orders.saveOrder(order);
          if (typeof window !== "undefined" && window.FoodWalaApi && window.FoodWalaApi.saveOrder) {
            window.FoodWalaApi.saveOrder(order);
          }
        }
        return {
          status: 'DELIVERED',
          label: 'Delivered',
          isLive: false,
          deliveredAt: deliveredTime
        };
      } else if (elapsedMin >= 2) {
        return {
          status: 'ON_THE_WAY',
          label: 'ON THE WAY',
          isLive: true,
          remainingMinutes: Math.max(1, Math.round(etaMin - elapsedMin))
        };
      } else {
        return {
          status: 'PREPARING',
          label: 'Food is being Prepared',
          isLive: true,
          remainingMinutes: Math.max(1, Math.round(etaMin - elapsedMin))
        };
      }
    },
    getAllOrders: function () {
      const rawOrders = getStorage(STORAGE_KEYS.ORDERS, []);
      const deduped = deduplicateOrdersList(rawOrders);
      if (Array.isArray(rawOrders) && deduped.length !== rawOrders.length) {
        setStorage(STORAGE_KEYS.ORDERS, deduped);
      }
      if (typeof window !== 'undefined' && !window.FOODWALA_IS_DEMO_MODE) {
        return deduped.filter(o => !o.isDemo);
      }
      return deduped;
    },
    fetchOrders: async function () {
      const user = Auth.getCurrentUser();
      const userId = user ? user.userId : null;
      const phone = user ? user.phone : null;
      if (typeof window !== 'undefined' && !window.FOODWALA_IS_DEMO_MODE && window.FoodWalaApi && typeof window.FoodWalaApi.getOrders === 'function') {
        try {
          const dbOrders = await window.FoodWalaApi.getOrders(userId, phone);
          if (Array.isArray(dbOrders) && dbOrders.length > 0) {
            setStorage(STORAGE_KEYS.ORDERS, dbOrders);
            return dbOrders;
          }
        } catch (e) {}
      }
      return this.getAllOrders();
    },
    getOrderById: function (orderId) {
      if (!orderId) return null;
      const strId = String(orderId).trim();
      const orders = this.getAllOrders();
      return orders.find(o => (String(o.orderId || o.id || '').trim() === strId)) || null;
    },
    saveOrder: function (order) {
      if (!order) return order;
      const targetId = String(order.orderId || order.id || '').trim();
      if (!targetId) return order;

      const orders = this.getAllOrders();
      const idx = orders.findIndex(o => (String(o.orderId || o.id || '').trim() === targetId));
      if (idx > -1) {
        orders[idx] = Object.assign({}, orders[idx], order, { orderId: targetId, id: targetId });
      } else {
        orders.unshift(Object.assign({}, order, { orderId: targetId, id: targetId }));
      }
      setStorage(STORAGE_KEYS.ORDERS, orders);
      try {
        setStorage('foodwala_mock_orders', orders);
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodwala:orderStatusChanged', { detail: order }));
      }
      return orders[idx > -1 ? idx : 0];
    },
    placeOrder: async function (orderDetails) {
      const orders = this.getAllOrders();
      const cart = Cart.getCart();
      const totals = Cart.getBillTotals();
      const user = Auth.getCurrentUser();
      const loc = Location.getCurrentLocation();

      // Ensure single order ID generated once
      const clientOrderId = orderDetails.orderId || orderDetails.id || ('FW-' + Math.floor(10000 + Math.random() * 90000));

      // Guard: Skip if order with this ID already placed
      const existingIdx = orders.findIndex(o => (String(o.orderId || o.id || '').trim() === String(clientOrderId).trim()));
      if (existingIdx > -1) {
        console.warn('[FoodWala] Order ' + clientOrderId + ' already exists, returning existing instance.');
        return orders[existingIdx];
      }

      // Resolve restaurant coordinates
      let restLat = 12.9352, restLng = 77.6245;
      const matchedRest = restaurantsCache.find(r => (r.id === cart.restaurantId || r.restaurantId === cart.restaurantId));
      if (matchedRest && matchedRest.latitude && matchedRest.longitude) {
        restLat = matchedRest.latitude;
        restLng = matchedRest.longitude;
      }

      // Resolve customer delivery coordinates
      let destLat = orderDetails.latitude || orderDetails.lat || (loc ? loc.latitude : 12.9308);
      let destLng = orderDetails.longitude || orderDetails.lng || (loc ? loc.longitude : 77.6210);

      if (!user) {
        console.error('[FoodWala Orders] Order placement rejected: User is not authenticated.');
        throw new Error('Authentication required. Please sign in to place an order.');
      }

      const customerEmail = orderDetails.customerEmail || orderDetails.email || user.email || '';
      const customerPhone = orderDetails.phone || user.phone || '';
      const customerName = orderDetails.name || user.name || 'Customer';

      // Database Payload for ACID Transaction
      const orderPayload = {
        restaurantId: cart.restaurantId || 1,
        userId: user.userId || user.id,
        items: (cart.items || []).map(it => ({
          menuId: it.menuId || it.id,
          name: it.name || it.itemName,
          price: parseFloat(it.price) || 0,
          quantity: parseInt(it.quantity || it.qty, 10) || 1
        })),
        itemTotal: totals.itemTotal,
        deliveryFee: totals.deliveryFee,
        taxes: totals.gst,
        discount: totals.discount,
        totalAmount: totals.grandTotal,
        paymentMode: orderDetails.paymentMethod || 'Razorpay',
        paymentStatus: (orderDetails.paymentMethod === 'Cash on Delivery') ? 'PENDING' : 'SUCCESS',
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        deliveryAddress: orderDetails.address || (loc ? loc.address : 'Bengaluru Delivery Address'),
        deliveryLat: destLat,
        deliveryLng: destLng,
        deliveryInstructions: orderDetails.instructions || '',
        razorpayOrderId: orderDetails.razorpayOrderId || null,
        razorpayPaymentId: orderDetails.razorpayPaymentId || null,
        couponCode: totals.coupon ? totals.coupon.code : null,
        idempotencyKey: clientOrderId
      };

      let dbOrder = null;
      if (window.FoodWalaApi && typeof window.FoodWalaApi.placeOrder === 'function') {
        try {
          const apiRes = await window.FoodWalaApi.placeOrder(orderPayload);
          if (apiRes && apiRes.success && apiRes.order) {
            dbOrder = apiRes.order;
          }
        } catch (e) {
          console.warn('[Orders.placeOrder] Backend call failed, using local fallback:', e);
        }
      }

      const isDemoOrder = Boolean((typeof window !== 'undefined' && window.FOODWALA_IS_DEMO_MODE) || (user && user.isDemo));
      const confirmedId = dbOrder ? (dbOrder.orderId || dbOrder.id) : clientOrderId;
      const cleanId = String(confirmedId).replace(/^#?FW-?/i, '');
      const numTotal = Number(totals.grandTotal || 0);

      const newOrder = {
        id: confirmedId,
        orderId: confirmedId,
        order_id: cleanId,
        displayId: isDemoOrder ? `#FW-DEMO-${confirmedId}` : `#FW-${cleanId}`,
        isDemo: isDemoOrder,
        userId: user ? user.userId : null,
        user_id: user ? user.userId : null,
        createdAt: dbOrder ? dbOrder.orderDate : new Date().toISOString(),
        createdAtMs: Date.now(),
        orderDate: dbOrder ? dbOrder.orderDate : new Date().toISOString(),
        order_date: dbOrder ? dbOrder.orderDate : new Date().toISOString(),
        etaMinutes: 28,
        restaurantId: cart.restaurantId,
        restaurant_id: cart.restaurantId,
        restaurantName: (dbOrder && dbOrder.restaurantName) || cart.restaurantName || 'Bengaluru Restaurant',
        restaurant_name: (dbOrder && dbOrder.restaurantName) || cart.restaurantName || 'Bengaluru Restaurant',
        restaurantAddress: (dbOrder && dbOrder.restaurantAddress) || cart.restaurantAddress || 'Bengaluru',
        restaurant_address: (dbOrder && dbOrder.restaurantAddress) || cart.restaurantAddress || 'Bengaluru',
        restaurantImage: cart.restaurantImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        restaurantLocation: { lat: restLat, lng: restLng },
        deliveryAddress: orderPayload.deliveryAddress,
        delivery_address: orderPayload.deliveryAddress,
        deliveryLatitude: destLat,
        deliveryLongitude: destLng,
        deliveryLocation: { lat: destLat, lng: destLng },
        customerName: customerName,
        customer_name: customerName,
        customerPhone: customerPhone,
        customer_phone: customerPhone,
        customerEmail: customerEmail,
        customer_email: customerEmail,
        deliveryInstructions: orderDetails.instructions || '',
        items: JSON.parse(JSON.stringify(cart.items || [])),
        itemTotal: totals.itemTotal,
        deliveryFee: totals.deliveryFee,
        platformFee: totals.platformFee,
        gst: totals.gst,
        discount: totals.discount,
        coupon: totals.coupon ? totals.coupon.code : null,
        grandTotal: numTotal,
        totalAmount: numTotal,
        total_amount: numTotal,
        total: numTotal,
        paymentStatus: orderDetails.paymentStatus || (orderDetails.paymentMethod === 'Cash on Delivery' ? 'PENDING_COD' : 'PAID'),
        payment_status: orderDetails.paymentStatus || (orderDetails.paymentMethod === 'Cash on Delivery' ? 'PENDING_COD' : 'PAID'),
        paymentMethod: orderDetails.paymentMethod || 'UPI Instant',
        paymentMode: orderDetails.paymentMethod || 'UPI Instant',
        payment_mode: orderDetails.paymentMethod || 'UPI Instant',
        transactionId: (dbOrder && dbOrder.transactionId) || orderDetails.razorpayPaymentId || `FW-${confirmedId}`,
        razorpayOrderId: orderDetails.razorpayOrderId || null,
        razorpayPaymentId: orderDetails.razorpayPaymentId || null,
        status: dbOrder ? dbOrder.status : 'IN_PROGRESS',
        progressPercentage: 15,
        estimatedMinutes: 28,
        emailSent: false,
        deliveryPartner: {
          name: 'Ramesh Kumar',
          phone: '+91 91234 56789',
          vehicle: 'Royal Enfield (KA 01 AB 1234)',
          rating: 4.9,
          otp: Math.floor(1000 + Math.random() * 9000)
        },
        statusTimeline: [
          { title: 'Order Placed', time: 'Just now', done: true },
          { title: 'Restaurant Accepted', time: 'Just now', done: true },
          { title: 'Food is being Prepared', time: 'In progress', done: true, active: true },
          { title: 'Delivery Partner on the Way', time: '~15 mins', done: false },
          { title: 'Delivered', time: '~28 mins', done: false }
        ]
      };

      orders.unshift(newOrder);
      setStorage(STORAGE_KEYS.ORDERS, orders);

      // Also sync to mock orders store so admin portal and mockAdapter have instant access
      try {
        const mockOrders = getStorage('foodwala_mock_orders', []);
        const mIdx = mockOrders.findIndex(o => String(o.orderId || o.id).replace(/^#?FW-?/i, '') === cleanId);
        if (mIdx > -1) {
          mockOrders[mIdx] = newOrder;
        } else {
          mockOrders.unshift(newOrder);
        }
        setStorage('foodwala_mock_orders', mockOrders);
      } catch (e) {}

      // Dispatch global real-time event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodwala:orderPlaced', { detail: newOrder }));
      }

      Cart.clearCart();
      return newOrder;
    }
  };

  // Toast UI - Delegates directly to the unified toast implementation in js/ui.js
  function showToast(message, type = 'success') {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      return window.showToast(message, type);
    }
  }

  // Common UI Init
  function initCommonUI() {
    Cart.updateCartBadge();
    updateUserNavUI();
    updateLocationNavUI();
    bindLocationModalEvents();

    window.addEventListener('foodwala:cartChanged', () => Cart.updateCartBadge());
    window.addEventListener('foodwala:authChanged', () => {
      updateUserNavUI();
      bindLocationModalEvents();
    });
    window.addEventListener('foodwala:locationChanged', () => {
      updateLocationNavUI();
      bindLocationModalEvents();
    });
  }

  function updateUserNavUI() {
    const user = Auth.getCurrentUser();
    const userNavSlot = document.getElementById('navbar-user-slot');
    if (!userNavSlot) return;

    if (user && user.name) {
      const role = (user.role || '').toLowerCase();
      const isAdmin = role === 'admin';
      const isRestaurant = role === 'restaurant' || role === 'restaurant_admin' || role === 'manager';
      userNavSlot.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2 py-2 px-3 rounded-pill" type="button" id="userDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle fs-5 ${isRestaurant ? 'text-warning' : 'text-danger'}"></i>
            <span class="fw-semibold">${user.name.split(' ')[0]}</span>
            ${isRestaurant ? '<span class="badge bg-warning text-dark rounded-pill small px-2 py-0" style="font-size:0.68rem;">Partner</span>' : ''}
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 mt-2 py-2" aria-labelledby="userDropdownBtn" style="min-width: 230px;">
            <li class="px-3 py-2 border-bottom">
              <div class="fw-bold text-dark">${user.name}</div>
              <small class="text-muted">${user.email || user.phone || ''}</small>
            </li>
            ${isRestaurant ? `<li><a class="dropdown-item py-2 d-flex align-items-center gap-2 text-dark fw-bold bg-warning-subtle rounded-3 mx-2 my-1" href="./restaurant-dashboard.html"><i class="bi bi-shop text-warning fs-5"></i> <span>Restaurant Dashboard</span></a></li>` : ''}
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./profile.html"><i class="bi bi-person text-primary"></i> <span>My Profile</span></a></li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./addresses.html"><i class="bi bi-geo-alt text-danger"></i> <span>My Addresses</span></a></li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./orders.html"><i class="bi bi-bag-check text-success"></i> <span>My Orders</span></a></li>
            ${isAdmin ? `<li><a class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger fw-semibold" href="./admin.html"><i class="bi bi-shield-lock-fill text-danger"></i> <span>Admin Portal</span></a></li>` : ''}
            <li><hr class="dropdown-divider my-1"></li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2 text-danger js-logout-btn" href="javascript:void(0)"><i class="bi bi-box-arrow-right"></i> <span>Logout</span></a></li>
          </ul>
        </div>
      `;

      const logoutBtn = userNavSlot.querySelector('.js-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.logout();
        });
      }
    } else {
      userNavSlot.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <a href="./login.html" class="btn btn-outline-danger btn-sm px-3 py-2 rounded-pill fw-semibold d-flex align-items-center gap-1">
            <i class="bi bi-person"></i>
            <span>Login</span>
          </a>
          <a href="./register.html" class="btn btn-danger btn-sm px-3 py-2 rounded-pill fw-semibold">Sign Up</a>
        </div>
      `;
    }
  }

  function updateLocationNavUI() {
    const loc = Location.getCurrentLocation();
    const locSlot = document.getElementById('navbar-location-display');
    if (!locSlot) return;

    if (loc && loc.latitude && loc.longitude) {
      const accuracyText = loc.accuracy ? `GPS Accuracy ~${loc.accuracy}m` : (loc.source === 'gps' ? 'Live GPS Location' : (loc.address || 'Bengaluru'));
      locSlot.innerHTML = `
        <span class="fw-bold text-dark text-truncate d-inline-block" style="max-width: 140px;">${loc.shortName || 'Current Location'}</span>
        <small class="text-muted d-block text-truncate" style="max-width: 180px;">${accuracyText}</small>
      `;
    } else {
      locSlot.innerHTML = `
        <span class="fw-bold text-dark text-truncate d-inline-block" style="max-width: 140px;">Bengaluru</span>
        <small class="text-muted d-block text-truncate" style="font-size: 0.75rem;">Delivery Hub (Select)</small>
      `;
    }
  }

  function bindLocationModalEvents() {
    const modalContainer = document.getElementById('location-options-list');
    if (!modalContainer) return;

    const currentLoc = Location.getCurrentLocation();
    const currentUser = Auth.getCurrentUser();
    const savedAddresses = (currentUser && currentUser.addresses) ? currentUser.addresses : [];
    const hubs = Location.getBengaluruHubs();

    let html = `
      <div class="p-3 bg-light border-bottom">
        <button type="button" class="btn btn-danger btn-sm w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm mb-2" id="use-current-gps-btn">
          <i class="bi bi-crosshair fs-5"></i> Use Current Location (GPS)
        </button>
        <div class="input-group input-group-sm mt-2">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input type="text" class="form-control border-start-0" id="manual-search-hub-input" placeholder="Search Bengaluru area...">
        </div>
      </div>
    `;

    // Saved addresses section (if logged in and has addresses)
    if (savedAddresses.length > 0) {
      html += `
        <div class="p-3 bg-white border-bottom">
          <small class="fw-bold text-uppercase text-muted d-block mb-2" style="font-size: 11px;"><i class="bi bi-bookmark-fill text-danger me-1"></i> Saved Addresses</small>
          <div class="d-flex flex-column gap-2">
            ${savedAddresses.map(addr => `
              <button type="button" class="btn btn-light text-start p-2 rounded-3 border d-flex align-items-center justify-content-between js-select-saved-addr" data-addr-id="${addr.id}">
                <div>
                  <span class="fw-bold text-dark small"><i class="bi ${addr.type === 'Work' ? 'bi-briefcase' : 'bi-house-door'} text-danger me-1"></i> ${addr.type || 'Home'}</span>
                  <small class="text-muted d-block text-truncate" style="max-width: 260px;">${addr.addressLine}</small>
                </div>
                <i class="bi bi-chevron-right text-muted small"></i>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Popular Hubs list
    html += `
      <div class="p-2">
        <small class="fw-bold text-uppercase text-muted d-block px-2 py-1" style="font-size: 11px;"><i class="bi bi-geo-alt-fill text-primary me-1"></i> Popular Bengaluru Delivery Hubs</small>
        <div class="list-group list-group-flush" id="bengaluru-hubs-list">
          ${hubs.map(h => {
            const isSelected = currentLoc && (currentLoc.shortName === h.shortName || (currentLoc.latitude === h.lat && currentLoc.longitude === h.lng));
            return `
              <button type="button" class="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 border-0 rounded-3 mb-1 ${isSelected ? 'active text-white' : ''}" data-hub-id="${h.id}">
                <div>
                  <div class="fw-bold"><i class="bi bi-geo-alt-fill me-2 ${isSelected ? 'text-white' : 'text-danger'}"></i>${h.shortName}</div>
                  <small class="${isSelected ? 'text-light' : 'text-muted'}">${h.landmark}</small>
                </div>
                ${isSelected ? '<i class="bi bi-check2-circle fs-5"></i>' : '<i class="bi bi-chevron-right text-muted small"></i>'}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    modalContainer.innerHTML = html;

    // Bind GPS Button Click
    const gpsBtn = document.getElementById('use-current-gps-btn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        gpsBtn.disabled = true;
        gpsBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Detecting GPS Location...';

        Location.detectCurrentLocation(
          (detectedLoc) => {
            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '<i class="bi bi-crosshair fs-5"></i> Use Current Location (GPS)';
            
            const modalEl = document.getElementById('locationModal');
            if (modalEl && window.bootstrap && bootstrap.Modal) {
              const modalInstance = bootstrap.Modal.getInstance(modalEl);
              if (modalInstance) modalInstance.hide();
            }
            showToast(`Location set: ${detectedLoc.shortName}!`, 'success');
          },
          (errMsg) => {
            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '<i class="bi bi-crosshair fs-5"></i> Use Current Location (GPS)';
            showToast(errMsg, 'warning');
          }
        );
      });
    }

    // Bind Saved Address Selection
    modalContainer.querySelectorAll('.js-select-saved-addr').forEach(btn => {
      btn.addEventListener('click', () => {
        const addrId = btn.getAttribute('data-addr-id');
        const targetAddr = savedAddresses.find(a => a.id === addrId);
        if (targetAddr) {
          Location.setSavedAddressLocation(targetAddr);
          const modalEl = document.getElementById('locationModal');
          if (modalEl && window.bootstrap && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
          }
          showToast(`Delivery location set to ${targetAddr.type}!`, 'success');
        }
      });
    });

    // Bind Hub selection
    modalContainer.querySelectorAll('button[data-hub-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hubId = btn.getAttribute('data-hub-id');
        const loc = Location.setManualLocation(hubId);
        const modalEl = document.getElementById('locationModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }
        showToast(`Delivery location set to ${loc.shortName}!`, 'success');
      });
    });

    // Search filter inside modal
    const searchInput = document.getElementById('manual-search-hub-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        modalContainer.querySelectorAll('button[data-hub-id]').forEach(btn => {
          const hubId = btn.getAttribute('data-hub-id');
          const hub = hubs.find(h => h.id === hubId);
          if (!hub) return;
          const matches = hub.name.toLowerCase().includes(term) || hub.shortName.toLowerCase().includes(term) || hub.landmark.toLowerCase().includes(term);
          btn.style.display = matches ? 'flex' : 'none';
        });
      });
    }
  }

  // Pre-load data on load (skip on auth, admin & restaurant portal pages to avoid unnecessary background catalog requests)
  const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';
  const isAuthOrAdminPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html') || currentPath.endsWith('forgot-password.html') || currentPath.endsWith('reset-password.html') || currentPath.endsWith('admin.html') || currentPath.endsWith('restaurant-dashboard.html');
  if (!isAuthOrAdminPage) {
    loadData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommonUI);
  } else {
    initCommonUI();
  }

  return {
    STORAGE_KEYS,
    BENGALURU_LOCATIONS,
    AVAILABLE_COUPONS,
    loadData,
    loadRestaurants,
    loadMenuItems,
    optimizeImageUrl,
    getRestaurants: () => restaurantsCache,
    getMenuItems: () => menuItemsCache,
    getCategories: () => categoriesCache,
    getRestaurantMenu,
    Location,
    Auth,
    Cart,
    Orders,
    showToast,
    updateAuthUI: updateUserNavUI,
    updateLocationUI: updateLocationNavUI,
    initCommonUI
  };
})();

window.FoodWalaApp = FoodWalaApp;
if (typeof window !== "undefined") {
  window.getOrderStatus = function (o) { return FoodWalaApp.Orders.getOrderStatus(o); };
}
