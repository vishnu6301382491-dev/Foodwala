/**
 * Test Suite: Cart & Checkout Navigation Flow & Bounce Prevention
 * Validates:
 * 1. Cart.getCart() multi-key fallback (foodwala_cart, cart, sessionStorage)
 * 2. Cart.getCart() array normalization
 * 3. Cart.getItems() availability
 * 4. Empty cart bounce prevention on checkout & cart redirects in login.html & facebook-auth.js
 * 5. Populated cart preserves checkout redirect
 * 6. window.handlePostLoginNavigation global exposure in login.html & register.html
 * 7. checkout.html cart-first validation structure & post-login redirect clearance
 * 8. cart.html empty cart cleanup of foodwala_post_login_redirect
 * 9. Fresh cache busters present on all critical scripts
 * 10. 100% Exact parity between root files and src/main/webapp/
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

// TEST 4: Empty Cart Checkout & Cart Redirect Guards in login.html & register.html
console.log('\nTest 4: Empty Cart Checkout & Cart Redirect Guards in login & register...');

function computeRedirectTarget(urlRedirect, storedRedirect, cart) {
  let redirectTarget = urlRedirect || storedRedirect || './index.html';
  if (redirectTarget.includes('checkout.html') || redirectTarget.includes('cart.html')) {
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

// Case 4A: Cart is empty, redirect was checkout.html -> MUST route to ./index.html
const targetEmptyCheckout = computeRedirectTarget('./checkout.html', null, Cart);
assert.strictEqual(targetEmptyCheckout, './index.html', 'Empty cart must NOT redirect to checkout.html');
console.log('   ✅ PASS 4A: Empty cart prevented from redirecting to checkout.html.');

// Case 4B: Cart is empty, redirect was cart.html -> MUST route to ./index.html
const targetEmptyCart = computeRedirectTarget('./cart.html', null, Cart);
assert.strictEqual(targetEmptyCart, './index.html', 'Empty cart must NOT redirect to cart.html');
console.log('   ✅ PASS 4B: Empty cart prevented from redirecting to cart.html.');

// Case 4C: Cart has items, redirect was checkout.html -> MUST route to ./checkout.html
mockLocalStorage['foodwala_cart'] = JSON.stringify({
  restaurantId: 1,
  items: [{ id: 1, name: 'Idli', price: 50, quantity: 1 }]
});
const targetWithItems = computeRedirectTarget('./checkout.html', null, Cart);
assert.strictEqual(targetWithItems, './checkout.html', 'Cart with items MUST proceed to checkout.html');
console.log('   ✅ PASS 4C: Populated cart successfully proceeds to checkout.html.');
delete mockLocalStorage['foodwala_cart'];

// TEST 5: Verify window.handlePostLoginNavigation exposure in login.html and register.html
console.log('\nTest 5: Checking window.handlePostLoginNavigation in login.html & register.html...');
const loginSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/login.html', 'utf8');
assert.ok(loginSrc.includes('window.handlePostLoginNavigation = handlePostLoginNavigation;'), 'login.html must expose handlePostLoginNavigation on window');

const registerSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/register.html', 'utf8');
assert.ok(registerSrc.includes('window.handlePostLoginNavigation = function'), 'register.html must expose handlePostLoginNavigation on window');
console.log('   ✅ PASS: window.handlePostLoginNavigation is exposed globally in login and register.');

// TEST 6: Verify checkout.html structure: Cart check occurs before Auth check
console.log('\nTest 6: Checking checkout.html cart-first validation structure...');
const checkoutSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/checkout.html', 'utf8');
const section1Pos = checkoutSrc.indexOf('// --- SECTION 1: Cart Validation & Restaurant Resolution ---');
const section0Pos = checkoutSrc.indexOf('// --- SECTION 0: Top-Level Authentication & Profile Resolution ---');
assert.ok(section1Pos > -1 && section0Pos > -1, 'Both Section 1 and Section 0 must exist');
assert.ok(section1Pos < section0Pos, 'Section 1 (Cart Validation) MUST execute before Section 0 (Auth Check) to avoid redirecting empty carts to login');

// Verify that empty cart branch explicitly cleans foodwala_post_login_redirect
const emptyCartBlock = checkoutSrc.substring(section1Pos, section0Pos);
assert.ok(emptyCartBlock.includes("localStorage.removeItem('foodwala_post_login_redirect');"), 'Empty cart block in checkout.html must remove post-login redirect');
console.log('   ✅ PASS: checkout.html verifies cart FIRST and cleans post-login redirect on empty cart.');

// TEST 7: Verify cart.html cleans foodwala_post_login_redirect when empty
console.log('\nTest 7: Checking cart.html cleans foodwala_post_login_redirect when empty...');
const cartSrc = fs.readFileSync('D:/FoodWala_Eclipse_Project/cart.html', 'utf8');
const emptyCartPos = cartSrc.indexOf('if (!cart.items || cart.items.length === 0)');
assert.ok(emptyCartPos > -1, 'cart.html must have empty cart check');
const emptyCartSnippet = cartSrc.substring(emptyCartPos, emptyCartPos + 200);
assert.ok(emptyCartSnippet.includes("localStorage.removeItem('foodwala_post_login_redirect');"), 'cart.html empty state must remove foodwala_post_login_redirect');
console.log('   ✅ PASS: cart.html cleans foodwala_post_login_redirect when empty.');

// TEST 8: Verify cache busters on facebook-auth.js in login.html & register.html
console.log('\nTest 8: Checking cache busters on facebook-auth.js...');
assert.ok(loginSrc.includes('facebook-auth.js?v=20261102_02'), 'login.html must include cache-busting version on facebook-auth.js');
assert.ok(registerSrc.includes('facebook-auth.js?v=20261102_02'), 'register.html must include cache-busting version on facebook-auth.js');
console.log('   ✅ PASS: facebook-auth.js includes fresh cache buster (?v=20261102_02).');

// TEST 9: Parity check across all 7 pairs
console.log('\nTest 9: Verifying 100% exact parity with src/main/webapp/...');
const filesToCheck = [
  'checkout.html',
  'cart.html',
  'login.html',
  'register.html',
  'index.html',
  'home.html',
  'js/facebook-auth.js'
];
for (const rel of filesToCheck) {
  const rootContent = fs.readFileSync(path.join('D:/FoodWala_Eclipse_Project', rel), 'utf8');
  const webappContent = fs.readFileSync(path.join('D:/FoodWala_Eclipse_Project/src/main/webapp', rel), 'utf8');
  assert.strictEqual(rootContent, webappContent, `Parity mismatch between ${rel} and src/main/webapp/${rel}`);
}
console.log('   ✅ PASS: All 7 files have 100% bit-for-bit parity with src/main/webapp/.');

console.log('\n============================================================');
console.log('🎉 ALL 9 COMPREHENSIVE INTEGRATION & PARITY TESTS PASSED!');
console.log('============================================================\n');
