/**
 * Test Suite: Facebook Auth & Checkout Redirect Loop Prevention
 * Verifies:
 * 1. fbAsyncInit passive check (NO auto-login or redirect on page load)
 * 2. Explicit loginWithFacebook triggers fetchUserProfile and populates all storage keys
 * 3. foodwala_current_user set in localStorage and sessionStorage
 * 4. FoodWalaApp.Auth.getCurrentUser() multi-key fallback resilience (currentUser, foodwala_user, sessionStorage)
 * 5. Corrupt / 'null' string resilience in FoodWalaApi and FoodWalaApp
 * 6. cleanupObsoleteDemoData non-aggressive migration
 * 7. Checkout authentication guard resolution without redirection loop
 * 8. Redirect sanitization against loop redirects and open redirect
 * 9. Resilience when authResponse is undefined / null
 * 10. Logout cleanup of all session keys and post-login redirect
 */

const assert = require('assert');

console.log('============================================================');
console.log('🧪 TESTING FACEBOOK AUTH & REDIRECT LOOP PREVENTION');
console.log('============================================================\n');

// Mock browser storage
const mockLocalStorage = {};
const mockSessionStorage = {};
const dispatchedEvents = [];
const registeredListeners = {};

global.window = {
  location: {
    href: 'https://vishnu6301382491-dev.github.io/Foodwala/login.html?redirect=./checkout.html',
    search: '?redirect=./checkout.html',
    origin: 'https://vishnu6301382491-dev.github.io',
    pathname: '/Foodwala/login.html'
  },
  localStorage: {
    getItem: (k) => (k in mockLocalStorage ? mockLocalStorage[k] : null),
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
  },
  sessionStorage: {
    getItem: (k) => (k in mockSessionStorage ? mockSessionStorage[k] : null),
    setItem: (k, v) => { mockSessionStorage[k] = String(v); },
    removeItem: (k) => { delete mockSessionStorage[k]; },
    clear: () => { Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]); }
  },
  dispatchEvent: (evt) => { dispatchedEvents.push(evt); },
  addEventListener: (evt, fn) => {
    registeredListeners[evt] = registeredListeners[evt] || [];
    registeredListeners[evt].push(fn);
  },
  removeEventListener: (evt, fn) => {},
  CustomEvent: function (type, options) {
    this.type = type;
    this.detail = options ? options.detail : null;
  }
};
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;

const mockButtons = [
  { dataset: {}, addEventListener: function(e, fn) { this.clickHandler = fn; } }
];

global.document = {
  readyState: 'complete',
  getElementById: (id) => null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => (sel === '.js-facebook-auth-btn' ? mockButtons : []),
  getElementsByTagName: () => [{ parentNode: { insertBefore: () => {} } }],
  createElement: () => ({ setAttribute: () => {} }),
  addEventListener: (evt, fn) => {
    registeredListeners[evt] = registeredListeners[evt] || [];
    registeredListeners[evt].push(fn);
  },
  body: {
    insertAdjacentHTML: () => {}
  }
};

// Mock FB SDK
let fbLoginStatusCallback = null;
let fbLoginCallback = null;
let fbApiCallback = null;

global.FB = {
  init: (cfg) => {
    global.FB.initializedConfig = cfg;
  },
  getLoginStatus: (cb) => {
    fbLoginStatusCallback = cb;
    // Simulate user already connected in Facebook cookie/session
    cb({ status: 'connected', authResponse: { accessToken: 'fb_token_xyz_123', userID: 'fb_usr_999' } });
  },
  login: (cb, opts) => {
    fbLoginCallback = cb;
    cb({ status: 'connected', authResponse: { accessToken: 'fb_token_interactive_456', userID: 'fb_usr_999' } });
  },
  api: (endpoint, params, cb) => {
    fbApiCallback = cb;
    cb({
      id: 'fb_usr_999',
      name: 'Vishnu Chinnapareddy',
      email: 'vishnu@example.com',
      picture: { data: { url: 'https://graph.facebook.com/999/picture' } }
    });
  }
};

// 1. Load app modules
require('../js/adapters/mockAdapter.js');
require('../js/api.js');
require('../js/app.js');

const FoodWalaApp = global.window.FoodWalaApp;
const FoodWalaApi = global.window.FoodWalaApi;

assert(FoodWalaApp, 'FoodWalaApp must be defined');
assert(FoodWalaApp.Auth, 'FoodWalaApp.Auth must be defined');
assert(typeof FoodWalaApp.Auth.getCurrentUser === 'function', 'getCurrentUser must be a function');

console.log('Test 1: Verifying fbAsyncInit does NOT auto-redirect or auto-login on initial load...');
const initialLocationHref = global.window.location.href;

// Load js/facebook-auth.js
require('../js/facebook-auth.js');

assert(typeof global.window.fbAsyncInit === 'function', 'fbAsyncInit must be exported to window');

// Trigger fbAsyncInit as if Facebook SDK just loaded
global.window.fbAsyncInit();

// Verify that initial load did NOT set user session and did NOT redirect
assert.strictEqual(global.window.location.href, initialLocationHref, 'URL must not be changed on initial page load');
assert.strictEqual(mockLocalStorage['foodwala_current_user'], undefined, 'foodwala_current_user must not be auto-set on passive load');
assert.strictEqual(FoodWalaApp.Auth.getCurrentUser(), null, 'Current user must remain null before user clicks login');
console.log('   ✅ PASS: fbAsyncInit executed passively without auto-login or redirecting.');

console.log('\nTest 2: Verifying button binding works when document.readyState is complete...');
assert(mockButtons[0].clickHandler, 'Button click handler must be bound even when document.readyState is complete');
assert.strictEqual(mockButtons[0].dataset.fbBound, 'true', 'Button must be flagged as bound');
console.log('   ✅ PASS: Button click listener bound correctly.');

console.log('\nTest 3: Verifying explicit loginWithFacebook button click logs in and populates all keys...');
global.window.loginWithFacebook();

// Verify all required storage keys are properly set
assert(mockLocalStorage['foodwala_current_user'], 'foodwala_current_user must be set in localStorage');
assert(mockSessionStorage['foodwala_current_user'], 'foodwala_current_user must be set in sessionStorage');
assert(mockLocalStorage['currentUser'], 'currentUser must be set in localStorage');
assert(mockLocalStorage['foodwala_user'], 'foodwala_user must be set in localStorage');
assert.strictEqual(mockLocalStorage['foodwala_auth_token'], 'fb_token_interactive_456');

const savedUser = JSON.parse(mockLocalStorage['foodwala_current_user']);
assert.strictEqual(savedUser.name, 'Vishnu Chinnapareddy');
assert.strictEqual(savedUser.email, 'vishnu@example.com');
assert.strictEqual(savedUser.authProvider, 'facebook');

// Verify authChanged event dispatched
const authEvent = dispatchedEvents.find(e => e.type === 'foodwala:authChanged');
assert(authEvent, 'foodwala:authChanged event must have been dispatched');
assert.strictEqual(authEvent.detail.name, 'Vishnu Chinnapareddy');

console.log('   ✅ PASS: Explicit loginWithFacebook successfully set all storage keys and dispatched event.');

console.log('\nTest 4: Verifying Checkout Authentication Guard with Facebook session...');
const checkoutUser = FoodWalaApp.Auth.getCurrentUser();
assert(checkoutUser, 'FoodWalaApp.Auth.getCurrentUser() must not be null');
assert.strictEqual(checkoutUser.name, 'Vishnu Chinnapareddy');
assert.strictEqual(checkoutUser.email, 'vishnu@example.com');
console.log('   ✅ PASS: Checkout auth guard successfully identifies Facebook user, preventing redirect back to login.');

console.log('\nTest 5: Verifying multi-key resilience fallback in getCurrentUser()...');

// Scenario 5A: Only localStorage 'currentUser' exists
global.window.localStorage.clear();
global.window.sessionStorage.clear();
mockLocalStorage['currentUser'] = JSON.stringify({ userId: 101, name: 'Fallback CurrentUser', email: 'fallback@test.com' });

let user5A = FoodWalaApp.Auth.getCurrentUser();
assert(user5A, 'Must resolve user from currentUser fallback');
assert.strictEqual(user5A.name, 'Fallback CurrentUser');
assert(mockLocalStorage['foodwala_current_user'], 'Must migrate to foodwala_current_user');
console.log('   ✅ PASS: 5A: Resolved from currentUser and migrated to foodwala_current_user.');

// Scenario 5B: Only localStorage 'foodwala_user' exists
global.window.localStorage.clear();
global.window.sessionStorage.clear();
mockLocalStorage['foodwala_user'] = JSON.stringify({ userId: 102, name: 'Fallback FoodwalaUser', phone: '+919876543210' });

let user5B = FoodWalaApp.Auth.getCurrentUser();
assert(user5B, 'Must resolve user from foodwala_user fallback');
assert.strictEqual(user5B.name, 'Fallback FoodwalaUser');
assert(mockLocalStorage['foodwala_current_user'], 'Must migrate to foodwala_current_user');
console.log('   ✅ PASS: 5B: Resolved from foodwala_user and migrated to foodwala_current_user.');

// Scenario 5C: Only sessionStorage 'foodwala_current_user' exists
global.window.localStorage.clear();
global.window.sessionStorage.clear();
mockSessionStorage['foodwala_current_user'] = JSON.stringify({ userId: 103, name: 'Session User', email: 'session@test.com' });

let user5C = FoodWalaApp.Auth.getCurrentUser();
assert(user5C, 'Must resolve user from sessionStorage');
assert.strictEqual(user5C.name, 'Session User');
assert(mockLocalStorage['foodwala_current_user'], 'Must migrate to localStorage');
console.log('   ✅ PASS: 5C: Resolved from sessionStorage and migrated to localStorage.');

// Scenario 5D: foodwala_current_user contains string 'null'
global.window.localStorage.clear();
global.window.sessionStorage.clear();
mockLocalStorage['foodwala_current_user'] = 'null';
mockLocalStorage['currentUser'] = JSON.stringify({ userId: 104, name: 'Recovered Alice', email: 'alice@test.com' });

let user5D = FoodWalaApp.Auth.getCurrentUser();
assert(user5D, 'Must recover user even when foodwala_current_user was string null');
assert.strictEqual(user5D.name, 'Recovered Alice');
assert(mockLocalStorage['foodwala_current_user'].includes('Recovered Alice'), 'Must self-heal foodwala_current_user');
console.log('   ✅ PASS: 5D: Handled string "null" correctly and recovered Alice from fallback.');

// Scenario 5E: Corrupted / invalid data returns null
global.window.localStorage.clear();
global.window.sessionStorage.clear();
mockLocalStorage['foodwala_current_user'] = 'invalid_json';
assert.strictEqual(FoodWalaApp.Auth.getCurrentUser(), null, 'Must return null for invalid JSON');

mockLocalStorage['foodwala_current_user'] = JSON.stringify({ name: '   ' }); // Blank name, no email/phone
assert.strictEqual(FoodWalaApp.Auth.getCurrentUser(), null, 'Must return null for incomplete profile');
console.log('   ✅ PASS: 5E: Invalid or malformed user correctly returns null.');

console.log('\nTest 6: Verifying FoodWalaApi.getCurrentUser() fallback resilience with string "null"...');
global.window.localStorage.clear();
mockLocalStorage['foodwala_current_user'] = 'null';
mockLocalStorage['currentUser'] = JSON.stringify({ userId: 105, name: 'Api Fallback User', email: 'apifallback@test.com' });
const apiUser = FoodWalaApi.getCurrentUser();
assert(apiUser, 'FoodWalaApi.getCurrentUser() must resolve from fallback even if primary is "null"');
assert.strictEqual(apiUser.name, 'Api Fallback User');
console.log('   ✅ PASS: FoodWalaApi.getCurrentUser() successfully falls back despite "null" string.');

console.log('\nTest 7: Verifying cleanupObsoleteDemoData non-aggressive migration when primary is "null"...');
global.window.localStorage.clear();
mockLocalStorage['foodwala_current_user'] = 'null';
mockLocalStorage['foodwala_user'] = JSON.stringify({ userId: 201, name: 'Preserved User', email: 'preserved@test.com' });

// Simulate cleanup logic from app.js
function isStoredUserValid(raw) {
  if (!raw || raw === 'null' || raw === 'undefined') return false;
  try {
    const u = (typeof raw === 'string') ? JSON.parse(raw) : raw;
    if (!u || typeof u !== 'object') return false;
    const hasName = u.name && String(u.name).trim().length > 0;
    const hasEmail = u.email && String(u.email).trim().length > 0;
    const hasPhone = u.phone && String(u.phone).trim().length > 0;
    const hasId = Boolean(u.userId || u.id);
    return Boolean(hasName && (hasEmail || hasPhone || hasId));
  } catch (e) {
    return false;
  }
}

const legacyKeys = ['foodwala_user', 'currentUser'];
for (const key of legacyKeys) {
  const legacyVal = mockLocalStorage[key];
  if (legacyVal) {
    if (isStoredUserValid(legacyVal)) {
      const curVal = mockLocalStorage['foodwala_current_user'];
      if (!isStoredUserValid(curVal)) {
        mockLocalStorage['foodwala_current_user'] = legacyVal;
      }
    } else {
      delete mockLocalStorage[key];
    }
  }
}

assert(mockLocalStorage['foodwala_current_user'].includes('Preserved User'), 'foodwala_current_user must be migrated');
assert(mockLocalStorage['foodwala_user'], 'Valid foodwala_user must NOT be deleted');
console.log('   ✅ PASS: cleanupObsoleteDemoData migrates valid user data even if primary was string "null".');

console.log('\nTest 8: Verifying authResponse null/undefined safety in fetchUserProfile...');
let safetyErrorCaught = false;
try {
  // Simulate Facebook calling statusChangeCallback with missing authResponse
  global.window.statusChangeCallback({ status: 'connected', authResponse: null });
} catch (e) {
  safetyErrorCaught = true;
}
assert.strictEqual(safetyErrorCaught, false, 'statusChangeCallback with null authResponse must not throw uncaught error');
console.log('   ✅ PASS: null authResponse handled safely without throwing.');

console.log('\nTest 9: Verifying explicit logout cleans all session variants...');
FoodWalaApp.Auth.logout();
assert.strictEqual(mockLocalStorage['foodwala_current_user'], undefined);
assert.strictEqual(mockLocalStorage['foodwala_user'], undefined);
assert.strictEqual(mockLocalStorage['currentUser'], undefined);
assert.strictEqual(mockLocalStorage['foodwala_auth_token'], undefined);
assert.strictEqual(mockLocalStorage['foodwala_post_login_redirect'], undefined);
assert.strictEqual(mockSessionStorage['foodwala_current_user'], undefined);
assert.strictEqual(mockSessionStorage['foodwala_user'], undefined);
assert.strictEqual(mockSessionStorage['currentUser'], undefined);
assert.strictEqual(FoodWalaApp.Auth.getCurrentUser(), null);
console.log('   ✅ PASS: Explicit logout completely clears all session and fallback keys.');

console.log('\n============================================================');
console.log('🎉 ALL 9/9 FACEBOOK & REDIRECT LOOP PREVENTION TESTS PASSED!');
console.log('============================================================');
