const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 RUNNING OTP MANUAL ENTRY VERIFICATION TEST SUITE');
console.log('============================================================\n');

// 1. Verify login.html
console.log('Test 1: Inspecting login.html for absence of OTP auto-fill & badges...');
const loginHtml = fs.readFileSync(path.resolve(__dirname, '../login.html'), 'utf8');

assert(!loginHtml.includes('id="login-otp-demo-notice"'), 'FAIL: login-otp-demo-notice found in login.html');
assert(!loginHtml.includes('id="login-otp-code-badge"'), 'FAIL: login-otp-code-badge found in login.html');
assert(!loginHtml.includes('id="autofill-login-otp-btn"'), 'FAIL: autofill-login-otp-btn found in login.html');
assert(!loginHtml.includes('id="forgot-otp-sandbox-notice"'), 'FAIL: forgot-otp-sandbox-notice found in login.html');
assert(!loginHtml.includes('id="autofill-forgot-otp-btn"'), 'FAIL: autofill-forgot-otp-btn found in login.html');
assert(!loginHtml.includes('id="forgot-sandbox-otp-badge"'), 'FAIL: forgot-sandbox-otp-badge found in login.html');

console.log('   ✅ PASS: login.html contains zero OTP auto-fill badges, buttons, or notices.');

// 2. Verify register.html
console.log('\nTest 2: Inspecting register.html for absence of OTP auto-fill & badges...');
const regHtml = fs.readFileSync(path.resolve(__dirname, '../register.html'), 'utf8');

assert(!regHtml.includes('id="reg-otp-demo-notice"'), 'FAIL: reg-otp-demo-notice found in register.html');
assert(!regHtml.includes('id="reg-otp-code-badge"'), 'FAIL: reg-otp-code-badge found in register.html');
assert(!regHtml.includes('id="auto-fill-reg-otp-btn"'), 'FAIL: auto-fill-reg-otp-btn found in register.html');
assert(!regHtml.includes('id="forgot-otp-sandbox-notice"'), 'FAIL: forgot-otp-sandbox-notice found in register.html');
assert(!regHtml.includes('id="autofill-forgot-otp-btn"'), 'FAIL: autofill-forgot-otp-btn found in register.html');
assert(!regHtml.includes('id="forgot-sandbox-otp-badge"'), 'FAIL: forgot-sandbox-otp-badge found in register.html');

console.log('   ✅ PASS: register.html contains zero OTP auto-fill badges, buttons, or notices.');

// 3. Verify src/main/webapp mirror synchronization
console.log('\nTest 3: Inspecting src/main/webapp mirrors...');
const mirrorLogin = fs.readFileSync(path.resolve(__dirname, '../src/main/webapp/login.html'), 'utf8');
const mirrorReg = fs.readFileSync(path.resolve(__dirname, '../src/main/webapp/register.html'), 'utf8');

assert.strictEqual(loginHtml, mirrorLogin, 'FAIL: src/main/webapp/login.html differs from root login.html');
assert.strictEqual(regHtml, mirrorReg, 'FAIL: src/main/webapp/register.html differs from root register.html');

console.log('   ✅ PASS: src/main/webapp mirrors match root files 100%.');

// 4. Verify Google Identity Services integration in both pages
console.log('\nTest 4: Inspecting GIS integration in login and register...');
assert(loginHtml.includes('https://accounts.google.com/gsi/client'), 'FAIL: GIS client script missing in login.html');
assert(loginHtml.includes('js/google-auth.js'), 'FAIL: google-auth.js missing in login.html');
assert(loginHtml.includes('id="google-signin-btn-container"'), 'FAIL: google-signin-btn-container missing in login.html');
assert(loginHtml.includes('387098615100-026midj2987jt0p75sqjmi5f94a0nib7.apps.googleusercontent.com'), 'FAIL: Configured client_id missing in login.html');

assert(regHtml.includes('https://accounts.google.com/gsi/client'), 'FAIL: GIS client script missing in register.html');
assert(regHtml.includes('js/google-auth.js'), 'FAIL: google-auth.js missing in register.html');
assert(regHtml.includes('id="google-signup-btn-container"'), 'FAIL: google-signup-btn-container missing in register.html');
assert(regHtml.includes('387098615100-026midj2987jt0p75sqjmi5f94a0nib7.apps.googleusercontent.com'), 'FAIL: Configured client_id missing in register.html');

console.log('   ✅ PASS: Official GIS integration intact in both login.html and register.html.');

console.log('\n============================================================');
console.log('🎉 ALL OTP & GIS INTEGRITY TESTS PASSED SUCCESSFULLY!');
console.log('============================================================\n');
