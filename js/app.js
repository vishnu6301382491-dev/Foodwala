/**
 * FoodWala Core Application Module
 * Complete end-to-end management of:
 * - Dynamic data loading (restaurants, menus, categories)
 * - User Authentication, Session State & Profile Management
 * - Multi-Address Management (Home, Work, Other, Set Default)
 * - Cart & Coupon Engine
 * - Razorpay Test Payment & Order Lifecycle
 * - Geolocation & Live Order Tracking Persistence
 */

const FoodWalaApp = (function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEYS = {
    CART: 'foodwala_cart',
    USER: 'foodwala_user',
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

  // 12 Pre-defined Bengaluru Delivery Locations with Geocoordinates
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

  // Default Demo Users
  const DEMO_USERS = {
    customer: {
      userId: 1,
      name: 'Rahul Sharma',
      email: 'customer@foodwala.com',
      phone: '+91 98765 43210',
      role: 'CUSTOMER',
      memberSince: 'March 2024',
      addresses: [
        {
          id: 'addr_1',
          fullName: 'Rahul Sharma',
          phone: '+91 98765 43210',
          type: 'Home',
          houseNo: 'Flat 402, Sunshine Heights',
          street: '5th Block, 80ft Road',
          area: 'Koramangala',
          landmark: 'Near Sony World Signal',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560095',
          lat: 12.9352,
          lng: 77.6245,
          addressLine: 'Flat 402, Sunshine Heights, 5th Block, 80ft Road, Koramangala, Bengaluru, Karnataka - 560095',
          isDefault: true
        },
        {
          id: 'addr_2',
          fullName: 'Rahul Sharma',
          phone: '+91 98765 43210',
          type: 'Work',
          houseNo: 'Floor 3, Tower B',
          street: 'EcoSpace Business Park, Outer Ring Road',
          area: 'Bellandur',
          landmark: 'Opposite Central Mall',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          lat: 12.9304,
          lng: 77.6784,
          addressLine: 'Floor 3, Tower B, EcoSpace Business Park, Bellandur, Bengaluru, Karnataka - 560103',
          isDefault: false
        }
      ]
    },
    restaurant: {
      userId: 2,
      name: 'Vidyarthi Bhavan Manager',
      email: 'vidyarthi@foodwala.com',
      phone: '+91 80266 77588',
      role: 'RESTAURANT_ADMIN',
      restaurantId: 2,
      memberSince: 'January 2024',
      addresses: [
        {
          id: 'addr_rest',
          fullName: 'Vidyarthi Bhavan Admin',
          phone: '+91 80266 77588',
          type: 'Work',
          houseNo: '32',
          street: 'Gandhi Bazaar Main Road',
          area: 'Basavanagudi',
          landmark: 'Near Circle',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560004',
          lat: 12.9421,
          lng: 77.5754,
          addressLine: '32, Gandhi Bazaar Main Road, Basavanagudi, Bengaluru - 560004',
          isDefault: true
        }
      ]
    },
    partner: {
      userId: 3,
      name: 'Ramesh Kumar',
      email: 'partner@foodwala.com',
      phone: '+91 91234 56789',
      role: 'DELIVERY_PARTNER',
      memberSince: 'June 2024',
      vehicle: 'Royal Enfield (KA 01 AB 1234)',
      rating: 4.9,
      addresses: [
        {
          id: 'addr_p',
          fullName: 'Ramesh Kumar',
          phone: '+91 91234 56789',
          type: 'Home',
          houseNo: '124, 7th Cross',
          street: 'Sector 2',
          area: 'HSR Layout',
          landmark: 'Near BDA Complex',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
          lat: 12.9121,
          lng: 77.6446,
          addressLine: '124, 7th Cross, Sector 2, HSR Layout, Bengaluru - 560102',
          isDefault: true
        }
      ]
    }
  };

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

  // --- LOCATION MODULE ---
  const Location = {
    getAllLocations: function () {
      return BENGALURU_LOCATIONS;
    },
    getCurrentLocation: function () {
      const saved = getStorage(STORAGE_KEYS.LOCATION, null);
      return saved || BENGALURU_LOCATIONS[0]; // default Koramangala
    },
    setCurrentLocation: function (locationId) {
      const loc = BENGALURU_LOCATIONS.find(l => l.id === locationId) || BENGALURU_LOCATIONS[0];
      setStorage(STORAGE_KEYS.LOCATION, loc);
      window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: loc }));
      return loc;
    },
    detectCurrentLocation: function (onSuccess, onError) {
      if (!navigator.geolocation) {
        if (onError) onError('Geolocation is not supported by your browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Find closest known Bengaluru neighborhood
          let closest = BENGALURU_LOCATIONS[0];
          let minDistance = Infinity;

          for (const loc of BENGALURU_LOCATIONS) {
            const d = Location.calculateDistance(lat, lng, loc.lat, loc.lng);
            if (d < minDistance) {
              minDistance = d;
              closest = loc;
            }
          }

          const detectedLoc = {
            id: 'geo_' + Date.now(),
            name: `${closest.shortName}, Bengaluru (Live GPS)`,
            shortName: closest.shortName,
            lat: lat,
            lng: lng,
            landmark: `GPS Accuracy ~${Math.round(position.coords.accuracy || 20)}m`
          };

          setStorage(STORAGE_KEYS.LOCATION, detectedLoc);
          window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: detectedLoc }));
          if (onSuccess) onSuccess(detectedLoc);
        },
        (err) => {
          const msg = err.code === 1
            ? 'Location permission was denied. Please enter or select your address manually.'
            : 'Unable to detect location. Please select an area manually.';
          if (onError) onError(msg);
        },
        { timeout: 10000, enableHighAccuracy: true }
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

  // --- AUTH MODULE ---
  const Auth = {
    getCurrentUser: function () {
      const u = getStorage(STORAGE_KEYS.USER, null);
      if (u) return u;
      // If user never explicitly logged out, initialize with Rahul customer demo
      const hasLoggedOut = localStorage.getItem('foodwala_logged_out');
      if (!hasLoggedOut) {
        setStorage(STORAGE_KEYS.USER, DEMO_USERS.customer);
        return DEMO_USERS.customer;
      }
      return null;
    },
    isLoggedIn: function () {
      return !!this.getCurrentUser();
    },
    requireAuth: function (redirectTarget = './login.html') {
      const user = this.getCurrentUser();
      if (!user) {
        showToast('Please sign in to continue.', 'warning');
        setTimeout(() => {
          window.location.href = `./login.html?redirect=${encodeURIComponent(redirectTarget || window.location.href)}`;
        }, 500);
        return false;
      }
      return true;
    },
    login: function (email, password) {
      localStorage.removeItem('foodwala_logged_out');
      let user = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
      if (!user) {
        const namePart = (email || 'Foodie').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        user = {
          userId: Date.now(),
          name: namePart,
          email: email,
          phone: '+91 98765 00000',
          role: 'CUSTOMER',
          memberSince: 'October 2026',
          addresses: [
            {
              id: 'addr_new',
              fullName: namePart,
              phone: '+91 98765 00000',
              type: 'Home',
              houseNo: 'Flat 101',
              street: '4th Block',
              area: 'Koramangala',
              landmark: 'Near BDA Complex',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560034',
              lat: 12.9352,
              lng: 77.6245,
              addressLine: 'Flat 101, 4th Block, Koramangala, Bengaluru, Karnataka - 560034',
              isDefault: true
            }
          ]
        };
      }
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user;
    },
    loginAsDemo: function (roleType) {
      localStorage.removeItem('foodwala_logged_out');
      const user = DEMO_USERS[roleType] || DEMO_USERS.customer;
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user;
    },
    logout: function () {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.setItem('foodwala_logged_out', 'true');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      showToast('You have been signed out successfully.', 'success');
      setTimeout(() => {
        window.location.href = './login.html';
      }, 400);
    },
    updateProfile: function (updatedFields) {
      const user = this.getCurrentUser();
      if (!user) return null;
      Object.assign(user, updatedFields);
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user;
    },
    register: function (name, email, phone, password, addressText) {
      localStorage.removeItem('foodwala_logged_out');
      const newUser = {
        userId: Date.now(),
        name: name || 'Food Lover',
        email: email,
        phone: phone || '+91 98765 00000',
        role: 'CUSTOMER',
        memberSince: 'October 2026',
        addresses: [
          {
            id: 'addr_' + Date.now(),
            fullName: name || 'Food Lover',
            phone: phone || '+91 98765 00000',
            type: 'Home',
            houseNo: 'House No. 1',
            street: addressText || 'Main Road',
            area: 'Koramangala',
            landmark: 'Near Metro',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            lat: 12.9352,
            lng: 77.6245,
            addressLine: (addressText || 'Koramangala, Bengaluru') + ', Karnataka - 560001',
            isDefault: true
          }
        ]
      };
      setStorage(STORAGE_KEYS.USER, newUser);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));
      return newUser;
    },
    addAddress: function (addressObj) {
      const user = this.getCurrentUser();
      if (!user) return null;
      if (!user.addresses) user.addresses = [];

      const id = 'addr_' + Date.now();
      const isFirst = user.addresses.length === 0;

      // Geocode area coordinates if available
      let lat = 12.9352, lng = 77.6245;
      const matchedLoc = BENGALURU_LOCATIONS.find(l => 
        (addressObj.area || '').toLowerCase().includes(l.shortName.toLowerCase()) ||
        (addressObj.street || '').toLowerCase().includes(l.shortName.toLowerCase())
      );
      if (matchedLoc) {
        lat = matchedLoc.lat;
        lng = matchedLoc.lng;
      }

      const formattedLine = `${addressObj.houseNo ? addressObj.houseNo + ', ' : ''}${addressObj.street ? addressObj.street + ', ' : ''}${addressObj.area ? addressObj.area + ', ' : ''}${addressObj.city || 'Bengaluru'}, ${addressObj.state || 'Karnataka'} - ${addressObj.pincode || '560001'}`;

      const newAddr = {
        id: id,
        fullName: addressObj.fullName || user.name,
        phone: addressObj.phone || user.phone,
        type: addressObj.type || 'Home',
        houseNo: addressObj.houseNo || '',
        street: addressObj.street || '',
        area: addressObj.area || 'Koramangala',
        landmark: addressObj.landmark || '',
        city: addressObj.city || 'Bengaluru',
        state: addressObj.state || 'Karnataka',
        pincode: addressObj.pincode || '560001',
        lat: lat,
        lng: lng,
        addressLine: formattedLine,
        isDefault: addressObj.isDefault || isFirst
      };

      if (newAddr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      user.addresses.push(newAddr);
      setStorage(STORAGE_KEYS.USER, user);
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

      setStorage(STORAGE_KEYS.USER, user);
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
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return true;
    },
    setDefaultAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return;
      user.addresses.forEach(a => a.isDefault = (a.id === addressId));
      setStorage(STORAGE_KEYS.USER, user);
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
      const orders = getStorage(STORAGE_KEYS.ORDERS, null);
      if (orders && orders.length > 0) return orders;

      const initialOrders = [
        {
          id: 'FW-89421',
          orderId: 'FW-89421',
          userId: 1,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          restaurantId: 1,
          restaurantName: 'Meghana Foods',
          restaurantAddress: '5th Block, Koramangala, Bengaluru',
          restaurantImage: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
          restaurantLocation: { lat: 12.9352, lng: 77.6245 },
          deliveryAddress: 'Flat 402, Sunshine Heights, 5th Block, Koramangala, Bengaluru - 560095',
          deliveryLocation: { lat: 12.9308, lng: 77.6210 },
          items: [
            { name: 'Meghana Special Chicken Biryani', quantity: 2, price: 340, isVeg: false },
            { name: 'Chicken 65', quantity: 1, price: 280, isVeg: false }
          ],
          itemTotal: 960,
          deliveryFee: 0,
          platformFee: 5,
          gst: 48,
          discount: 100,
          grandTotal: 913,
          paymentStatus: 'PAID',
          paymentMethod: 'UPI (Google Pay)',
          razorpayPaymentId: 'pay_test_98412meghana',
          status: 'DELIVERED',
          progressPercentage: 100,
          estimatedMinutes: 0,
          deliveryPartner: {
            name: 'Ramesh Kumar',
            phone: '+91 91234 56789',
            rating: 4.9,
            vehicle: 'Royal Enfield (KA 01 AB 1234)',
            otp: 4892
          },
          statusTimeline: [
            { title: 'Order Placed', time: '07:30 PM', done: true },
            { title: 'Restaurant Accepted', time: '07:32 PM', done: true },
            { title: 'Food Prepared', time: '07:48 PM', done: true },
            { title: 'Delivery Partner on the Way', time: '07:52 PM', done: true },
            { title: 'Delivered', time: '08:08 PM', done: true }
          ]
        }
      ];
      setStorage(STORAGE_KEYS.ORDERS, initialOrders);
      return initialOrders;
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
      let destLat = orderDetails.lat || loc.lat || 12.9308;
      let destLng = orderDetails.lng || loc.lng || 77.6210;

      const newOrder = {
        id: newId,
        orderId: newId,
        userId: user ? user.userId : 1,
        createdAt: new Date().toISOString(),
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName || 'Bengaluru Restaurant',
        restaurantAddress: cart.restaurantAddress || 'Bengaluru',
        restaurantImage: cart.restaurantImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        restaurantLocation: { lat: restLat, lng: restLng },
        deliveryAddress: orderDetails.address || (user && user.addresses ? user.addresses[0].addressLine : loc.name),
        deliveryLocation: { lat: destLat, lng: destLng },
        customerName: orderDetails.name || (user ? user.name : 'Guest'),
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

    toastEl.querySelector('.btn-close').addEventListener('click', () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    });
  }

  // Common UI Init
  function initCommonUI() {
    Cart.updateCartBadge();
    updateUserNavUI();
    updateLocationNavUI();
    bindLocationModalEvents();

    window.addEventListener('foodwala:cartChanged', () => Cart.updateCartBadge());
    window.addEventListener('foodwala:authChanged', () => updateUserNavUI());
    window.addEventListener('foodwala:locationChanged', () => updateLocationNavUI());
  }

  function updateUserNavUI() {
    const user = Auth.getCurrentUser();
    const userNavSlot = document.getElementById('navbar-user-slot');
    if (!userNavSlot) return;

    if (user) {
      userNavSlot.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2 py-2 px-3 rounded-pill" type="button" id="userDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle fs-5 text-danger"></i>
            <span class="fw-semibold">${user.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 mt-2 py-2" aria-labelledby="userDropdownBtn" style="min-width: 220px;">
            <li class="px-3 py-2 border-bottom">
              <div class="fw-bold text-dark">${user.name}</div>
              <small class="text-muted">${user.email}</small>
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
          <a href="./login.html" class="btn btn-outline-primary btn-sm px-3 py-2 rounded-pill fw-semibold">Sign In</a>
          <a href="./register.html" class="btn btn-primary btn-sm px-3 py-2 rounded-pill fw-semibold">Register</a>
        </div>
      `;
    }
  }

  function updateLocationNavUI() {
    const loc = Location.getCurrentLocation();
    const locSlot = document.getElementById('navbar-location-display');
    if (locSlot) {
      locSlot.innerHTML = `
        <span class="fw-bold text-dark text-truncate d-inline-block" style="max-width: 140px;">${loc.shortName}</span>
        <small class="text-muted d-block text-truncate" style="max-width: 180px;">${loc.landmark || 'Bengaluru'}</small>
      `;
    }
  }

  function bindLocationModalEvents() {
    const modalList = document.getElementById('location-options-list');
    if (!modalList) return;

    const current = Location.getCurrentLocation();
    modalList.innerHTML = `
      <div class="p-3 bg-light border-bottom">
        <button type="button" class="btn btn-outline-danger btn-sm w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2" id="use-current-gps-btn">
          <i class="bi bi-crosshair"></i> Use Current Location (GPS)
        </button>
      </div>
    ` + BENGALURU_LOCATIONS.map(l => `
      <button class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom ${l.id === current.id ? 'active text-white' : ''}" 
              data-loc-id="${l.id}">
        <div>
          <div class="fw-bold"><i class="bi bi-geo-alt-fill me-2 text-danger"></i>${l.shortName}</div>
          <small class="${l.id === current.id ? 'text-light' : 'text-muted'}">${l.landmark}</small>
        </div>
        ${l.id === current.id ? '<i class="bi bi-check2-circle fs-4"></i>' : '<i class="bi bi-chevron-right text-muted"></i>'}
      </button>
    `).join('');

    modalList.querySelectorAll('button[data-loc-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-loc-id');
        Location.setCurrentLocation(id);
        const modalEl = document.getElementById('locationModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        showToast(`Delivery location set to ${Location.getCurrentLocation().shortName}!`);
        setTimeout(() => window.location.reload(), 300);
      });
    });

    const gpsBtn = document.getElementById('use-current-gps-btn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        gpsBtn.disabled = true;
        gpsBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Detecting GPS Location...';

        Location.detectCurrentLocation(
          (loc) => {
            const modalEl = document.getElementById('locationModal');
            if (modalEl && window.bootstrap && bootstrap.Modal) {
              const modal = bootstrap.Modal.getInstance(modalEl);
              if (modal) modal.hide();
            }
            showToast(`Location detected: ${loc.name}!`);
            setTimeout(() => window.location.reload(), 300);
          },
          (errMsg) => {
            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '<i class="bi bi-crosshair"></i> Use Current Location (GPS)';
            showToast(errMsg, 'warning');
          }
        );
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
    DEMO_USERS,
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
    initCommonUI
  };
})();

window.FoodWalaApp = FoodWalaApp;
