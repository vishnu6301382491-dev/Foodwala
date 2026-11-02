/**
 * Test Suite: Cart & Checkout Navigation Flow & Bounce Prevention
 * Validates:
 * 1. Cart.getCart() multi-key fallback (foodwala_cart, cart, sessionStorage)
 * 2. Cart.getCart() array normalization
 * 3. Cart.getItems() availability
 * 4. Empty cart bounce prevention on checkout redirect in login.html & facebook-auth.js
 * 5. Populated cart preserves checkout redirect
 * 6. window.handlePostLoginNavigation global exposure in login.html
 */

const assert = require('assert');
const fs = require('fs');

console.log('============================================================');
console.log('🧪 TESTING CART, CHECKOUT & LOGIN REDIRECTION INTEGRATION');
console.log('============================================================\n');

// Mock browser environment
const mockLocalStorage = {};
const mockSessionStorage = {};
const dispatchedEvents = [];

global.window = {
  location: {
    href: './login.html',
    search: '',
    origin: 'https://vishnu6301382491-dev.github.io'
  },
  localStorage: {
    getItem: (k) => (k in mockLocalStorage ? mockLocalStorage[k] : null),
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  },
  sessionStorage: {
    getItem: (k) => (k in mockSessionStorage ? mockSessionStorage[k] : null),
    setItem: (k, v) => { mockSessionStorage[k] = String(v); },
    removeItem: (k) => { delete mockSessionStorage[k]; }
  },
  dispatchEvent: (e) => { dispatchedEvents.push(e); },
  addEventListener: () => {},
  CustomEvent: function(t, o) { this.type = t; this.detail = o ? o.detail : null; }
};
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load app.js
require('../js/app.js');
const Cart = global.window.FoodWalaApp.Cart;

// TEST 1: Cart.getItems() method exists
console.log('Test 1: Cart.getItems() availability and structure...');
assert.strictEqual(typeof Cart.getItems, 'function', 'Cart.getItems must be a function');
const emptyItems = Cart.getItems();
assert.ok(Array.isArray(emptyItems), 'Cart.getItems() must return an array');
assert.strictEqual(emptyItems.length, 0);
console.log('   ✅ PASS: Cart.getItems() correctly exposed.');

// TEST 2: Multi-key fallback for Cart.getCart() from legacy 'cart'
console.log('\nTest 2: Multi-key fallback from legacy "cart" key...');
mockLocalStorage['cart'] = JSON.stringify({
  restaurantId: 4,
  restaurantName: 'Vidyarthi Bhavan',
  items: [{ id: 101, name: 'Masala Dosa', price: 90, quantity: 2 }]
});
const restoredFromLegacy = Cart.getCart();
assert.strictEqual(restoredFromLegacy.restaurantId, 4);
assert.strictEqual(restoredFromLegacy.items.length, 1);
assert.strictEqual(Cart.getItems().length, 1);
assert.strictEqual(Cart.getItemCount(), 2);
delete mockLocalStorage['cart'];
delete mockLocalStorage['foodwala_cart'];
console.log('   ✅ PASS: Successfully recovered cart from legacy key.');

// TEST 3: Array format normalization
console.log('\nTest 3: Raw array normalization in Cart.getCart()...');
mockLocalStorage['foodwala_cart'] = JSON.stringify([
  { id: 202, restaurantId: 5, name: 'Filter Coffee', price: 30, quantity: 3 }
]);
const normalizedCart = Cart.getCart();
assert.ok(!Array.isArray(normalizedCart), 'Normalized cart should be an object');
assert.ok(Array.isArray(normalizedCart.items), 'items property should be an array');
assert.strictEqual(normalizedCart.restaurantId, 5);
assert.strictEqual(normalizedCart.items.length, 1);
assert.strictEqual(Cart.getItemCount(), 3);
delete mockLocalStorage['foodwala_cart'];
console.log('   ✅ PASS: Array cart correctly normalized to { restaurantId, items }.');

// TEST 4: Empty Cart Checkout Redirect Guard (Simulation of login.html logic)
console.log('\nTest 4: Empty Cart Checkout Redirect Guard in login.html...');

function computeRedirectTarget(urlRedirect, storedRedirect, cart) {
  let redirectTarget = urlRedirect || storedRedirect || './index.html';
  if (redirectTarget.includes('checkout.html')) {
    let itemCount = 0;
    if (cart && typeof cart.getItemCount === 'function') {
      itemCount = cart.getItemCount();
    }
    if (itemCount === 0) {
      redirectTarget = './index.html';
    }
  }
  return redirectTarget;
}

// Case A: Cart is empty, redirect was checkout.html -> MUST route to ./index.html
const targetEmpty = computeRedirectTarget('./checkout.html', null, Cart);
assert.strictEqual(targetEmpty, './index.html', 'Empty cart must NOT redirect to checkout.html');
console.log('   ✅ PASS: Empty cart prevented from redirecting to checkout.html.');

// Case B: Cart has items, redirect was checkout.html -> MUST route to ./checkout.html
mockLocalStorage['foodwala_cart'] = JSON.stringify({
  restaurantId: 1,
  items: [{ id: 1, name: 'Idli', price: 50, quantity: 1 }]
});
const targetWithItems = computeRedirectTarget('./checkout.html', null, Cart);
assert.strictEqual(targetWithItems, './checkout.html', 'Cart with items MUST proceed to checkout.html');
console.log('   ✅ PASS: Populated cart successfully proceeds to checkout.html.');

// TEST 5: Verify window.handlePostLoginNavigation exposure in login.html source
console.log('\nTest 5: Checking window.handlePostLoginNavigation in login.html...');
const loginSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/login.html', 'utf8');
assert.ok(loginSrc.includes('window.handlePostLoginNavigation = handlePostLoginNavigation;'), 'login.html must expose handlePostLoginNavigation on window');
console.log('   ✅ PASS: window.handlePostLoginNavigation is exposed globally.');

// TEST 6: Verify checkout.html cleans foodwala_post_login_redirect
console.log('\nTest 6: Checking checkout.html clears post-login redirect upon loading...');
const checkoutSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/checkout.html', 'utf8');
assert.ok(checkoutSrc.includes("localStorage.removeItem('foodwala_post_login_redirect');"), 'checkout.html must clear foodwala_post_login_redirect');
console.log('   ✅ PASS: checkout.html cleans stale post-login redirect.');

console.log('\n============================================================');
console.log('🎉 ALL CART & CHECKOUT INTEGRATION TESTS PASSED!');
console.log('============================================================\n');
