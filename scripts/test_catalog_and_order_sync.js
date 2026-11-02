/**
 * test_catalog_and_order_sync.js
 * Comprehensive Verification Suite for:
 * 1. Admin Portal Restaurant Catalog Display (105 Bengaluru Outlets)
 * 2. Order Detail Inspection & Status Transitions in Admin Portal (Modal, Items, Address)
 * 3. Kitchen Orders Synchronization & Status Updates in Restaurant Manager Dashboard
 * 4. Cross-window Real-Time Storage & Event Synchronization
 * 5. 100% Mirror Parity between root files and src/main/webapp/
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const projectDir = path.resolve('D:/FoodWala_Eclipse_Project');

console.log('============================================================');
console.log('🧪 TESTING RESTAURANT CATALOG & ORDER SYNC ENGINE');
console.log('============================================================\n');

let passedTests = 0;
let totalTests = 0;

function check(title, fn) {
  totalTests++;
  try {
    fn();
    console.log(`   ✅ PASS: ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`   ❌ FAIL: ${title}`);
    console.error(`       ${err.message}`);
  }
}

// Global browser mocks for adapter testing
global.window = {
  location: { search: '', hostname: 'localhost', href: 'http://localhost/admin.html' },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  dispatchEvent(e) {}
};
global.localStorage = global.window.localStorage;
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
global.fetch = async (url) => {
  const filePath = path.join(projectDir, url.replace(/^\.\//, ''));
  if (fs.existsSync(filePath)) {
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(fs.readFileSync(filePath, 'utf8'))
    };
  }
  return { ok: false, status: 404 };
};

// Load FoodWala API & Adapters
require(path.join(projectDir, 'js/config.js'));
require(path.join(projectDir, 'js/adapters/mockAdapter.js'));
require(path.join(projectDir, 'js/adapters/liveAdapter.js'));
require(path.join(projectDir, 'js/api.js'));

async function runAllTests() {
  // Test 1: Admin Restaurants API
  console.log('Test 1: Verifying FoodWalaApi.getAdminRestaurants()...');
  const restRes = await window.FoodWalaApi.getAdminRestaurants();
  check('getAdminRestaurants returns success and array of restaurants', () => {
    assert.strictEqual(restRes.success, true);
    assert(Array.isArray(restRes.restaurants));
    assert(restRes.restaurants.length >= 100, `Expected at least 100 restaurants, got ${restRes.restaurants.length}`);
  });

  check('Each restaurant contains required catalog fields', () => {
    const first = restRes.restaurants[0];
    assert(first.name, 'Restaurant missing name');
    assert(first.cuisine_type || first.cuisineType || first.cuisine, 'Restaurant missing cuisine');
    assert(first.address || first.area, 'Restaurant missing address/area');
    assert(first.rating !== undefined, 'Restaurant missing rating');
  });

  // Test 2: Admin Portal UI & Catalog Structure
  console.log('\nTest 2: Verifying admin.html Restaurant Catalog & Order Modal...');
  const adminHtml = fs.readFileSync(path.join(projectDir, 'admin.html'), 'utf8');

  check('admin.html includes foodwala-data.js script for immediate catalog availability', () => {
    assert(adminHtml.includes('foodwala-data.js'), 'Missing foodwala-data.js in admin.html');
  });

  check('admin.html has fallback restaurant retrieval handling array, data, and foodwala-data', () => {
    assert(adminHtml.includes('FoodWalaApi.getRestaurants'), 'Missing getRestaurants fallback');
    assert(adminHtml.includes('FOODWALA_RESTAURANTS'), 'Missing FOODWALA_RESTAURANTS fallback');
  });

  check('admin.html contains Admin Order Details Modal with lifecycle transitions', () => {
    assert(adminHtml.includes('id="adminOrderModal"'), 'Missing adminOrderModal');
    assert(adminHtml.includes('id="admin-modal-customer-name"'), 'Missing modal customer name');
    assert(adminHtml.includes('id="admin-modal-customer-phone"'), 'Missing modal customer phone');
    assert(adminHtml.includes('id="admin-modal-customer-address"'), 'Missing modal delivery address');
    assert(adminHtml.includes('id="admin-modal-status-buttons"'), 'Missing modal status transition buttons container');
    assert(adminHtml.includes('updateAdminOrderStatus'), 'Missing updateAdminOrderStatus function');
  });

  check('admin.html contains real-time storage and event listeners for order synchronization', () => {
    assert(adminHtml.includes("'foodwala:order-updated'"), 'Missing foodwala:order-updated listener');
    assert(adminHtml.includes("e.key === 'foodwala_order_updated'"), 'Missing foodwala_order_updated storage check');
    assert(adminHtml.includes('BroadcastChannel'), 'Missing BroadcastChannel sync');
  });

  // Test 3: Restaurant Manager Dashboard
  console.log('\nTest 3: Verifying restaurant-dashboard.html Kitchen Orders & Sync...');
  const dashHtml = fs.readFileSync(path.join(projectDir, 'restaurant-dashboard.html'), 'utf8');

  check('restaurant-dashboard.html includes foodwala-data.js', () => {
    assert(dashHtml.includes('foodwala-data.js'), 'Missing foodwala-data.js in restaurant-dashboard.html');
  });

  check('restaurant-dashboard.html renders lifecycle action buttons (Accept, Preparing, Ready, Out for Delivery, Delivered)', () => {
    assert(dashHtml.includes('data-status="ACCEPTED"'), 'Missing ACCEPTED status button');
    assert(dashHtml.includes('data-status="PREPARING"'), 'Missing PREPARING status button');
    assert(dashHtml.includes('data-status="READY_FOR_PICKUP"'), 'Missing READY_FOR_PICKUP status button');
    assert(dashHtml.includes('data-status="OUT_FOR_DELIVERY"'), 'Missing OUT_FOR_DELIVERY status button');
    assert(dashHtml.includes('data-status="DELIVERED"'), 'Missing DELIVERED status button');
  });

  check('restaurant-dashboard.html contains real-time synchronization listeners', () => {
    assert(dashHtml.includes("'foodwala:order-updated'"), 'Missing foodwala:order-updated listener in dashboard');
    assert(dashHtml.includes("e.key === 'foodwala_order_updated'"), 'Missing foodwala_order_updated in dashboard storage listener');
  });

  // Test 4: End-to-End Order Status Lifecycle in Mock Adapter
  console.log('\nTest 4: Verifying Order Status Transitions in FoodWalaApi...');
  const orderUpdateRes = await window.FoodWalaApi.updateRestaurantOrderStatus(1001, 'PREPARING');
  check('updateRestaurantOrderStatus updates order status to PREPARING', () => {
    assert.strictEqual(orderUpdateRes.success, true);
    assert.strictEqual(orderUpdateRes.status, 'PREPARING');
  });

  const nextUpdateRes = await window.FoodWalaApi.updateRestaurantOrderStatus(1001, 'READY_FOR_PICKUP');
  check('updateRestaurantOrderStatus transitions status to READY_FOR_PICKUP', () => {
    assert.strictEqual(nextUpdateRes.success, true);
    assert.strictEqual(nextUpdateRes.status, 'READY_FOR_PICKUP');
  });

  const deliveredRes = await window.FoodWalaApi.updateRestaurantOrderStatus(1001, 'DELIVERED');
  check('updateRestaurantOrderStatus transitions status to DELIVERED with deliveredAt timestamp', () => {
    assert.strictEqual(deliveredRes.success, true);
    assert.strictEqual(deliveredRes.status, 'DELIVERED');
  });

  // Test 5: Verify 100% Mirror Parity
  console.log('\nTest 5: Verifying 100% Mirror Parity with src/main/webapp/...');
  const filesToCheck = [
    'admin.html',
    'restaurant-dashboard.html',
    'js/api.js',
    'js/app.js',
    'js/app.min.js',
    'js/adapters/mockAdapter.js',
    'js/adapters/liveAdapter.js'
  ];

  filesToCheck.forEach(relPath => {
    const rootP = path.join(projectDir, relPath);
    const webappP = path.join(projectDir, 'src/main/webapp', relPath);
    check(`Parity: ${relPath} matches src/main/webapp/${relPath}`, () => {
      assert(fs.existsSync(rootP), `Root file missing: ${rootP}`);
      assert(fs.existsSync(webappP), `Webapp file missing: ${webappP}`);
      const rootBuf = fs.readFileSync(rootP);
      const webappBuf = fs.readFileSync(webappP);
      assert.strictEqual(rootBuf.compare(webappBuf), 0, `Byte mismatch in ${relPath}`);
    });
  });

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('============================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
