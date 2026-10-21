const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('============================================================');
console.log('🧪 TESTING RESTAURANT MANAGER ISOLATION & AUTHENTICATION');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Check HTML Elements & Default Visibility
const dashHtml = fs.readFileSync(path.resolve('restaurant-dashboard.html'), 'utf8');
const webappDashHtml = fs.readFileSync(path.resolve('src/main/webapp/restaurant-dashboard.html'), 'utf8');

assert(
  dashHtml.includes('id="restaurant-selector-dropdown"') && dashHtml.includes('display: none !important;'),
  'restaurant-dashboard.html hides restaurant-selector-dropdown by default in HTML'
);

assert(
  dashHtml.includes('id="store-status-toggle-btn"') && dashHtml.includes('id="store-status-toggle-btn" class="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm" style="display: none !important;"'),
  'restaurant-dashboard.html hides store-status-toggle-btn by default in HTML'
);

assert(
  dashHtml.includes('id="preview-store-btn"') && dashHtml.includes('id="preview-store-btn" target="_blank" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold" style="display: none !important;"'),
  'restaurant-dashboard.html hides preview-store-btn by default in HTML'
);

assert(
  dashHtml.includes('// STRICT ISOLATION: NEVER display restaurant switcher or store controls to unauthenticated visitors'),
  'initRestaurantAuth() contains strict unauthenticated isolation guard'
);

assert(
  dashHtml.includes('// STRICT MANAGER ISOLATION: Manager can access ONLY their own restaurant!'),
  'loadRestaurantDashboard() contains strict manager restaurant isolation guard'
);

assert(
  dashHtml === webappDashHtml,
  'restaurant-dashboard.html has 100% parity with src/main/webapp/restaurant-dashboard.html'
);

// 2. Check mockAdapter.js in simulated browser sandbox
const mockCode = fs.readFileSync(path.resolve('js/adapters/mockAdapter.js'), 'utf8');
const webappMockCode = fs.readFileSync(path.resolve('src/main/webapp/js/adapters/mockAdapter.js'), 'utf8');

assert(
  mockCode === webappMockCode,
  'js/adapters/mockAdapter.js has 100% parity with src/main/webapp/js/adapters/mockAdapter.js'
);

assert(
  mockCode.includes('const ALL_RESTAURANT_MANAGERS =') && mockCode.includes('findRestaurantManager'),
  'mockAdapter.js contains ALL_RESTAURANT_MANAGERS registry and findRestaurantManager helper'
);

// Setup mock window & localStorage sandbox
const storage = {};
const sandbox = {
  window: {},
  localStorage: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  },
  CustomEvent: function (event, params) { this.event = event; this.detail = params ? params.detail : null; },
  Date: Date,
  Math: Math,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  String: String,
  Array: Array,
  console: console
};
sandbox.window.dispatchEvent = () => {};
sandbox.window.location = { hostname: 'localhost', pathname: '/restaurant-dashboard.html', search: '' };

vm.createContext(sandbox);

// Execute mockAdapter script in sandbox
try {
  vm.runInContext(mockCode, sandbox);
  const mockAdapter = sandbox.window.FoodWalaAdapters && sandbox.window.FoodWalaAdapters.mock;

  assert(mockAdapter && typeof mockAdapter.login === 'function', 'FoodWalaAdapters.mock initialized successfully in sandbox');

  (async () => {
    // Test A: Kabab Magic Basavanagudi Manager Login
    const kababRes = await mockAdapter.login('kababmagicbasavanagudi@gmail.com', 'Vishnu@143');
    assert(kababRes.success === true, 'Kabab Magic manager login succeeds with Vishnu@143');
    assert(kababRes.user && kababRes.user.role === 'restaurant', 'Kabab Magic manager role is "restaurant"');
    assert(kababRes.user && (kababRes.user.restaurantId === 98 || kababRes.user.restaurant_id === 98), 'Kabab Magic manager bound to restaurantId 98');
    assert(kababRes.user && kababRes.user.restaurantName.includes('Kabab Magic'), 'Kabab Magic manager has correct restaurantName');

    // Test B: Meghana Foods Manager Login
    const meghanaRes = await mockAdapter.login('meghanafood@gmail.com', 'Vishnu@143');
    assert(meghanaRes.success === true, 'Meghana Foods manager login succeeds with Vishnu@143');
    assert(meghanaRes.user && (meghanaRes.user.restaurantId === 7 || meghanaRes.user.restaurant_id === 7), 'Meghana Foods manager bound to restaurantId 7');

    // Test C: CTR Malleshwaram Manager Login
    const ctrRes = await mockAdapter.login('centraltiffinroomshrisagar@gmail.com', 'Vishnu@143');
    assert(ctrRes.success === true, 'CTR Shri Sagar manager login succeeds with Vishnu@143');
    assert(ctrRes.user && (ctrRes.user.restaurantId === 1 || ctrRes.user.restaurant_id === 1), 'CTR Shri Sagar manager bound to restaurantId 1');

    // Test D: Super Admin Login
    const adminRes = await mockAdapter.login('adminfoodwala@gmail.com', 'Vishnu@143');
    assert(adminRes.success === true, 'Super Admin login succeeds with Vishnu@143');
    assert(adminRes.user && adminRes.user.role === 'admin', 'Super Admin role is "admin"');

    // Test E: Delivery Partner Login
    const deliveryRes = await mockAdapter.login('deliveryfoodwala@gmail.com', 'Vishnu@143');
    assert(deliveryRes.success === true, 'Delivery Partner login succeeds with Vishnu@143');
    assert(deliveryRes.user && deliveryRes.user.role === 'partner', 'Delivery Partner role is "partner"');

    // Test F: Invalid password rejected
    const badPassRes = await mockAdapter.login('kababmagicbasavanagudi@gmail.com', 'WrongPass@999');
    assert(badPassRes.success === false, 'Invalid password is fundamentally rejected');

    console.log('\n============================================================');
    console.log(`SUMMARY: ${passed}/${passed + failed} TESTS PASSED (${((passed / (passed + failed)) * 100).toFixed(1)}%)`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  })();
} catch (e) {
  console.error('Sandbox execution error:', e);
  process.exit(1);
}
