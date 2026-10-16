/**
 * FoodWala Unified API Client (api.js)
 * 
 * Routes operations to the active adapter configured in js/config.js:
 * - window.FOODWALA_CONFIG.MODE === 'mock' -> js/adapters/mockAdapter.js (browser-only)
 * - window.FOODWALA_CONFIG.MODE === 'live' -> js/adapters/liveAdapter.js (Render backend + MySQL)
 */

(function (window) {
  'use strict';

  function getAdapter() {
    const config = window.FOODWALA_CONFIG || { MODE: 'live' };
    const adapters = window.FoodWalaAdapters || {};
    if (config.MODE === 'mock' && adapters.mock) {
      return adapters.mock;
    }
    if (adapters.live) {
      return adapters.live;
    }
    console.error('[FoodWala API] liveAdapter is not available. Please verify scripts loading order.');
    return adapters.live || adapters.mock;
  }

  function normalizePhone(rawPhone) {
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
    get config() {
      return window.FOODWALA_CONFIG || { MODE: 'live' };
    },

    get adapter() {
      return getAdapter();
    },

    get API_BASE_URL() {
      return (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'https://foodwala-backend.onrender.com';
    },

    normalizePhone: normalizePhone,

    getCurrentUser: function () {
      try {
        const item = localStorage.getItem('foodwala_current_user');
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    },

    getAuthToken: function () {
      return localStorage.getItem('foodwala_auth_token') || '';
    },

    // Health
    checkHealth: async function () {
      return await getAdapter().checkHealth();
    },

    // Catalog
    getRestaurants: async function () {
      return await getAdapter().getRestaurants();
    },

    getCategories: async function () {
      return await getAdapter().getCategories();
    },

    getRestaurantMenu: async function (restaurantId) {
      return await getAdapter().getRestaurantMenu(restaurantId);
    },

    // Auth & OTP
    checkPhone: async function (phone) {
      return await getAdapter().checkPhone(phone);
    },

    sendOtp: async function (phone) {
      return await getAdapter().sendOtp(phone);
    },

    verifyOtp: async function (phone, code) {
      return await getAdapter().verifyOtp(phone, code);
    },

    registerMobile: async function (data) {
      return await getAdapter().registerMobile(data);
    },

    signup: async function (data) {
      return await getAdapter().signup(data);
    },

    login: async function (identifier, password) {
      return await getAdapter().login(identifier, password);
    },

    loginEmail: async function (identifier, password) {
      return await getAdapter().login(identifier, password);
    },

    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      return await getAdapter().changePassword(currentPassword, newPassword, confirmPassword);
    },

    forgotPassword: async function (identifier) {
      return await getAdapter().forgotPassword(identifier);
    },

    resetPassword: async function (tokenOrCode, newPassword) {
      return await getAdapter().resetPassword(tokenOrCode, newPassword);
    },

    logout: async function () {
      return await getAdapter().logout();
    },

    // User Addresses
    getAddresses: async function () {
      return await getAdapter().getAddresses();
    },

    saveAddress: async function (addressData) {
      return await getAdapter().saveAddress(addressData);
    },

    deleteAddress: async function (addressId) {
      return await getAdapter().deleteAddress(addressId);
    },

    setDefaultAddress: async function (addressId) {
      return await getAdapter().setDefaultAddress(addressId);
    },

    // Cart
    getCart: async function () {
      return await getAdapter().getCart();
    },

    syncCart: async function (cartData) {
      return await getAdapter().syncCart(cartData);
    },

    // Coupons
    validateCoupon: async function (code, total, userId) {
      return await getAdapter().validateCoupon(code, total, userId);
    },

    // Orders
    placeOrder: async function (orderPayload) {
      return await getAdapter().placeOrder(orderPayload);
    },

    getOrders: async function (userId, phone) {
      return await getAdapter().getOrders(userId, phone);
    },

    getOrderById: async function (orderId) {
      return await getAdapter().getOrderById(orderId);
    },

    // Admin
    getAdminUsers: async function () {
      return await getAdapter().getAdminUsers();
    },

    getAdminOrders: async function () {
      return await getAdapter().getAdminOrders();
    },

    getAdminLoginHistory: async function () {
      return await getAdapter().getAdminLoginHistory();
    },

    // Restaurant Partner Management
    getRestaurantDetails: async function (restaurantId) {
      return await getAdapter().getRestaurantDetails(restaurantId);
    },

    getRestaurantManageMenu: async function (restaurantId) {
      return await getAdapter().getRestaurantManageMenu(restaurantId);
    },

    addMenuItem: async function (itemData) {
      return await getAdapter().addMenuItem(itemData);
    },

    updateMenuItem: async function (menuId, itemData) {
      return await getAdapter().updateMenuItem(menuId, itemData);
    },

    toggleItemAvailability: async function (menuId, isAvailable) {
      return await getAdapter().toggleItemAvailability(menuId, isAvailable);
    },

    deleteMenuItem: async function (menuId) {
      return await getAdapter().deleteMenuItem(menuId);
    },

    toggleRestaurantStatus: async function (restaurantId, isOpen) {
      return await getAdapter().toggleRestaurantStatus(restaurantId, isOpen);
    },

    getRestaurantOrders: async function (restaurantId) {
      return await getAdapter().getRestaurantOrders(restaurantId);
    },

    updateRestaurantOrderStatus: async function (orderId, status) {
      return await getAdapter().updateRestaurantOrderStatus(orderId, status);
    }
  };

  window.FoodWalaApi = FoodWalaApi;

})(typeof window !== 'undefined' ? window : this);
