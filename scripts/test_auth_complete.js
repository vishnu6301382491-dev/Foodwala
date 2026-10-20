const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 TESTING FOODWALA COMPLETE AUTHENTICATION PIPELINE');
console.log('============================================================\n');

// 1. Syntax Check on HTML pages
console.log('Test 1: Verifying zero syntax errors in login.html and register.html...');
['login.html', 'register.html'].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const scripts = content.match(/<script[\s\S]*?<\/script>/gi) || [];
  scripts.forEach((tag, idx) => {
    if (tag.includes('src=') && !tag.replace(/<script[^>]*src=[^>]*>/i, '').replace(/<\/script>/i, '').trim()) return;
    const code = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      new Function(code);
    } catch (e) {
      assert.fail(`SyntaxError in ${file} script ${idx}: ${e.message}`);
    }
  });
  console.log(`   ✅ PASS: ${file} scripts are 100% syntactically valid.`);
});

// 2. Setup mock browser environment
const storage = {};
global.window = {
  location: {
    origin: 'http://localhost:8080',
    search: '',
    pathname: '/login.html'
  },
  localStorage: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  },
  sessionStorage: {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {}
  },
  dispatchEvent: () => {},
  CustomEvent: function (t, d) { this.type = t; this.detail = d; }
};
global.localStorage = global.window.localStorage;
global.sessionStorage = global.window.sessionStorage;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  body: { insertAdjacentHTML: () => {} }
};

require('../js/adapters/mockAdapter.js');
require('../js/google-auth.js');

const mockAdapter = window.FoodWalaAdapters.mock;
const GoogleAuth = window.FoodWalaGoogleAuth;

async function run() {
  // Test 2: Email & Password Sign In (User in screenshot)
  console.log('\nTest 2: Verifying Email & Password Sign In for Vishnu Vardhan Reddy...');
  const loginRes = await mockAdapter.login('vishnuvardhanreddych45@gmail.com', 'Vishnu@143');
  assert.strictEqual(loginRes.success, true, 'Login should succeed for Vishnu@143');
  assert.strictEqual(loginRes.user.email, 'vishnuvardhanreddych45@gmail.com');
  console.log(`   ✅ PASS: Logged in successfully as ${loginRes.user.name} (${loginRes.user.email}).`);

  // Test 3: Sign In with Google
  console.log('\nTest 3: Verifying Sign In with Google...');
  const token = GoogleAuth.generateMockIdToken({
    name: 'Vishnu Vardhan Reddy',
    email: 'vishnuvardhanreddych45@gmail.com',
    sub: '109876543210987654321'
  });
  let googleUser = null;
  await GoogleAuth.handleCredentialResponse({ credential: token }, {
    onSuccess: (u) => { googleUser = u; },
    onError: (err) => { assert.fail('Google login failed: ' + err.message); }
  });
  assert.ok(googleUser, 'Google user should be authenticated');
  assert.strictEqual(googleUser.email, 'vishnuvardhanreddych45@gmail.com');
  assert.strictEqual(googleUser.authProvider, 'google');
  console.log(`   ✅ PASS: Sign In with Google succeeded for ${googleUser.name}.`);

  // Test 4: Sign Up with Google (New customer)
  console.log('\nTest 4: Verifying Sign Up with Google...');
  const newEmail = 'new.signup.customer@gmail.com';
  const signupToken = GoogleAuth.generateMockIdToken({
    name: 'Ananya Rao',
    email: newEmail,
    sub: '555555555555555555555'
  });
  let newGoogleUser = null;
  await GoogleAuth.handleCredentialResponse({ credential: signupToken }, {
    isSignUp: true,
    getSelectedRole: () => 'CUSTOMER',
    onSuccess: (u) => { newGoogleUser = u; },
    onError: (err) => { assert.fail('Google signup failed: ' + err.message); }
  });
  assert.ok(newGoogleUser, 'New Google customer should be created');
  assert.strictEqual(newGoogleUser.email, newEmail);
  assert.strictEqual(newGoogleUser.role, 'CUSTOMER');
  console.log(`   ✅ PASS: Sign Up with Google created customer ${newGoogleUser.name}.`);

  // Test 5: Sign Up standard customer registration
  console.log('\nTest 5: Verifying customer registration with OTP...');
  const phone = '9123456789';
  const otpRes = await mockAdapter.sendOtp(phone);
  assert.strictEqual(otpRes.success, true);
  const verifyRes = await mockAdapter.verifyOtp(phone, '123456');
  assert.strictEqual(verifyRes.success, true);
  const regRes = await mockAdapter.signup({
    name: 'Test Customer',
    email: 'testcustomer@foodwala.com',
    phone: phone,
    password: 'Password@123',
    role: 'customer'
  });
  assert.strictEqual(regRes.success, true);
  console.log(`   ✅ PASS: Customer registration succeeded for ${regRes.user.name}.`);

  console.log('\n============================================================');
  console.log('🎉 ALL AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('============================================================\n');
}

run();
