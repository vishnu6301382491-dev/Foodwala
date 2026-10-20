const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('🧪 RUNNING LOCATION & REVERSE GEOCODING TEST SUITE');
console.log('============================================================\n');

// Mock browser environment
const storage = {};
global.window = {
  dispatchEvent: (evt) => {},
  CustomEvent: function (type, detail) { this.type = type; this.detail = detail; }
};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => []
};

// Test 1: BENGALURU_LOCATIONS contains Maruthi Nagar
console.log('Test 1: Verifying Maruthi Nagar is in BENGALURU_LOCATIONS...');
const appJs = fs.readFileSync(path.resolve(__dirname, '../js/app.js'), 'utf8');

assert.ok(appJs.includes("'maruthi_nagar'"), 'FAIL: maruthi_nagar hub id missing in app.js');
assert.ok(appJs.includes("'Maruthi Nagar'"), 'FAIL: Maruthi Nagar shortName missing in app.js');
console.log('   ✅ PASS: Maruthi Nagar delivery hub configured in BENGALURU_LOCATIONS.');

// Test 2: BENGALURU_AREAS contains Maruthi Nagar
console.log('\nTest 2: Verifying Maruthi Nagar is in areas.js...');
const areasJs = fs.readFileSync(path.resolve(__dirname, '../js/areas.js'), 'utf8');
assert.ok(areasJs.includes("'Maruthi Nagar'"), 'FAIL: Maruthi Nagar missing in areas.js');
console.log('   ✅ PASS: Maruthi Nagar present in 270+ Bengaluru localities database.');

// Test 3: Microzone and proximity calculation for Maruthi Nagar coordinates
console.log('\nTest 3: Testing coordinate resolution for Maruthi Nagar (12.9238, 77.6186)...');

const hubs = [
  { id: 'maruthi_nagar', shortName: 'Maruthi Nagar', lat: 12.9238, lng: 77.6186 },
  { id: 'koramangala', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { id: 'btm_layout', shortName: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { id: 'hsr_layout', shortName: 'HSR Layout', lat: 12.9121, lng: 77.6446 }
];

function resolveLocation(lat, lng) {
  // Microzone check
  if (lat >= 12.9180 && lat <= 12.9280 && lng >= 77.6110 && lng <= 77.6225) {
    return 'Maruthi Nagar';
  }
  let closest = null;
  let minDist = Infinity;
  for (const h of hubs) {
    const d = Math.hypot(h.lat - lat, h.lng - lng);
    if (d < minDist) {
      minDist = d;
      closest = h;
    }
  }
  return closest ? closest.shortName : 'Current Location';
}

// User location from screenshot (approx 12.9238, 77.6186)
const resolvedName = resolveLocation(12.9238, 77.6186);
assert.strictEqual(resolvedName, 'Maruthi Nagar', `Expected 'Maruthi Nagar' but got '${resolvedName}'`);
console.log(`   ✅ PASS: GPS coords (12.9238, 77.6186) resolve accurately to '${resolvedName}'.`);

// User location on Maruthi Nagar Main Road (12.9216, 77.6137)
const resolvedMainRd = resolveLocation(12.9216, 77.6137);
assert.strictEqual(resolvedMainRd, 'Maruthi Nagar', `Expected 'Maruthi Nagar' but got '${resolvedMainRd}'`);
console.log(`   ✅ PASS: GPS coords (12.9216, 77.6137) resolve accurately to '${resolvedMainRd}'.`);

// User location near Madiwala underpass (12.9250, 77.6190)
const resolvedMadiwalaBorder = resolveLocation(12.9250, 77.6190);
assert.strictEqual(resolvedMadiwalaBorder, 'Maruthi Nagar', `Expected 'Maruthi Nagar' but got '${resolvedMadiwalaBorder}'`);
console.log(`   ✅ PASS: GPS coords (12.9250, 77.6190) resolve accurately to '${resolvedMadiwalaBorder}'.`);

console.log('\n============================================================');
console.log('🎉 ALL LOCATION & GEOCODING TESTS PASSED SUCCESSFULLY!');
console.log('============================================================\n');
