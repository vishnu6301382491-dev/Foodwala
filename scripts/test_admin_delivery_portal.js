const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 TESTING ADMIN DELIVERY PARTNER PORTAL & RESTAURANTS TAB');
console.log('============================================================\n');

let passed = 0;
let total = 0;

function check(desc, fn) {
  total++;
  try {
    fn();
    console.log(`   ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`   ❌ FAIL: ${desc}`);
    console.error('      ', err.message);
  }
}

async function run() {
  const root = 'D:\\FoodWala_Eclipse_Project';

  // Mock DOM / Browser environment for API test
  global.window = global;
  global.localStorage = {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  };

  require(path.join(root, 'js', 'config.js'));
  require(path.join(root, 'js', 'adapters', 'mockAdapter.js'));
  require(path.join(root, 'js', 'adapters', 'liveAdapter.js'));
  require(path.join(root, 'js', 'api.js'));

  // Test 1: getAdminDeliveryPartners API
  console.log('Test 1: Verifying FoodWalaApi.getAdminDeliveryPartners()...');
  const partnersRes = await FoodWalaApi.getAdminDeliveryPartners();
  check('getAdminDeliveryPartners returns success and fleet array', () => {
    assert.strictEqual(partnersRes.success, true);
    assert(Array.isArray(partnersRes.partners));
    assert(partnersRes.partners.length >= 6);
  });

  check('Each partner contains required fleet fields (vehicle, zone, status, rating)', () => {
    const p1 = partnersRes.partners[0];
    assert(p1.partnerId || p1.id);
    assert(p1.name);
    assert(p1.phone);
    assert(p1.vehicleType);
    assert(p1.vehicleNumber);
    assert(p1.deliveryZone);
    assert(p1.dutyStatus);
    assert(typeof p1.rating === 'number');
    assert(typeof p1.walletBalance === 'number');
  });

  // Test 2: updateDeliveryPartnerStatus API
  console.log('\nTest 2: Verifying FoodWalaApi.updateDeliveryPartnerStatus()...');
  const toggleRes = await FoodWalaApi.updateDeliveryPartnerStatus(101, 'OFFLINE');
  check('updateDeliveryPartnerStatus successfully changes duty status to OFFLINE', () => {
    assert.strictEqual(toggleRes.success, true);
    assert.strictEqual(toggleRes.partner.dutyStatus, 'OFFLINE');
    assert.strictEqual(toggleRes.partner.isAvailable, 0);
  });

  const toggleOnlineRes = await FoodWalaApi.updateDeliveryPartnerStatus(101, 'ONLINE');
  check('updateDeliveryPartnerStatus restores duty status to ONLINE', () => {
    assert.strictEqual(toggleOnlineRes.success, true);
    assert.strictEqual(toggleOnlineRes.partner.dutyStatus, 'ONLINE');
    assert.strictEqual(toggleOnlineRes.partner.isAvailable, 1);
  });

  // Test 3: admin.html structure validation
  console.log('\nTest 3: Verifying admin.html UI and Portal Components...');
  const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');

  check('admin.html navbar contains Delivery Partner Portal and Customer Access Portal links', () => {
    assert(adminHtml.includes('Delivery Partner Portal') || adminHtml.includes('Delivery Hero Portal'));
    assert(adminHtml.includes('Customer Access Portal'));
    assert(adminHtml.includes('delivery-dashboard.html'));
    assert(adminHtml.includes('./index.html'));
  });

  check('admin.html contains Delivery Fleet KPI card (#kpi-fleet-count)', () => {
    assert(adminHtml.includes('id="kpi-fleet-count"'));
    assert(adminHtml.includes('id="kpi-fleet-sub"'));
    assert(adminHtml.includes('Delivery Fleet'));
  });

  check('admin.html navigation tabs contain #partners-tab and #tab-partners-badge', () => {
    assert(adminHtml.includes('id="partners-tab"'));
    assert(adminHtml.includes('id="tab-partners-badge"'));
    assert(adminHtml.includes('data-bs-target="#tab-partners"'));
  });

  check('admin.html navigation tabs contain #restaurants-tab and #tab-restaurants-badge', () => {
    assert(adminHtml.includes('id="restaurants-tab"'));
    assert(adminHtml.includes('id="tab-restaurants-badge"'));
    assert(adminHtml.includes('data-bs-target="#tab-restaurants"'));
  });

  check('admin.html contains tab pane #tab-partners with fleet table and filters', () => {
    assert(adminHtml.includes('id="tab-partners"'));
    assert(adminHtml.includes('id="partners-table"'));
    assert(adminHtml.includes('id="partners-table-body"'));
    assert(adminHtml.includes('id="partner-search-input"'));
    assert(adminHtml.includes('id="partner-status-filter"'));
    assert(adminHtml.includes('id="partner-zone-filter"'));
    assert(adminHtml.includes('id="fleet-online-count"'));
    assert(adminHtml.includes('id="fleet-active-orders"'));
  });

  check('admin.html contains tab pane #tab-restaurants with directory table and search', () => {
    assert(adminHtml.includes('id="tab-restaurants"'));
    assert(adminHtml.includes('id="restaurants-table"'));
    assert(adminHtml.includes('id="restaurants-table-body"'));
    assert(adminHtml.includes('id="restaurant-search-input"'));
  });

  check('admin.html renderUsersTable formats DELIVERY HERO role badge', () => {
    assert(adminHtml.includes('DELIVERY HERO'));
    assert(adminHtml.includes('RESTAURANT'));
  });

  check('admin.html includes launchDeliveryPartnerConsole and togglePartnerStatus functions', () => {
    assert(adminHtml.includes('function launchDeliveryPartnerConsole'));
    assert(adminHtml.includes('function togglePartnerStatus'));
    assert(adminHtml.includes('function renderDeliveryPartnersTable'));
    assert(adminHtml.includes('function renderRestaurantsTable'));
  });

  // Test 4: Mirror parity check
  console.log('\nTest 4: Verifying 100% Mirror Parity with src/main/webapp/...');
  const filesToCheck = [
    'admin.html',
    path.join('js', 'api.js'),
    path.join('js', 'adapters', 'mockAdapter.js'),
    path.join('js', 'adapters', 'liveAdapter.js')
  ];

  filesToCheck.forEach(rel => {
    const rootFile = fs.readFileSync(path.join(root, rel));
    const webappFile = fs.readFileSync(path.join(root, 'src', 'main', 'webapp', rel));
    check(`Parity: ${rel} matches src/main/webapp/${rel}`, () => {
      assert(rootFile.equals(webappFile), `Byte mismatch in ${rel}`);
    });
  });

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passed}/${total} ADMIN DELIVERY PORTAL TESTS PASSED!`);
  console.log('============================================================');
  if (passed !== total) process.exit(1);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
