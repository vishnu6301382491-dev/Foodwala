/**
 * FoodWala Application Core JavaScript
 * Handles Cart, Authentication, Location, Orders, and UI State via localStorage
 * Works seamlessly with GitHub Pages static hosting and foodwala-data.js
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

  // Pre-defined Bengaluru Locations
  const BENGALURU_LOCATIONS = [
    { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245, landmark: '5th Block, near Sony World Signal' },
    { id: 'indiranagar', name: 'Indiranagar, Bengaluru', shortName: 'Indiranagar', lat: 12.9784, lng: 77.6408, landmark: '100ft Road, near Metro' },
    { id: 'whitefield', name: 'Whitefield, Bengaluru', shortName: 'Whitefield', lat: 12.9698, lng: 77.7500, landmark: 'ITPL Main Road' },
    { id: 'mg_road', name: 'MG Road, Bengaluru', shortName: 'MG Road', lat: 12.9756, lng: 77.6066, landmark: 'Brigade Road Junction' },
    { id: 'hsr_layout', name: 'HSR Layout, Bengaluru', shortName: 'HSR Layout', lat: 12.9121, lng: 77.6446, landmark: 'Sector 3, 27th Main' },
    { id: 'malleshwaram', name: 'Malleshwaram, Bengaluru', shortName: 'Malleshwaram', lat: 13.0031, lng: 77.5643, landmark: '8th Cross, Sampige Road' },
    { id: 'jayanagar', name: 'Jayanagar, Bengaluru', shortName: 'Jayanagar', lat: 12.9308, lng: 77.5838, landmark: '4th Block Complex' },
    { id: 'electronic_city', name: 'Electronic City, Bengaluru', shortName: 'Electronic City', lat: 12.8399, lng: 77.6770, landmark: 'Phase 1, Velankani Drive' },
    { id: 'jp_nagar', name: 'JP Nagar, Bengaluru', shortName: 'JP Nagar', lat: 12.9063, lng: 77.5857, landmark: '2nd Phase, 15th Cross' },
    { id: 'bellandur', name: 'Bellandur, Bengaluru', shortName: 'Bellandur', lat: 12.9304, lng: 77.6784, landmark: 'Outer Ring Road, EcoSpace' },
    { id: 'marathahalli', name: 'Marathahalli, Bengaluru', shortName: 'Marathahalli', lat: 12.9591, lng: 77.6974, landmark: 'Innovative Multiplex Junction' },
    { id: 'hebbal', name: 'Hebbal, Bengaluru', shortName: 'Hebbal', lat: 13.0358, lng: 77.5970, landmark: 'Hebbal Flyover, Esteem Mall' }
  ];

  // Default Demo Users
  const DEMO_USERS = {
    customer: {
      userId: 1,
      name: 'Rahul Sharma',
      email: 'customer@foodwala.com',
      phone: '+91 98765 43210',
      role: 'CUSTOMER',
      addresses: [
        { id: 'addr_1', type: 'Home', addressLine: 'Flat 402, Sunshine Heights, 5th Block, Koramangala, Bengaluru - 560095', isDefault: true },
        { id: 'addr_2', type: 'Work', addressLine: 'Floor 3, EcoSpace Business Park, Bellandur, Bengaluru - 560103', isDefault: false }
      ]
    },
    restaurant: {
      userId: 2,
      name: 'Vidyarthi Bhavan Manager',
      email: 'vidyarthi@foodwala.com',
      phone: '+91 80266 77588',
      role: 'RESTAURANT_ADMIN',
      restaurantId: 2,
      addresses: [
        { id: 'addr_rest', type: 'Restaurant', addressLine: '32, Gandhi Bazaar Main Road, Basavanagudi, Bengaluru - 560004', isDefault: true }
      ]
    },
    partner: {
      userId: 3,
      name: 'Ramesh Kumar',
      email: 'partner@foodwala.com',
      phone: '+91 91234 56789',
      role: 'DELIVERY_PARTNER',
      vehicle: 'Royal Enfield (KA 01 AB 1234)',
      rating: 4.9,
      addresses: [
        { id: 'addr_p', type: 'Home', addressLine: 'HSR Layout Sector 2, Bengaluru - 560102', isDefault: true }
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
      console.warn('LocalStorage read error for ' + key, e);
      return defaultVal;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage write error for ' + key, e);
    }
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
    setCustomLocation: function (name, lat, lng) {
      const loc = {
        id: 'custom_' + Date.now(),
        name: name,
        shortName: name.split(',')[0],
        lat: lat,
        lng: lng,
        landmark: 'Custom Bengaluru Location'
      };
      setStorage(STORAGE_KEYS.LOCATION, loc);
      window.dispatchEvent(new CustomEvent('foodwala:locationChanged', { detail: loc }));
      return loc;
    },
    calculateDistance: function (lat1, lon1, lat2, lon2) {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 3.5;
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 10) / 10;
    },
    estimateDeliveryTime: function (distanceKm) {
      const basePrepTime = 20;
      const travelTime = Math.round(distanceKm * 3.5);
      return Math.min(65, Math.max(15, basePrepTime + travelTime));
    }
  };

  // --- AUTH MODULE ---
  const Auth = {
    getCurrentUser: function () {
      return getStorage(STORAGE_KEYS.USER, DEMO_USERS.customer); // default logged in as Rahul
    },
    isLoggedIn: function () {
      return !!this.getCurrentUser();
    },
    login: function (email, password) {
      // Find matching demo user or create session
      let user = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
      if (!user) {
        user = {
          userId: Date.now(),
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email,
          phone: '+91 98000 00000',
          role: 'CUSTOMER',
          addresses: [
            { id: 'addr_new', type: 'Home', addressLine: 'Koramangala 4th Block, Bengaluru - 560034', isDefault: true }
          ]
        };
      }
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user;
    },
    loginAsDemo: function (roleType) {
      const user = DEMO_USERS[roleType] || DEMO_USERS.customer;
      setStorage(STORAGE_KEYS.USER, user);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: user }));
      return user;
    },
    logout: function () {
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
    },
    register: function (name, email, phone, password, address) {
      const newUser = {
        userId: Date.now(),
        name: name || 'Food Lover',
        email: email,
        phone: phone || '+91 98765 00000',
        role: 'CUSTOMER',
        addresses: [
          { id: 'addr_' + Date.now(), type: 'Home', addressLine: address || 'Koramangala, Bengaluru', isDefault: true }
        ]
      };
      setStorage(STORAGE_KEYS.USER, newUser);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));
      return newUser;
    },
    addAddress: function (type, addressLine) {
      const user = this.getCurrentUser();
      if (!user) return null;
      if (!user.addresses) user.addresses = [];
      const newAddr = {
        id: 'addr_' + Date.now(),
        type: type || 'Home',
        addressLine: addressLine,
        isDefault: user.addresses.length === 0
      };
      user.addresses.push(newAddr);
      setStorage(STORAGE_KEYS.USER, user);
      return newAddr;
    },
    setDefaultAddress: function (addressId) {
      const user = this.getCurrentUser();
      if (!user || !user.addresses) return;
      user.addresses.forEach(a => a.isDefault = (a.id === addressId));
      setStorage(STORAGE_KEYS.USER, user);
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
      const found = cart.items.find(i => i.menuId === menuId);
      return found ? found.quantity : 0;
    },
    addItem: function (item, restaurant) {
      let cart = this.getCart();

      // Check if cart has items from a different restaurant
      if (cart.items && cart.items.length > 0 && cart.restaurantId && cart.restaurantId !== item.restaurantId) {
        if (!confirm(`Your cart already contains items from "${cart.restaurantName}". Would you like to reset your cart and add items from "${restaurant.name}"?`)) {
          return false;
        }
        cart = {
          restaurantId: item.restaurantId,
          restaurantName: restaurant.name || '',
          restaurantAddress: restaurant.address || '',
          restaurantImage: restaurant.imagePath || '',
          items: []
        };
      }

      if (!cart.restaurantId) {
        cart.restaurantId = item.restaurantId;
        cart.restaurantName = restaurant ? restaurant.name : '';
        cart.restaurantAddress = restaurant ? restaurant.address : '';
        cart.restaurantImage = restaurant ? restaurant.imagePath : '';
      }

      const existingIndex = cart.items.findIndex(i => i.menuId === item.menuId);
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += 1;
      } else {
        cart.items.push({
          menuId: item.menuId,
          restaurantId: item.restaurantId,
          name: item.itemName || item.name,
          price: parseFloat(item.price),
          isVeg: !!item.isVeg,
          category: item.category || '',
          imagePath: item.imagePath || '',
          quantity: 1
        });
      }

      this.saveCart(cart);
      return true;
    },
    updateQuantity: function (menuId, delta) {
      const cart = this.getCart();
      if (!cart.items) return;

      const idx = cart.items.findIndex(i => i.menuId === menuId);
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
      cart.items = cart.items.filter(i => i.menuId !== menuId);
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
        return { success: false, message: `Minimum order of ₹${coupon.minOrder} required for coupon ${cleanCode}.` };
      }
      const couponObj = { code: cleanCode, ...coupon };
      setStorage(STORAGE_KEYS.COUPON, couponObj);
      return { success: true, message: `Coupon ${cleanCode} applied successfully!`, coupon: couponObj };
    },
    removeCoupon: function () {
      localStorage.removeItem(STORAGE_KEYS.COUPON);
      window.dispatchEvent(new CustomEvent('foodwala:cartChanged', { detail: this.getCart() }));
    },
    getBillTotals: function (withCoupon = true) {
      const cart = this.getCart();
      const itemTotal = (cart.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      let deliveryFee = itemTotal > 250 || itemTotal === 0 ? 0 : 35; // Free delivery above 250
      let platformFee = itemTotal > 0 ? 5 : 0;
      let gst = Math.round(itemTotal * 0.05); // 5% GST
      
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

  // --- ORDERS MODULE ---
  const Orders = {
    getAllOrders: function () {
      const orders = getStorage(STORAGE_KEYS.ORDERS, null);
      if (orders && orders.length > 0) return orders;

      // Seed initial realistic past orders for demonstration
      const initialOrders = [
        {
          orderId: 'FW-89421',
          date: '2026-10-04T19:30:00.000Z',
          restaurantId: 1,
          restaurantName: 'Meghana Foods',
          restaurantAddress: '5th Block, Koramangala, Bengaluru',
          restaurantImage: 'images/restaurants/meghana.jpg',
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
          deliveryAddress: 'Flat 402, Sunshine Heights, 5th Block, Koramangala, Bengaluru - 560095',
          paymentMethod: 'UPI (Google Pay)',
          status: 'DELIVERED',
          deliveryPartner: { name: 'Ramesh Kumar', phone: '+91 91234 56789', rating: 4.9 },
          statusTimeline: [
            { title: 'Order Placed', time: '07:30 PM', done: true },
            { title: 'Restaurant Accepted', time: '07:32 PM', done: true },
            { title: 'Food Prepared', time: '07:48 PM', done: true },
            { title: 'Out for Delivery', time: '07:52 PM', done: true },
            { title: 'Delivered', time: '08:08 PM', done: true }
          ]
        },
        {
          orderId: 'FW-89105',
          date: '2026-10-01T09:15:00.000Z',
          restaurantId: 2,
          restaurantName: 'Vidyarthi Bhavan',
          restaurantAddress: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
          restaurantImage: 'images/restaurants/vidyarthi.jpg',
          items: [
            { name: 'Benne Masala Dosa', quantity: 3, price: 85, isVeg: true },
            { name: 'Filter Coffee', quantity: 3, price: 35, isVeg: true }
          ],
          itemTotal: 360,
          deliveryFee: 0,
          platformFee: 5,
          gst: 18,
          discount: 50,
          grandTotal: 333,
          deliveryAddress: 'Flat 402, Sunshine Heights, 5th Block, Koramangala, Bengaluru - 560095',
          paymentMethod: 'Cash on Delivery',
          status: 'DELIVERED',
          deliveryPartner: { name: 'Suresh Gowda', phone: '+91 98877 66554', rating: 4.8 },
          statusTimeline: [
            { title: 'Order Placed', time: '09:15 AM', done: true },
            { title: 'Restaurant Accepted', time: '09:17 AM', done: true },
            { title: 'Food Prepared', time: '09:30 AM', done: true },
            { title: 'Out for Delivery', time: '09:35 AM', done: true },
            { title: 'Delivered', time: '09:55 AM', done: true }
          ]
        }
      ];
      setStorage(STORAGE_KEYS.ORDERS, initialOrders);
      return initialOrders;
    },
    getOrderById: function (orderId) {
      const orders = this.getAllOrders();
      return orders.find(o => o.orderId === orderId) || null;
    },
    placeOrder: function (orderDetails) {
      const orders = this.getAllOrders();
      const cart = Cart.getCart();
      const totals = Cart.getBillTotals();
      const user = Auth.getCurrentUser();
      const loc = Location.getCurrentLocation();

      const newOrder = {
        orderId: 'FW-' + Math.floor(10000 + Math.random() * 90000),
        date: new Date().toISOString(),
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        restaurantAddress: cart.restaurantAddress,
        restaurantImage: cart.restaurantImage,
        items: JSON.parse(JSON.stringify(cart.items)),
        itemTotal: totals.itemTotal,
        deliveryFee: totals.deliveryFee,
        platformFee: totals.platformFee,
        gst: totals.gst,
        discount: totals.discount,
        coupon: totals.coupon ? totals.coupon.code : null,
        grandTotal: totals.grandTotal,
        deliveryAddress: orderDetails.address || (user && user.addresses ? user.addresses[0].addressLine : loc.name),
        paymentMethod: orderDetails.paymentMethod || 'UPI',
        customerName: orderDetails.name || (user ? user.name : 'Guest'),
        customerPhone: orderDetails.phone || (user ? user.phone : '+91 98765 43210'),
        deliveryInstructions: orderDetails.instructions || '',
        status: 'PREPARING',
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

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'success') {
    let container = document.getElementById('foodwala-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'foodwala-toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const toastId = 'toast_' + Date.now();
    const bgClass = type === 'error' ? 'bg-danger text-white' : type === 'warning' ? 'bg-warning text-dark' : 'bg-success text-white';
    const icon = type === 'error' ? 'bi-exclamation-triangle-fill' : type === 'warning' ? 'bi-exclamation-circle' : 'bi-check-circle-fill';

    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `toast align-items-center ${bgClass} border-0 show shadow-lg mb-2`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon} fs-5"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    }, 3500);

    toastEl.querySelector('.btn-close').addEventListener('click', () => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.remove(), 300);
    });
  }

  // --- NAVBAR & HEADER RENDERER ---
  function initCommonUI() {
    Cart.updateCartBadge();
    updateUserNavUI();
    updateLocationNavUI();
    bindLocationModalEvents();

    // Listen to storage events
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
          <button class="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2 py-2 px-3 rounded-pill" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle fs-5 text-primary"></i>
            <span class="fw-semibold">${user.name.split(' ')[0]}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2">
            <li class="px-3 py-2 border-bottom">
              <div class="fw-bold text-dark">${user.name}</div>
              <small class="text-muted">${user.email}</small>
            </li>
            <li><a class="dropdown-item py-2" href="./profile.html"><i class="bi bi-person me-2 text-primary"></i>My Profile</a></li>
            <li><a class="dropdown-item py-2" href="./orders.html"><i class="bi bi-bag-check me-2 text-primary"></i>My Orders</a></li>
            <li><hr class="dropdown-divider my-1"></li>
            <li><a class="dropdown-item py-2 text-danger" href="javascript:void(0)" onclick="FoodWalaApp.Auth.logout(); window.location.reload();"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
          </ul>
        </div>
      `;
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
    modalList.innerHTML = BENGALURU_LOCATIONS.map(l => `
      <button class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom ${l.id === current.id ? 'active text-white' : ''}" 
              data-loc-id="${l.id}">
        <div>
          <div class="fw-bold"><i class="bi bi-geo-alt-fill me-2 text-danger"></i>${l.shortName}</div>
          <small class="${l.id === current.id ? 'text-light' : 'text-muted'}">${l.landmark}</small>
        </div>
        ${l.id === current.id ? '<i class="bi bi-check2-circle fs-4"></i>' : '<i class="bi bi-chevron-right text-muted"></i>'}
      </button>
    `).join('');

    modalList.querySelectorAll('button').forEach(btn => {
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
  }

  // Auto-init on DOM ready
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
    Location,
    Auth,
    Cart,
    Orders,
    showToast,
    initCommonUI
  };
})();

// Global reference for inline event handlers
window.FoodWalaApp = FoodWalaApp;
