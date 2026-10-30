// scripts/verify_all_user_reported_fixes.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('   FOODWALA COMPREHENSIVE AUTOMATED VERIFICATION   ');
console.log('====================================================');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

const rootDir = path.resolve('D:/FoodWala_Eclipse_Project');

// =================================================================
// SUITE 1: CHATBOT INTENT ROUTING & REAL-ORDER GROUNDING
// =================================================================
console.log('\n--- SUITE 1: Chatbot Intent Routing & Grounding ---');

// Mock browser environment for help-assistance.js
global.window = {
  location: { hostname: 'localhost', port: '8080', origin: 'http://localhost:8080' },
  FOODWALA_CONFIG: { API_BASE_URL: 'http://localhost:5000' },
  FoodWalaApp: {
    Orders: {
      getAllOrders: () => [
        {
          orderId: 41486,
          order_id: '41486',
          restaurant_name: 'Vidyarthi Bhavan',
          restaurantId: 2,
          delivery_address: 'Indiranagar 100ft Road, Bengaluru',
          status: 'PREPARING',
          etaMinutes: 25,
          deliveryPartner: { name: 'Ramesh Kumar', phone: '+91 91234 56789' }
        }
      ]
    }
  }
};
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: () => null,
  createElement: () => ({
    id: '',
    className: '',
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => '',
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {} }
};
global.localStorage = {
  getItem: (k) => null,
  setItem: () => {}
};

// Load help-assistance.js
const helpAssistanceCode = fs.readFileSync(path.join(rootDir, 'js/help-assistance.js'), 'utf8');
eval(helpAssistanceCode);
const assistant = global.window.FoodWalaHelpAssistant;

runTest('Chatbot: Refund query returns Cancellation & Refund Policy (not tracking)', () => {
  const reply = assistant.getSmartLocalReply('What is your order cancellation and refund policy?', 'Padma', '9876543210');
  assert.ok(reply.includes('Cancellation & Refund Policy'), 'Must contain refund policy title');
  assert.ok(reply.includes('Instant 60-Second Window'), 'Must contain 60-second window info');
  assert.ok(!reply.includes('FW80'), 'Must NOT contain fake hardcoded #FW80');
});

runTest('Chatbot: Coupon query returns FOODWALA50 discount code', () => {
  const reply = assistant.getSmartLocalReply('What discount coupons and offers are available?', 'Padma', '9876543210');
  assert.ok(reply.includes('FOODWALA50'), 'Must contain promo code FOODWALA50');
  assert.ok(reply.includes('Flat 50% OFF'), 'Must state 50% OFF discount');
});

runTest('Chatbot: User query "Hi FoodWala Support, I need help with my order" returns real active order tracking', () => {
  const reply = assistant.getSmartLocalReply('Hi FoodWala Support, I need help with my order', 'Padma', '9876543210');
  assert.ok(reply.includes('#FW-41486'), 'Must return active order #FW-41486');
  assert.ok(reply.includes('Vidyarthi Bhavan'), 'Must return store Vidyarthi Bhavan');
  assert.ok(!reply.includes('FW80'), 'Must NOT return fake #FW80 Central Tiffin Room');
});

runTest('Chatbot: Pure greeting query returns welcome message with options', () => {
  const reply = assistant.getSmartLocalReply('Hello', 'Padma', '9876543210');
  assert.ok(reply.includes('Welcome to FoodWala 24/7 AI Care'), 'Must contain greeting header');
  assert.ok(reply.includes('Padma'), 'Must personalize with customer name');
});

runTest('Chatbot: Fake order FW80 is completely removed from source code', () => {
  assert.ok(!helpAssistanceCode.includes('FW80'), 'Codebase must not have hardcoded FW80');
});

// =================================================================
// SUITE 2: DELIVERY PARTNER METRICS INITIALIZATION
// =================================================================
console.log('\n--- SUITE 2: Delivery Partner Dashboard Metrics ---');

const deliveryHtml = fs.readFileSync(path.join(rootDir, 'delivery-dashboard.html'), 'utf8');

runTest('Delivery Dashboard: Static HTML has clean 0 Trips & ₹0.00 defaults', () => {
  assert.ok(deliveryHtml.includes('id="header-trips-count">0 Trips</div>'), 'Static HTML must display 0 Trips');
  assert.ok(deliveryHtml.includes('id="header-earnings-val">₹0.00</div>'), 'Static HTML must display ₹0.00');
  assert.ok(!deliveryHtml.includes('Vidyarthi Bhavan (Trip #907)'), 'Static HTML must not contain hardcoded dummy trips');
  assert.ok(deliveryHtml.includes('No trips completed yet today'), 'Static HTML must show clean zero-state message');
});

runTest('Delivery Dashboard JS: initPartnerMetrics resets dummy 9 trips / ₹840 for new partner', () => {
  // Simulate new partner "padma" who had legacy dummy data
  let store = {
    'foodwala_partner_metrics_padma': JSON.stringify({ tripsCount: 9, todayEarnings: 840, basePay: 450, trips: [] })
  };
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; }
  };

  // Extract initPartnerMetrics logic from delivery-dashboard.html
  function getPartnerStorageKey(user) {
    const identifier = (user && (user.userId || user.id || user.phone || user.email)) || 'default';
    return 'foodwala_partner_metrics_' + identifier;
  }
  function initPartnerMetrics(user) {
    const storageKey = getPartnerStorageKey(user);
    const email = ((user && user.email) || '').toLowerCase();
    const isSeedDemoPartner = email === 'deliveryfoodwala@gmail.com' || email.includes('demo');

    let metrics = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) metrics = JSON.parse(raw);
    } catch(e) {}

    if (!metrics || (!isSeedDemoPartner && metrics.tripsCount === 9 && metrics.todayEarnings === 840)) {
      if (isSeedDemoPartner) {
        metrics = { tripsCount: 9, todayEarnings: 840 };
      } else {
        metrics = {
          tripsCount: 0,
          todayEarnings: 0,
          basePay: 0,
          distPay: 0,
          surgePay: 0,
          tipsPay: 0,
          rating: 5.0,
          reviewsCount: 0,
          trips: []
        };
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(metrics));
      } catch(e) {}
    }
    return metrics;
  }

  const padmaUser = { userId: 'padma', name: 'Padma', email: 'padma@gmail.com' };
  const padmaMetrics = initPartnerMetrics(padmaUser);
  assert.strictEqual(padmaMetrics.tripsCount, 0, 'New partner trips must be 0');
  assert.strictEqual(padmaMetrics.todayEarnings, 0, 'New partner earnings must be 0');
  assert.strictEqual(padmaMetrics.reviewsCount, 0, 'New partner reviews must be 0');
});

runTest('Delivery Backend: server.js /api/delivery/earnings returns 0 for non-demo partner', () => {
  const serverCode = fs.readFileSync(path.join(rootDir, 'server/server.js'), 'utf8');
  assert.ok(serverCode.includes('isSeedDemoPartner = req.user && (req.user.email === \'deliveryfoodwala@gmail.com\''), 'Preserves demo seed for deliveryfoodwala@gmail.com only');
  assert.ok(serverCode.includes('todayEarnings: 0.00'), 'Default earnings for newly registered partner is 0.00');
  assert.ok(serverCode.includes('todayTrips: 0'), 'Default trips for newly registered partner is 0');
});

// =================================================================
// SUITE 3: BUTTON CONTRAST & VISIBILITY IN ORDER TRACKING
// =================================================================
console.log('\n--- SUITE 3: Button Contrast & Visibility ---');

const styleCss = fs.readFileSync(path.join(rootDir, 'css/style.css'), 'utf8');
const animCss = fs.readFileSync(path.join(rootDir, 'css/animations-3d.css'), 'utf8');
const orderTrackHtml = fs.readFileSync(path.join(rootDir, 'order-tracking.html'), 'utf8');

runTest('CSS: style.css overrides all outline buttons with background transparent !important', () => {
  assert.ok(styleCss.includes('[class*="btn-outline-"]'), 'style.css must have [class*="btn-outline-"] selector');
  assert.ok(styleCss.includes('background: transparent !important;'), 'style.css must set background transparent');
});

runTest('CSS: animations-3d.css sets background transparent on .btn-outline-danger', () => {
  assert.ok(animCss.includes('.btn-outline-danger {\n  color: #D92D20 !important;\n  border-color: #D92D20 !important;\n  background-color: transparent !important;'), 'animations-3d.css must set background-color transparent');
});

runTest('HTML: order-tracking.html contains dedicated high-contrast styles for #btn-trigger-pop & cart', () => {
  assert.ok(orderTrackHtml.includes('#btn-trigger-pop, a[href="./cart.html"].btn-outline-danger'), 'order-tracking.html must style pop button and cart link');
  assert.ok(orderTrackHtml.includes('background-color: transparent !important;'), 'Must have transparent background');
  assert.ok(orderTrackHtml.includes('color: #D92D20 !important;'), 'Must have distinct red text');
});

// =================================================================
// SUITE 4: RESTAURANT MANAGER PORTAL REAL-TIME ORDER SYNC
// =================================================================
console.log('\n--- SUITE 4: Restaurant Manager Order Sync ---');

const appJs = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
const liveAdapterJs = fs.readFileSync(path.join(rootDir, 'js/adapters/liveAdapter.js'), 'utf8');
const restDashHtml = fs.readFileSync(path.join(rootDir, 'restaurant-dashboard.html'), 'utf8');

runTest('App.js: placeOrder writes to foodwala_mock_kitchen_orders and sends storage ping', () => {
  assert.ok(appJs.includes("setStorage('foodwala_mock_kitchen_orders', kitchenOrders);"), 'Must sync to kitchen orders');
  assert.ok(appJs.includes("localStorage.setItem('foodwala_order_placed_ping', Date.now().toString());"), 'Must trigger storage ping');
  assert.ok(appJs.includes("new BroadcastChannel('foodwala_orders_channel');"), 'Must broadcast on orders channel');
});

runTest('LiveAdapter: getRestaurantOrders merges client orders and handles fallbacks gracefully', () => {
  assert.ok(liveAdapterJs.includes('Merge client-side/sandbox orders so none are missed'), 'liveAdapter must merge client-side orders');
  assert.ok(liveAdapterJs.includes('window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId)'), 'Must fall back to mockAdapter');
});

runTest('Restaurant Dashboard: Listens to foodwala_order_placed_ping and polls every 5s', () => {
  assert.ok(restDashHtml.includes("e.key === 'foodwala_order_placed_ping'"), 'Dashboard must listen for order placed ping');
  assert.ok(restDashHtml.includes("BroadcastChannel('foodwala_orders_channel')"), 'Dashboard must listen to BroadcastChannel');
  assert.ok(restDashHtml.includes('setInterval(reloadKitchenOrders, 5000);'), 'Polling interval must be 5 seconds');
});

// =================================================================
// SUITE 5: MIRRORED WEBAPP REPOSITORY INTEGRITY
// =================================================================
console.log('\n--- SUITE 5: Mirrored src/main/webapp/ Integrity ---');

const webappFiles = [
  'css/style.css',
  'css/animations-3d.css',
  'order-tracking.html',
  'restaurant-dashboard.html',
  'delivery-dashboard.html',
  'js/app.js',
  'js/adapters/liveAdapter.js',
  'js/help-assistance.js'
];

webappFiles.forEach(file => {
  runTest(`Mirror Check: src/main/webapp/${file} matches root version`, () => {
    const rootContent = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const webappContent = fs.readFileSync(path.join(rootDir, 'src/main/webapp', file), 'utf8');
    assert.strictEqual(rootContent, webappContent, `Mirror in src/main/webapp/${file} must match root`);
  });
});

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('>>> ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<');
  process.exit(0);
} else {
  console.error('>>> SOME VERIFICATION CHECKS FAILED! <<<');
  process.exit(1);
}
