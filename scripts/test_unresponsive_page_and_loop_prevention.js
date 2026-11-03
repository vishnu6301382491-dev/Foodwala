/**
 * Test Suite: Page Unresponsive & Infinite Loop Prevention Verification
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 TESTING PAGE UNRESPONSIVE & EVENT LOOP PREVENTION');
console.log('============================================================\n');

// 1. Verify pure getter behavior in js/app.js
console.log('Test 1: Verifying Orders.getOrderStatus is a pure getter without side-effects...');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const appJsCode = fs.readFileSync(appJsPath, 'utf8');

// Ensure getOrderStatus does NOT call Orders.saveOrder
const getOrderStatusMatch = appJsCode.match(/getOrderStatus:\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\},/);
assert(getOrderStatusMatch, 'getOrderStatus method should be found in js/app.js');
const getOrderStatusBody = getOrderStatusMatch[1];
assert(!getOrderStatusBody.includes('Orders.saveOrder'), 'getOrderStatus MUST NOT call Orders.saveOrder (causes infinite loop)');
assert(!getOrderStatusBody.includes('FoodWalaApi.saveOrder'), 'getOrderStatus MUST NOT call FoodWalaApi.saveOrder');
console.log('   ✅ PASS: getOrderStatus does NOT mutate storage or call saveOrder.');

// 2. Verify admin.html re-entrancy protection and debouncing
console.log('\nTest 2: Verifying admin.html re-entrancy locks and event debouncing...');
const adminPath = path.join(__dirname, '..', 'admin.html');
const adminCode = fs.readFileSync(adminPath, 'utf8');

assert(adminCode.includes('let isLoadingAdminData = false;'), 'admin.html must have isLoadingAdminData re-entrancy lock');
assert(adminCode.includes('function scheduleAdminDataLoad'), 'admin.html must have scheduleAdminDataLoad debounce function');
assert(adminCode.includes('if (isLoadingAdminData) return;'), 'loadAdminData must check isLoadingAdminData guard');
assert(adminCode.includes('isLoadingAdminData = false;'), 'loadAdminData must reset isLoadingAdminData in finally block');
assert(adminCode.includes("scheduleAdminDataLoad(300)"), 'Event listeners in admin.html must debounce with scheduleAdminDataLoad');
assert(!adminCode.includes("window.addEventListener('foodwala:orderPlaced', () => loadAdminData());"), 'foodwala:orderPlaced must not invoke loadAdminData directly');
assert(!adminCode.includes("window.addEventListener('foodwala:orderStatusChanged', () => loadAdminData());"), 'foodwala:orderStatusChanged must not invoke loadAdminData directly');
assert(!adminCode.includes("window.addEventListener('foodwala:order-updated', () => loadAdminData());"), 'foodwala:order-updated must not invoke loadAdminData directly');
console.log('   ✅ PASS: admin.html has re-entrancy guard and debounces all sync listeners.');

// 3. Verify restaurant-dashboard.html re-entrancy protection and debouncing
console.log('\nTest 3: Verifying restaurant-dashboard.html re-entrancy locks and event debouncing...');
const restDashPath = path.join(__dirname, '..', 'restaurant-dashboard.html');
const restDashCode = fs.readFileSync(restDashPath, 'utf8');

assert(restDashCode.includes('let isReloadingKitchenOrders = false;'), 'restaurant-dashboard.html must have isReloadingKitchenOrders re-entrancy lock');
assert(restDashCode.includes('function scheduleKitchenOrdersReload'), 'restaurant-dashboard.html must have scheduleKitchenOrdersReload debounce function');
assert(restDashCode.includes('if (isReloadingKitchenOrders) return;'), 'reloadKitchenOrders must check isReloadingKitchenOrders guard');
assert(restDashCode.includes('isReloadingKitchenOrders = false;'), 'reloadKitchenOrders must reset isReloadingKitchenOrders in finally block');
assert(restDashCode.includes("scheduleKitchenOrdersReload(300)"), 'Event listeners in restaurant-dashboard.html must debounce with scheduleKitchenOrdersReload');
console.log('   ✅ PASS: restaurant-dashboard.html has re-entrancy guard and debounces order reloads.');

// 4. Verify safe window.FoodWalaApp.Orders references
console.log('\nTest 4: Verifying safe window.FoodWalaApp.Orders scope references across files...');
const mockAdapterPath = path.join(__dirname, '..', 'js', 'adapters', 'mockAdapter.js');
const mockAdapterCode = fs.readFileSync(mockAdapterPath, 'utf8');

assert(mockAdapterCode.includes('window.FoodWalaApp && window.FoodWalaApp.Orders'), 'mockAdapter.js must safely qualify window.FoodWalaApp.Orders');
assert(!mockAdapterCode.includes('window.FoodWalaApp && FoodWalaApp.Orders'), 'mockAdapter.js must not have bare FoodWalaApp identifier');
assert(adminCode.includes('window.FoodWalaApp && window.FoodWalaApp.Orders'), 'admin.html must safely qualify window.FoodWalaApp.Orders');
assert(!adminCode.includes('window.FoodWalaApp && FoodWalaApp.Orders'), 'admin.html must not have bare FoodWalaApp identifier');
assert(restDashCode.includes('window.FoodWalaApp && window.FoodWalaApp.Orders'), 'restaurant-dashboard.html must safely qualify window.FoodWalaApp.Orders');
assert(!restDashCode.includes('window.FoodWalaApp && FoodWalaApp.Orders'), 'restaurant-dashboard.html must not have bare FoodWalaApp identifier');
console.log('   ✅ PASS: All files use safe window.FoodWalaApp.Orders access.');

// 5. Verify 100% mirror parity
console.log('\nTest 5: Verifying 100% Mirror Parity with src/main/webapp/...');
const filesToVerify = [
  'admin.html',
  'restaurant-dashboard.html',
  'js/app.js',
  'js/app.min.js',
  'js/adapters/mockAdapter.js'
];
for (const relPath of filesToVerify) {
  const rootFile = path.join(__dirname, '..', relPath);
  const webappFile = path.join(__dirname, '..', 'src', 'main', 'webapp', relPath);
  const rootBuf = fs.readFileSync(rootFile);
  const webappBuf = fs.readFileSync(webappFile);
  assert(rootBuf.equals(webappBuf), `Parity failed for ${relPath}`);
  console.log(`   ✅ PASS: 100% byte-for-byte parity verified: ${relPath}`);
}

console.log('\n============================================================');
console.log('🎉 ALL PAGE UNRESPONSIVE & EVENT LOOP PREVENTION TESTS PASSED!');
console.log('============================================================');
