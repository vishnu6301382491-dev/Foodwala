// scripts/patch_multitask_fixes_v2.js
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('D:/FoodWala_Eclipse_Project');
const webappDir = path.resolve('D:/FoodWala_Eclipse_Project/src/main/webapp');

console.log('=== FOODWALA MULTITASK FIXES V2 APPLICATION ===');

function patchFile(relPath, patchFn) {
  const p1 = path.join(rootDir, relPath);
  const p2 = path.join(webappDir, relPath);

  [p1, p2].forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const original = fs.readFileSync(filePath, 'utf8');
      const updated = patchFn(original);
      if (updated !== original) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log(`[PATCHED] ${path.relative(rootDir, filePath)}`);
      } else {
        console.log(`[NO_CHANGE] ${path.relative(rootDir, filePath)} (already up to date)`);
      }
    } else {
      console.warn(`[SKIP] File not found: ${filePath}`);
    }
  });
}

// -------------------------------------------------------------
// 1. FIX CSS OUTLINE BUTTON CONTRAST IN css/style.css
// -------------------------------------------------------------
patchFile('css/style.css', (content) => {
  if (content.includes('/* OUTLINE BUTTON CONTRAST OVERRIDES */')) {
    return content;
  }
  const needle = '.btn:hover {';
  const insertion = `/* OUTLINE BUTTON CONTRAST OVERRIDES (Prevents Red-on-Red & Invisible Text) */
.btn-outline-danger,
.btn-outline-primary,
.btn-outline-secondary,
.btn-outline-success,
.btn-outline-warning,
.btn-outline-info,
.btn-outline-dark,
[class*="btn-outline-"] {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
}

`;
  if (content.includes(needle)) {
    return content.replace(needle, insertion + needle);
  }
  return content + '\n' + insertion;
});

// -------------------------------------------------------------
// 2. FIX CSS OUTLINE BUTTON IN css/animations-3d.css
// -------------------------------------------------------------
patchFile('css/animations-3d.css', (content) => {
  let updated = content;

  // Replace line ~2983 .btn-outline-danger
  updated = updated.replace(
    /\.btn-outline-danger\s*\{\s*color:\s*#D92D20\s*!important;\s*border-color:\s*#D92D20\s*!important;\s*\}/g,
    `.btn-outline-danger {
  color: #D92D20 !important;
  border-color: #D92D20 !important;
  background-color: transparent !important;
  background: transparent !important;
}`
  );

  // Replace dark mode line ~3115
  updated = updated.replace(
    /\[data-bs-theme="dark"\]\s*\.btn-outline-danger\s*\{\s*color:\s*#FF705D\s*!important;\s*border-color:\s*#FF705D\s*!important;\s*\}/g,
    `[data-bs-theme="dark"] .btn-outline-danger {
  color: #FF705D !important;
  border-color: #FF705D !important;
  background-color: transparent !important;
  background: transparent !important;
}`
  );

  // Replace dark mode line ~2619
  updated = updated.replace(
    /\[data-bs-theme="dark"\]\s*\.btn-outline-danger\s*\{\s*color:\s*#f87171\s*!important;\s*border-color:\s*#ef4444\s*!important;\s*\}/g,
    `[data-bs-theme="dark"] .btn-outline-danger {
  color: #f87171 !important;
  border-color: #ef4444 !important;
  background-color: transparent !important;
  background: transparent !important;
}`
  );

  return updated;
});

// -------------------------------------------------------------
// 3. FIX ORDER TRACKING UI CONTRAST IN order-tracking.html
// -------------------------------------------------------------
patchFile('order-tracking.html', (content) => {
  let updated = content;

  // Ensure high-contrast styling for #btn-trigger-pop and navbar Cart
  if (!updated.includes('/* High Contrast Pop Alert and Cart overrides */')) {
    const styleOverride = `  <style>
    /* High Contrast Pop Alert and Cart overrides */
    #btn-trigger-pop, a[href="./cart.html"].btn-outline-danger {
      background-color: transparent !important;
      background: transparent !important;
      color: #D92D20 !important;
      border: 1.5px solid #D92D20 !important;
      box-shadow: 0 1px 3px rgba(217, 45, 32, 0.12) !important;
    }
    #btn-trigger-pop:hover, a[href="./cart.html"].btn-outline-danger:hover {
      background-color: #D92D20 !important;
      background: #D92D20 !important;
      color: #ffffff !important;
    }
    [data-bs-theme="dark"] #btn-trigger-pop,
    [data-bs-theme="dark"] a[href="./cart.html"].btn-outline-danger {
      background-color: transparent !important;
      background: transparent !important;
      color: #FF705D !important;
      border: 1.5px solid #FF705D !important;
    }
    [data-bs-theme="dark"] #btn-trigger-pop:hover,
    [data-bs-theme="dark"] a[href="./cart.html"].btn-outline-danger:hover {
      background-color: #FF705D !important;
      background: #FF705D !important;
      color: #101418 !important;
    }
  </style>
</head>`;
    if (updated.includes('</head>')) {
      updated = updated.replace('</head>', styleOverride);
    }
  }

  return updated;
});

// -------------------------------------------------------------
// 4. FIX RESTAURANT ORDERS SYNC IN js/adapters/liveAdapter.js
// -------------------------------------------------------------
patchFile('js/adapters/liveAdapter.js', (content) => {
  let updated = content;

  const targetFnRegex = /getRestaurantOrders:\s*async\s*function\s*\(restaurantId\)\s*\{[\s\S]*?updateRestaurantOrderStatus:/;

  const replacementFn = `getRestaurantOrders: async function (restaurantId) {
      if (unavailableEndpoints.has('restaurant_orders')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
        }
      }
      const q = restaurantId ? \`?restaurantId=\${restaurantId}\` : '';
      try {
        const res = await liveFetch(\`/api/restaurant/orders\${q}\`, { headers: getAuthHeader() });
        if (res.ok) {
          const liveData = await res.json();
          // Merge client-side/sandbox orders so none are missed (e.g. newly placed customer orders)
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock && typeof window.FoodWalaAdapters.mock.getRestaurantOrders === 'function') {
            try {
              const mockData = await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
              if (mockData && Array.isArray(mockData.orders)) {
                const liveIds = new Set((liveData.orders || []).map(o => String(o.order_id || o.orderId || o.id).replace(/^#?FW-?/i, '')));
                const extraOrders = mockData.orders.filter(o => !liveIds.has(String(o.order_id || o.orderId || o.id).replace(/^#?FW-?/i, '')));
                if (extraOrders.length > 0) {
                  liveData.orders = [...extraOrders, ...(liveData.orders || [])];
                  liveData.totalOrders = liveData.orders.length;
                }
              }
            } catch (mergeErr) {}
          }
          return liveData;
        }
        if (res.status === 404 || res.status === 401 || res.status === 403) {
          if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
            return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
          }
        }
        handleHttpErrors(res);
      } catch (err) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getRestaurantOrders(restaurantId);
        }
        throw err;
      }
    },

    updateRestaurantOrderStatus:`;

  if (targetFnRegex.test(updated)) {
    updated = updated.replace(targetFnRegex, replacementFn);
  }

  return updated;
});

// -------------------------------------------------------------
// 5. SYNC NEW ORDERS TO KITCHEN STORE IN js/app.js
// -------------------------------------------------------------
patchFile('js/app.js', (content) => {
  let updated = content;

  const needle = `setStorage('foodwala_mock_orders', mockOrders);\n      } catch (e) {}`;
  const addition = `setStorage('foodwala_mock_orders', mockOrders);
      } catch (e) {}

      // Also sync to mock kitchen orders store for restaurant manager portal
      try {
        const kitchenOrders = getStorage('foodwala_mock_kitchen_orders', []);
        if (Array.isArray(kitchenOrders)) {
          const kIdx = kitchenOrders.findIndex(o => String(o.order_id || o.orderId || o.id).replace(/^#?FW-?/i, '') === cleanId);
          if (kIdx > -1) {
            kitchenOrders[kIdx] = newOrder;
          } else {
            kitchenOrders.unshift(newOrder);
          }
          setStorage('foodwala_mock_kitchen_orders', kitchenOrders);
        }
      } catch (e) {}

      // Cross-tab notification ping
      try {
        localStorage.setItem('foodwala_order_placed_ping', Date.now().toString());
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('foodwala_orders_channel');
          bc.postMessage({ type: 'order_placed', order: newOrder });
          bc.close();
        }
      } catch (e) {}`;

  if (updated.includes(needle) && !updated.includes('foodwala_order_placed_ping')) {
    updated = updated.replace(needle, addition);
  }

  return updated;
});

// -------------------------------------------------------------
// 6. RESTAURANT DASHBOARD REAL-TIME LISTENER IN restaurant-dashboard.html
// -------------------------------------------------------------
patchFile('restaurant-dashboard.html', (content) => {
  let updated = content;

  const storageRegex = /window\.addEventListener\('storage',\s*\(e\)\s*=>\s*\{[\s\S]*?setInterval\(reloadKitchenOrders,\s*15000\);/m;

  const newListener = `window.addEventListener('storage', (e) => {
      if (e.key === 'foodwala_orders' || e.key === 'foodwala_mock_orders' || e.key === 'foodwala_mock_kitchen_orders' || e.key === 'foodwala_order_placed_ping') {
        reloadKitchenOrders();
      }
    });
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('foodwala_orders_channel');
        bc.onmessage = () => { reloadKitchenOrders(); };
      } catch (e) {}
    }
    setInterval(reloadKitchenOrders, 5000);`;

  if (storageRegex.test(updated)) {
    updated = updated.replace(storageRegex, newListener);
  }

  return updated;
});

// -------------------------------------------------------------
// 7. CHATBOT GREETING & INTENT ROUTING IN js/help-assistance.js
// -------------------------------------------------------------
patchFile('js/help-assistance.js', (content) => {
  let updated = content;

  // Update greeting check to strict standalone greeting so "Hi FoodWala Support, I need help with my order" won't be hijacked
  const oldGreeting = `// 7. Greetings ("hi", "hello", "hey", "need assistance", etc.)
      if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('assistance') || q.includes('help') || q.includes('foodwala')) {`;

  const newGreeting = `// 7. Greetings (Strict matching: standalone greetings only, not mixed queries like "help with order" or "FoodWala cancel")
      var isPureGreeting = /^(hi|hello|hey|namaste|greetings|good\\s+morning|good\\s+afternoon|good\\s+evening)(\\s+foodwala)?(\\s+team|\\s+support)?[\\s!.]*$/i.test(q) ||
                           q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q === 'help';
      if (isPureGreeting) {`;

  if (updated.includes(oldGreeting)) {
    updated = updated.replace(oldGreeting, newGreeting);
  }

  // Update tracking intent to capture "help with order" and "Hi FoodWala Support, I need help with my order"
  const oldTrackIntent = `var isTrackIntent = q.includes('track') || q.includes('where is my') || q.includes('order status') ||
                          q.includes('delivery status') || q.includes('eta') || /#?fw-?\\d+/i.test(q) ||
                          (q.includes('order') && (q.includes('my') || q.includes('find') || q.includes('show') || q.includes('check')));`;

  const newTrackIntent = `var isTrackIntent = q.includes('track') || q.includes('where is my') || q.includes('order status') ||
                          q.includes('delivery status') || q.includes('eta') || /#?fw-?\\d+/i.test(q) ||
                          (q.includes('order') && (q.includes('my') || q.includes('find') || q.includes('show') || q.includes('check') || q.includes('help') || q.includes('support') || q.includes('with')));`;

  if (updated.includes(oldTrackIntent)) {
    updated = updated.replace(oldTrackIntent, newTrackIntent);
  }

  // Update API Base URL resolution in processUserQuery to connect to backend on localhost:5000
  const oldApiBase = `} else if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
          apiBase = window.location.origin;
        } else {
          apiBase = 'http://localhost:5000';
        }`;

  const newApiBase = `} else if (window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          apiBase = 'http://localhost:5000';
        } else if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
          apiBase = window.location.origin;
        } else {
          apiBase = 'http://localhost:5000';
        }`;

  if (updated.includes(oldApiBase)) {
    updated = updated.replace(oldApiBase, newApiBase);
  }

  return updated;
});

// -------------------------------------------------------------
// 8. DELIVERY DASHBOARD CLEAN STATIC HTML & RESET IN delivery-dashboard.html
// -------------------------------------------------------------
patchFile('delivery-dashboard.html', (content) => {
  let updated = content;

  // Clean static HTML inside #completed-trips-list
  const staticTripsRegex = /<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- \/tab-pane pocket-pane -->/i;

  const cleanTripsHtml = `<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">
                <div class="text-center py-5 px-3 bg-white">
                  <div class="fs-1 mb-2">🚴</div>
                  <h6 class="fw-black text-contrast-dark mb-1">No trips completed yet today</h6>
                  <p class="text-muted small mb-3">Welcome to the FoodWala Delivery Fleet! Stay online to receive nearby delivery dispatches.</p>
                  <span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-1.5 fw-bold">
                    <i class="bi bi-broadcast me-1"></i> Radar Active & Searching Orders
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- /tab-pane pocket-pane -->`;

  if (staticTripsRegex.test(updated)) {
    updated = updated.replace(staticTripsRegex, cleanTripsHtml);
  }

  // Update initPartnerMetrics to reset old dummy metrics
  const oldInitMetrics = `if (!metrics) {
          if (isSeedDemoPartner) {`;

  const newInitMetrics = `if (!metrics || (!isSeedDemoPartner && metrics.tripsCount === 9 && metrics.todayEarnings === 840)) {
          if (isSeedDemoPartner) {`;

  if (updated.includes(oldInitMetrics)) {
    updated = updated.replace(oldInitMetrics, newInitMetrics);
  }

  return updated;
});

console.log('=== MULTITASK FIXES V2 COMPLETED SUCCESSFULLY ===');
