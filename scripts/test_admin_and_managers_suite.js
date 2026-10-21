/**
 * scripts/test_admin_and_managers_suite.js
 * 
 * Comprehensive Verification Suite for FoodWala Admin & Restaurant Portals:
 * 1. Admin Login (adminfoodwala@gmail.com / Vishnu@143)
 * 2. Restaurant Manager Logins (<restaurant>@gmail.com / Vishnu@143)
 * 3. Tenant Isolation (Managers restricted to their own store)
 * 4. Admin Super-Access (Admin can access all 105 stores and admin endpoints)
 * 5. UI Hygiene (Demo logins permanently removed)
 */

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

function apiRequest({ method = 'GET', path: reqPath, token = null, body = null }) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const headers = {};
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: reqPath,
      method: method,
      headers: headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, data: json, text: data });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSuite() {
  console.log('============================================================');
  console.log('🧪 TESTING ADMIN PORTAL & RESTAURANT MANAGER ISOLATION');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  // --- 1. SUPER ADMIN AUTHENTICATION ---
  console.log('--- 1. Testing Super Admin Authentication ---');
  const adminLoginRes = await apiRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { identifier: 'adminfoodwala@gmail.com', password: 'Vishnu@143' }
  });

  test('Super Admin login returns HTTP 200', () => {
    assert.strictEqual(adminLoginRes.status, 200);
    assert.strictEqual(adminLoginRes.data.success, true);
  });

  test('Super Admin has role "admin"', () => {
    assert.strictEqual(adminLoginRes.data.user.role, 'admin');
    assert.strictEqual(adminLoginRes.data.user.email, 'adminfoodwala@gmail.com');
  });

  const adminToken = adminLoginRes.data.token;

  const adminWrongPassRes = await apiRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { identifier: 'adminfoodwala@gmail.com', password: 'WrongPassword' }
  });

  test('Super Admin login with invalid password rejects with HTTP 401', () => {
    assert.strictEqual(adminWrongPassRes.status, 401);
    assert.strictEqual(adminWrongPassRes.data.success, false);
  });

  // --- 2. RESTAURANT MANAGERS AUTHENTICATION ---
  console.log('\n--- 2. Testing Restaurant Manager Logins ---');
  
  // Test Meghana Foods
  const meghanaLoginRes = await apiRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { identifier: 'meghanafood@gmail.com', password: 'Vishnu@143' }
  });

  test('Meghana Foods manager login returns HTTP 200', () => {
    assert.strictEqual(meghanaLoginRes.status, 200);
    assert.strictEqual(meghanaLoginRes.data.success, true);
  });

  test('Meghana Foods manager payload includes role "restaurant" and restaurantId 7', () => {
    assert.strictEqual(meghanaLoginRes.data.user.role, 'restaurant');
    assert.strictEqual(meghanaLoginRes.data.user.restaurantId, 7);
    assert.strictEqual(meghanaLoginRes.data.user.restaurantName, 'Meghana Foods');
  });

  const meghanaToken = meghanaLoginRes.data.token;

  // Test Vidyarthi Bhavan
  const vbLoginRes = await apiRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { identifier: 'vidyarthibhavan@gmail.com', password: 'Vishnu@143' }
  });

  test('Vidyarthi Bhavan manager login returns HTTP 200 with restaurantId 2', () => {
    assert.strictEqual(vbLoginRes.status, 200);
    assert.strictEqual(vbLoginRes.data.user.restaurantId, 2);
  });

  // --- 3. MULTI-TENANT ISOLATION ---
  console.log('\n--- 3. Testing Multi-Tenant Manager Isolation ---');
  
  // Meghana Foods manager fetching their own details
  const meghanaDetails = await apiRequest({
    method: 'GET',
    path: '/api/restaurant/details',
    token: meghanaToken
  });

  test('Meghana manager receives Meghana Foods details (ID: 7)', () => {
    assert.strictEqual(meghanaDetails.status, 200);
    assert.strictEqual(meghanaDetails.data.restaurant.restaurant_id, 7);
  });

  // Meghana Foods manager attempting to query Vidyarthi Bhavan (ID: 2) via parameter tampering
  const meghanaTamperDetails = await apiRequest({
    method: 'GET',
    path: '/api/restaurant/details?restaurantId=2',
    token: meghanaToken
  });

  test('Meghana manager parameter tampering is thwarted: strictly bound to Meghana Foods (ID: 7)', () => {
    assert.strictEqual(meghanaTamperDetails.status, 200);
    assert.strictEqual(meghanaTamperDetails.data.restaurant.restaurant_id, 7);
  });

  // Manager attempting to access admin endpoints
  const managerAdminAccess = await apiRequest({
    method: 'GET',
    path: '/api/admin/restaurants',
    token: meghanaToken
  });

  test('Restaurant manager is forbidden from accessing Admin endpoints (HTTP 403)', () => {
    assert.strictEqual(managerAdminAccess.status, 403);
  });

  // --- 4. SUPER ADMIN MULTI-STORE ACCESS ---
  console.log('\n--- 4. Testing Super Admin Multi-Store Access ---');
  
  const adminStoresRes = await apiRequest({
    method: 'GET',
    path: '/api/admin/restaurants',
    token: adminToken
  });

  test('Super Admin can access all 105 restaurants list', () => {
    assert.strictEqual(adminStoresRes.status, 200);
    assert.strictEqual(adminStoresRes.data.success, true);
    assert.strictEqual(adminStoresRes.data.total, 105);
  });

  // Super Admin inspecting specific restaurant (ID: 7 - Meghana Foods)
  const adminMeghanaInspect = await apiRequest({
    method: 'GET',
    path: '/api/restaurant/details?restaurantId=7',
    token: adminToken
  });

  test('Super Admin can inspect Meghana Foods (ID: 7)', () => {
    assert.strictEqual(adminMeghanaInspect.status, 200);
    assert.strictEqual(adminMeghanaInspect.data.restaurant.restaurant_id, 7);
  });

  // Super Admin inspecting specific restaurant (ID: 2 - Vidyarthi Bhavan)
  const adminVbInspect = await apiRequest({
    method: 'GET',
    path: '/api/restaurant/details?restaurantId=2',
    token: adminToken
  });

  test('Super Admin can inspect Vidyarthi Bhavan (ID: 2)', () => {
    assert.strictEqual(adminVbInspect.status, 200);
    assert.strictEqual(adminVbInspect.data.restaurant.restaurant_id, 2);
  });

  // --- 5. UI CODE INTEGRITY & DEMO LOGINS REMOVAL ---
  console.log('\n--- 5. Testing UI Files & Demo Login Removal ---');

  const root = path.join(__dirname, '..');
  const loginHtml = fs.readFileSync(path.join(root, 'login.html'), 'utf8');
  const restDashHtml = fs.readFileSync(path.join(root, 'restaurant-dashboard.html'), 'utf8');
  const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

  test('login.html does not contain demo logins container', () => {
    assert.strictEqual(loginHtml.includes('id="demo-logins-container"'), false);
    assert.strictEqual(loginHtml.includes('Optional 1-Click Demo Logins'), false);
  });

  test('login.html has adminfoodwala@gmail.com placeholder for admin portal', () => {
    assert.strictEqual(loginHtml.includes("emailInput.placeholder = 'adminfoodwala@gmail.com'"), true);
  });

  test('restaurant-dashboard.html isolates managers and hides restaurant switcher', () => {
    assert.strictEqual(restDashHtml.includes("restSelector.style.setProperty('display', 'none', 'important')"), true);
    assert.strictEqual(restDashHtml.includes('placeholder="meghanafood@gmail.com"'), true);
  });

  test('admin.html has Restaurants tab and adminfoodwala@gmail.com placeholder', () => {
    assert.strictEqual(adminHtml.includes('id="restaurants-tab"'), true);
    assert.strictEqual(adminHtml.includes('placeholder="adminfoodwala@gmail.com"'), true);
  });

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('============================================================\n');

  if (passed !== total) process.exit(1);
  process.exit(0);
}

runSuite().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
