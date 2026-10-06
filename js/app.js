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
  function loadData() {
    if (dataReadyPromise) return dataReadyPromise;

    dataReadyPromise = new Promise(async (resolve) => {
      try {
        const restRes = await fetch('./data/restaurants.json');
        if (restRes.ok) {
          restaurantsCache = await restRes.json();
        }
      } catch (e) {
        if (window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
          restaurantsCache = window.FOODWALA_RESTAURANTS;
        }
      }

      try {
        const menuRes = await fetch('./data/menu-items.json');
        if (menuRes.ok) {
          menuItemsCache = await menuRes.json();
        }
      } catch (e) {
        if (window.FOODWALA_MENUS && window.FOODWALA_MENUS.length > 0) {
          menuItemsCache = window.FOODWALA_MENUS;
        }
      }

      try {
        const catRes = await fetch('./data/categories.json');
        if (catRes.ok) {
          categoriesCache = await catRes.json();
        }
      } catch (e) {}

      if (restaurantsCache.length === 0 && window.FOODWALA_RESTAURANTS) {
        restaurantsCache = window.FOODWALA_RESTAURANTS;
      }
      if (menuItemsCache.length === 0 && window.FOODWALA_MENUS) {
        menuItemsCache = window.FOODWALA_MENUS;
      }

      window.dispatchEvent(new CustomEvent('foodwala:dataLoaded', {
        detail: {
          restaurantsCount: restaurantsCache.length,
          menuItemsCount: menuItemsCache.length
        }
      }));

      resolve({
        restaurants: restaurantsCache,
        menuItems: menuItemsCache,
        categories: categoriesCache
      });
    });

    return dataReadyPromise;
  }

  async function getRestaurantMenu(restaurantId) {
    const id = parseInt(restaurantId);
    if (individualMenuCache.has(id)) {
      return individualMenuCache.get(id);
    }

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

          let shortName = "Current Location";
          let fullAddress = `Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          // Reverse Geocoding with OpenStreetMap Nominatim
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
              headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const addr = data.address;
                const neighborhood = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.quarter || addr.city_district || addr.locality || addr.village || addr.town || addr.city;
                if (neighborhood) {
                  shortName = neighborhood;
                }
                if (data.display_name) {
                  fullAddress = data.display_name;
                }
              }
            }
          } catch (e) {
            console.warn("[FoodWala] Reverse geocode lookup error (using coordinates):", e);
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

  // --- AUTH MODULE (NO DEFAULT USER) ---
  const Auth = {
    // API endpoint base URL (supports local dev server, cloud backend, or relative API)
    apiBaseUrl: window.FOODWALA_API_URL || '',

    // Client-side dev OTP cache for seamless local testing if backend API is unreachable
    _clientDevOtpStore: new Map(),

    normalizePhone: function (rawPhone) {
      if (!rawPhone || typeof rawPhone !== 'string') return null;
      let digits = rawPhone.replace(/[\s\-\(\)]/g, '');
      if (digits.startsWith('+91')) {
        digits = digits.substring(3);
      } else if (digits.startsWith('91') && digits.length === 12) {
        digits = digits.substring(2);
      } else if (digits.startsWith('0') && digits.length === 11) {
        digits = digits.substring(1);
      }
      if (/^[6-9]\d{9}$/.test(digits)) {
        return '+91' + digits;
      }
      return null;
    },

    getCurrentUser: function () {
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
      const normalized = this.normalizePhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number.'
        };
      }

      // Try Backend API First
      try {
        const endpoint = (this.apiBaseUrl ? this.apiBaseUrl : '') + '/api/auth/send-otp';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalized })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.devOtp) {
            this._clientDevOtpStore.set(normalized, { otp: data.devOtp, expiresAt: Date.now() + 300000 });
          }
          return data;
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            error: errData.error || 'API_ERROR',
            message: errData.message || 'Unable to send OTP right now. Please try again.'
          };
        }
      } catch (e) {
        // Fallback Client Dev Mode (Allows testing on pure static servers/GitHub Pages without live Node server)
        console.info('[FoodWala Auth] API unreachable, using client development OTP mode.');
        const devOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = this._clientDevOtpStore.get(normalized);
        const now = Date.now();

        if (existing && (now - existing.lastSentAt) < 30000) {
          const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
          return {
            success: false,
            error: 'TOO_MANY_REQUESTS',
            message: `Please wait ${waitSec}s before requesting a new OTP.`
          };
        }

        this._clientDevOtpStore.set(normalized, {
          otp: devOtp,
          expiresAt: now + (5 * 60 * 1000),
          attempts: 0,
          lastSentAt: now
        });

        console.log(`\n==================================================`);
        console.log(`[FoodWala Client DEV OTP]`);
        console.log(`Recipient: ${normalized}`);
        console.log(`OTP Code : ${devOtp}`);
        console.log(`==================================================\n`);

        return {
          success: true,
          message: 'OTP sent successfully.',
          phone: normalized,
          expiresIn: 300,
          devOtp: devOtp
        };
      }
    },

    verifyOtp: async function (rawPhone, otp) {
      const normalized = this.normalizePhone(rawPhone);
      if (!normalized) {
        return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
      }

      const cleanOtp = (otp || '').trim();
      if (cleanOtp.length !== 6) {
        return { success: false, error: 'INVALID_OTP_FORMAT', message: 'Please enter the 6-digit verification code.' };
      }

      // Try Backend API First
      try {
        const endpoint = (this.apiBaseUrl ? this.apiBaseUrl : '') + '/api/auth/verify-otp';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalized, otp: cleanOtp })
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.isNewUser && data.user) {
            setStorage(STORAGE_KEYS.CURRENT_USER, data.user);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
            updateUserNavUI();
          }
          return data;
        } else {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            error: errData.error || 'VERIFY_FAILED',
            message: errData.message || 'Incorrect OTP. Please check and try again.'
          };
        }
      } catch (e) {
        // Fallback Client Dev Mode verification
        const record = this._clientDevOtpStore.get(normalized);
        if (!record || Date.now() > record.expiresAt) {
          return { success: false, error: 'OTP_EXPIRED', message: 'OTP expired. Please request a new OTP.' };
        }

        if (record.attempts >= 5) {
          this._clientDevOtpStore.delete(normalized);
          return { success: false, error: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Please request a new OTP.' };
        }

        if (record.otp !== cleanOtp) {
          record.attempts += 1;
          return { success: false, error: 'INCORRECT_OTP', message: 'Incorrect OTP. Please check and try again.' };
        }

        this._clientDevOtpStore.delete(normalized);

        // Check if user already exists in storage or registered users
        const existingUsers = getStorage('foodwala_registered_users', []);
        const matched = existingUsers.find(u => u.phone === normalized);

        if (matched) {
          setStorage(STORAGE_KEYS.CURRENT_USER, matched);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: matched }));
          updateUserNavUI();
          return { success: true, isNewUser: false, user: matched };
        } else {
          return { success: true, isNewUser: true, phone: normalized };
        }
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

    login: function (email, password) {
      if (!email || !email.trim()) return null;
      const cleanEmail = email.trim().toLowerCase();
      const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      const user = {
        userId: Date.now(),
        name: namePart,
        email: cleanEmail,
        phone: null,
        role: 'CUSTOMER',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        addresses: []
      };

      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      updateUserNavUI();
      return user;
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
          memberSince: 'January 2024',
          addresses: []
        },
        partner: {
          userId: 103,
          name: 'Ramesh Kumar',
          email: 'partner@foodwala.com',
          phone: '+919123456789',
          role: 'DELIVERY_PARTNER',
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

    logout: function () {
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

    register: function (name, email, phone, password, addressText) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const newUser = {
        userId: Date.now(),
        name: name || 'Food Lover',
        email: cleanEmail,
        phone: phone || '+91 98765 00000',
        role: 'CUSTOMER',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        addresses: addressText ? [
          {
            id: 'addr_' + Date.now(),
            userId: Date.now(),
            label: 'Home',
            type: 'Home',
            fullName: name || 'Food Lover',
            phone: phone || '+91 98765 00000',
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
      return newUser;
    },

    addAddress: function (addressObj) {
      const user = this.getCurrentUser();
      if (!user) return null;
      if (!user.addresses) user.addresses = [];

      const id = 'addr_' + Date.now();
      const isFirst = user.addresses.length === 0;

      const formattedLine = `${addressObj.houseNo ? addressObj.houseNo + ', ' : ''}${addressObj.street ? addressObj.street + ', ' : ''}${addressObj.area ? addressObj.area + ', ' : ''}${addressObj.city || 'Bengaluru'}, ${addressObj.state || 'Karnataka'} - ${addressObj.pincode || '560001'}`;

      const newAddr = {
        id: id,
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
        addressLine: formattedLine,
        isDefault: addressObj.isDefault !== undefined ? addressObj.isDefault : isFirst
      };

      if (newAddr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      user.addresses.push(newAddr);
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return newAddr;
    },

    updateAddress: function (addressId, addressObj) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return null;
      const idx = user.addresses.findIndex(a => a.id === addressId);
      if (idx === -1) return null;

      const formattedLine = `${addressObj.houseNo ? addressObj.houseNo + ', ' : ''}${addressObj.street ? addressObj.street + ', ' : ''}${addressObj.area ? addressObj.area + ', ' : ''}${addressObj.city || 'Bengaluru'}, ${addressObj.state || 'Karnataka'} - ${addressObj.pincode || '560001'}`;

      if (addressObj.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      user.addresses[idx] = {
        ...user.addresses[idx],
        ...addressObj,
        addressLine: formattedLine
      };

      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user.addresses[idx];
    },

    deleteAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return false;
      user.addresses = user.addresses.filter(a => a.id !== addressId);
      if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
        user.addresses[0].isDefault = true;
      }
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return true;
    },

    setDefaultAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return;
      user.addresses.forEach(a => a.isDefault = (a.id === addressId));
      setStorage(STORAGE_KEYS.CURRENT_USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
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
    addItem: function (item, restaurant) {
      let cart = this.getCart();
      const rId = item.restaurantId || restaurant.restaurantId || restaurant.id;

      if (cart.items && cart.items.length > 0 && cart.restaurantId && cart.restaurantId !== rId) {
        if (!confirm(`Your cart already contains items from "${cart.restaurantName}". Reset cart to order from "${restaurant.name}"?`)) {
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
      const cleanCode = (code || '').toUpperCase().trim();
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

  // --- ORDERS & LIVE TRACKING MODULE ---
  const Orders = {
    getAllOrders: function () {
      return getStorage(STORAGE_KEYS.ORDERS, []);
    },
    getOrderById: function (orderId) {
      const orders = this.getAllOrders();
      return orders.find(o => (o.orderId === orderId || o.id === orderId)) || null;
    },
    saveOrder: function (order) {
      const orders = this.getAllOrders();
      const idx = orders.findIndex(o => (o.orderId === order.orderId || o.id === order.id));
      if (idx > -1) {
        orders[idx] = order;
      } else {
        orders.unshift(order);
      }
      setStorage(STORAGE_KEYS.ORDERS, orders);
      return order;
    },
    placeOrder: function (orderDetails) {
      const orders = this.getAllOrders();
      const cart = Cart.getCart();
      const totals = Cart.getBillTotals();
      const user = Auth.getCurrentUser();
      const loc = Location.getCurrentLocation();

      const newId = 'FW-' + Math.floor(10000 + Math.random() * 90000);
      
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

      const newOrder = {
        id: newId,
        orderId: newId,
        userId: user ? user.userId : null,
        createdAt: new Date().toISOString(),
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName || 'Bengaluru Restaurant',
        restaurantAddress: cart.restaurantAddress || 'Bengaluru',
        restaurantImage: cart.restaurantImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        restaurantLocation: { lat: restLat, lng: restLng },
        deliveryAddress: orderDetails.address || (loc ? loc.address : 'Bengaluru Delivery Address'),
        deliveryLatitude: destLat,
        deliveryLongitude: destLng,
        deliveryLocation: { lat: destLat, lng: destLng },
        customerName: orderDetails.name || (user ? user.name : 'Guest Customer'),
        customerPhone: orderDetails.phone || (user ? user.phone : '+91 98765 43210'),
        customerEmail: user ? user.email : 'guest@foodwala.com',
        deliveryInstructions: orderDetails.instructions || '',
        items: JSON.parse(JSON.stringify(cart.items)),
        itemTotal: totals.itemTotal,
        deliveryFee: totals.deliveryFee,
        platformFee: totals.platformFee,
        gst: totals.gst,
        discount: totals.discount,
        coupon: totals.coupon ? totals.coupon.code : null,
        grandTotal: totals.grandTotal,
        paymentStatus: orderDetails.paymentStatus || (orderDetails.paymentMethod === 'Cash on Delivery' ? 'PENDING_COD' : 'PAID'),
        paymentMethod: orderDetails.paymentMethod || 'UPI Instant',
        razorpayOrderId: orderDetails.razorpayOrderId || null,
        razorpayPaymentId: orderDetails.razorpayPaymentId || null,
        status: 'IN_PROGRESS',
        progressPercentage: 15,
        estimatedMinutes: 28,
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
      Cart.clearCart();
      return newOrder;
    }
  };

  // Toast UI
  function showToast(message, type = 'success') {
    let container = document.getElementById('foodwala-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'foodwala-toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const bgClass = type === 'error' ? 'bg-danger text-white' : type === 'warning' ? 'bg-warning text-dark' : 'bg-success text-white';
    const icon = type === 'error' ? 'bi-exclamation-triangle-fill' : type === 'warning' ? 'bi-exclamation-circle' : 'bi-check-circle-fill';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgClass} border-0 show shadow-lg mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }, 4000);

    const closeBtn = toastEl.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
      });
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
      userNavSlot.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2 py-2 px-3 rounded-pill" type="button" id="userDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle fs-5 text-danger"></i>
            <span class="fw-semibold">${user.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 mt-2 py-2" aria-labelledby="userDropdownBtn" style="min-width: 220px;">
            <li class="px-3 py-2 border-bottom">
              <div class="fw-bold text-dark">${user.name}</div>
              <small class="text-muted">${user.email || user.phone || ''}</small>
            </li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./profile.html"><i class="bi bi-person text-primary"></i> <span>My Profile</span></a></li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./addresses.html"><i class="bi bi-geo-alt text-danger"></i> <span>My Addresses</span></a></li>
            <li><a class="dropdown-item py-2 d-flex align-items-center gap-2" href="./orders.html"><i class="bi bi-bag-check text-success"></i> <span>My Orders</span></a></li>
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
        <span class="fw-bold text-dark text-truncate d-inline-block" style="max-width: 140px;">Select Location</span>
        <small class="text-muted d-block text-truncate" style="max-width: 180px;">Click to set delivery area</small>
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

  // Pre-load data on load
  loadData();

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
