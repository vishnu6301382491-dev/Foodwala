const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`${BASE_URL}${path}`, { method: 'POST', headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.get(`${BASE_URL}${path}`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
  });
}

function patch(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const patchData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(patchData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`${BASE_URL}${path}`, { method: 'PATCH', headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(patchData);
    req.end();
  });
}

function del(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(`${BASE_URL}${path}`, { method: 'DELETE', headers }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTestSuite() {
  console.log('============================================================');
  console.log('🧪 COMPREHENSIVE TEST SUITE: AUTH, DELIVERY & OMNIPOTENT ADMIN');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  // --- 1. Super Admin Authentication ---
  console.log('--- 1. Testing Super Admin Authentication ---');
  const adminRes = await post('/api/auth/login', {
    email: 'adminfoodwala@gmail.com',
    password: 'Vishnu@143'
  });
  assert(adminRes.status === 200, 'Super Admin login returns HTTP 200');
  assert(adminRes.data.user && adminRes.data.user.role === 'admin', 'Super Admin role is "admin"');
  const adminToken = adminRes.data.token;

  // --- 2. Delivery Partner Authentication ---
  console.log('\n--- 2. Testing Delivery Partner Authentication ---');
  const deliveryRes = await post('/api/auth/login', {
    email: 'deliveryfoodwala@gmail.com',
    password: 'Vishnu@143'
  });
  assert(deliveryRes.status === 200, 'Delivery Partner login returns HTTP 200');
  assert(deliveryRes.data.user && (deliveryRes.data.user.role === 'partner' || deliveryRes.data.user.role === 'delivery_partner'), 'Delivery Partner role is "partner"');
  assert(deliveryRes.data.user && deliveryRes.data.user.partnerId !== undefined, 'Delivery Partner response includes partnerId');
  const deliveryToken = deliveryRes.data.token;

  // --- 3. Restaurant Manager Authentication ---
  console.log('\n--- 3. Testing Restaurant Manager Authentication ---');
  const meghanaRes = await post('/api/auth/login', {
    email: 'meghanafood@gmail.com',
    password: 'Vishnu@143'
  });
  assert(meghanaRes.status === 200, 'Meghana Foods manager login returns HTTP 200');
  assert(meghanaRes.data.user && meghanaRes.data.user.restaurantId === 7, 'Meghana Foods manager bound to restaurant ID 7');
  const managerToken = meghanaRes.data.token;

  // --- 4. Delivery Partner API Endpoints ---
  console.log('\n--- 4. Testing Delivery Partner API Endpoints ---');
  const profileRes = await get('/api/delivery/profile', deliveryToken);
  assert(profileRes.status === 200, 'GET /api/delivery/profile returns HTTP 200');
  assert(profileRes.data.partner && profileRes.data.partner.vehicleNumber === 'KA 05 MN 7890', 'Delivery Partner vehicle verified (KA 05 MN 7890)');
  assert(profileRes.data.partner && profileRes.data.partner.rating >= 4.8, 'Delivery Partner rating verified (>= 4.8)');

  const statusRes = await patch('/api/delivery/status', { isAvailable: true }, deliveryToken);
  assert(statusRes.status === 200 && statusRes.data.isAvailable === true, 'PATCH /api/delivery/status enables Online duty');

  const radarRes = await get('/api/delivery/orders/radar', deliveryToken);
  assert(radarRes.status === 200 && Array.isArray(radarRes.data.orders), 'GET /api/delivery/orders/radar returns active floating orders');

  const earningsRes = await get('/api/delivery/earnings', deliveryToken);
  assert(earningsRes.status === 200 && earningsRes.data.wallet && earningsRes.data.wallet.todayEarnings > 0, 'GET /api/delivery/earnings returns wallet breakdown');

  // Customer should be forbidden from delivery endpoints
  const unauthRes = await get('/api/delivery/profile', managerToken);
  assert(unauthRes.status === 403, 'Restaurant manager is forbidden from delivery endpoints (HTTP 403)');

  // --- 5. Super Admin Omnipotent Manager Access ---
  console.log('\n--- 5. Testing Super Admin Omnipotent Manager Access ---');
  // Admin inspects Meghana Foods (#7)
  const adminMeghana = await get('/api/restaurant/details?restaurantId=7', adminToken);
  assert(adminMeghana.status === 200 && adminMeghana.data.restaurant.restaurant_id === 7, 'Admin can inspect Meghana Foods (ID: 7)');

  // Admin inspects Vidyarthi Bhavan (#2)
  const adminVidyarthi = await get('/api/restaurant/details?restaurantId=2', adminToken);
  assert(adminVidyarthi.status === 200 && adminVidyarthi.data.restaurant.restaurant_id === 2, 'Admin can inspect Vidyarthi Bhavan (ID: 2)');

  // Admin adds a test dish to Meghana Foods
  const addDishRes = await post('/api/restaurant/menu?restaurantId=7', {
    itemName: 'Admin Special Dum Kebab',
    price: 260,
    categoryName: 'Starters',
    isVeg: false,
    description: 'Fresh grilled chicken kebabs marinated in secret spices.'
  }, adminToken);
  assert(addDishRes.status === 201 && addDishRes.data.success, 'Admin can add dishes to Meghana Foods menu');
  const testMenuId = addDishRes.data.item ? addDishRes.data.item.menu_id : null;

  if (testMenuId) {
    // Admin toggles stock availability of that dish
    const toggleRes = await patch(`/api/restaurant/menu/${testMenuId}/availability`, { isAvailable: false }, adminToken);
    assert(toggleRes.status === 200 && toggleRes.data.isAvailable === false, 'Admin can toggle dish stock availability');

    // Admin deletes test dish
    const delRes = await del(`/api/restaurant/menu/${testMenuId}`, adminToken);
    assert(delRes.status === 200 && delRes.data.success, 'Admin can delete dishes from menu');
  }

  // --- 6. Client Files Verification ---
  console.log('\n--- 6. Testing Client Files Integrity ---');
  const fs = require('fs');
  const loginHtml = fs.readFileSync('D:/FoodWala_Eclipse_Project/login.html', 'utf8');
  assert(!loginHtml.includes('// Demo logins permanently disabled\r\n      });'), 'login.html does not contain the dangling });');
  assert(loginHtml.includes('./delivery-dashboard.html'), 'login.html redirects delivery partners to ./delivery-dashboard.html');

  const adminHtml = fs.readFileSync('D:/FoodWala_Eclipse_Project/admin.html', 'utf8');
  assert(adminHtml.includes('Manager Dashboard') && adminHtml.includes('Delivery Hero'), 'admin.html includes quick links to Manager Dashboard and Delivery Hero');

  const deliveryHtml = fs.readFileSync('D:/FoodWala_Eclipse_Project/delivery-dashboard.html', 'utf8');
  assert(deliveryHtml.includes('dutyToggleSwitch') && deliveryHtml.includes('incoming-order-box') && deliveryHtml.includes('sim-bike-marker'), 'delivery-dashboard.html has full Swiggy-style delivery features');

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
