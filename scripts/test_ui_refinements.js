const fs = require('fs');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 TESTING UI REFINEMENTS & COMPLIANCE');
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

// 1. Index Navbar Delivery Hero check
const indexContent = fs.readFileSync('index.html', 'utf8');
const navbarMatch = indexContent.match(/<nav[\s\S]*?<\/nav>/i);
test('index.html navbar does NOT contain Delivery Hero button', () => {
  assert.ok(navbarMatch, 'Navbar not found');
  assert.strictEqual(navbarMatch[0].includes('Delivery Hero'), false, 'Delivery Hero found in navbar');
});

// 2. Login Portal Switcher check
const loginContent = fs.readFileSync('login.html', 'utf8');
const switcherMatch = loginContent.match(/<!-- Multi-Portal Quick Switcher -->[\s\S]*?<\/div>/i);
test('login.html portal switcher exists', () => {
  assert.ok(switcherMatch, 'Portal switcher container not found');
});

test('login.html portal switcher does NOT show Admin tab', () => {
  assert.strictEqual(switcherMatch[0].includes('portal=admin'), false, 'Admin tab found in switcher');
});

test('login.html portal switcher does NOT show Manager tab', () => {
  assert.strictEqual(switcherMatch[0].includes('portal=restaurant'), false, 'Manager tab found in switcher');
});

test('login.html portal switcher only contains Customer and Delivery Hero', () => {
  assert.strictEqual(switcherMatch[0].includes('portal=partner'), true, 'Delivery Hero tab missing in switcher');
  assert.strictEqual(switcherMatch[0].includes('Customer'), true, 'Customer tab missing in switcher');
});

test('login.html handlePostLoginNavigation directly routes delivery partner to ./delivery-dashboard.html', () => {
  assert.strictEqual(loginContent.includes('window.location.href = "./delivery-dashboard.html";'), true);
});

// 3. Delivery Dashboard Custom Celebration Modal check
const deliveryContent = fs.readFileSync('delivery-dashboard.html', 'utf8');
test('delivery-dashboard.html contains styled #deliveryCelebrationModal', () => {
  assert.strictEqual(deliveryContent.includes('id="deliveryCelebrationModal"'), true);
  assert.strictEqual(deliveryContent.includes('function showCelebrationModal'), true);
});

test('delivery-dashboard.html OTP completion does NOT use native alert()', () => {
  assert.strictEqual(deliveryContent.includes("alert('🎉 Delivery Complete!"), false);
  assert.strictEqual(deliveryContent.includes('showCelebrationModal({'), true);
});

// 4. Restaurant Dashboard 105 stores dropdown check
const restDashContent = fs.readFileSync('restaurant-dashboard.html', 'utf8');
test('restaurant-dashboard.html populateAdminRestaurantDropdown handles arrays and 105 stores', () => {
  assert.strictEqual(restDashContent.includes('Array.isArray(res)'), true);
  assert.strictEqual(restDashContent.includes('data/restaurants.json'), true);
});

console.log(`\n============================================================`);
console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
console.log(`============================================================\n`);

process.exit(passed === total ? 0 : 1);
