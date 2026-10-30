// scripts/apply_final_polish.js
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve('D:/FoodWala_Eclipse_Project');
const webappDir = path.resolve('D:/FoodWala_Eclipse_Project/src/main/webapp');

console.log('=== APPLYING FINAL POLISH ACROSS PROJECT FILES ===');

// 1. Fix js/help-assistance.js window.FoodWalaApp reference
const helpJsPath = path.join(rootDir, 'js/help-assistance.js');
let helpJs = fs.readFileSync(helpJsPath, 'utf8');

helpJs = helpJs.replace(
  /if \(typeof window !== 'undefined' && window\.FoodWalaApp && FoodWalaApp\.Orders && typeof FoodWalaApp\.Orders\.getAllOrders === 'function'\) \{\s*var ordersList = FoodWalaApp\.Orders\.getAllOrders\(\);/g,
  `if (typeof window !== 'undefined' && window.FoodWalaApp && window.FoodWalaApp.Orders && typeof window.FoodWalaApp.Orders.getAllOrders === 'function') {
            var ordersList = window.FoodWalaApp.Orders.getAllOrders();`
);

fs.writeFileSync(helpJsPath, helpJs, 'utf8');
fs.writeFileSync(path.join(webappDir, 'js/help-assistance.js'), helpJs, 'utf8');
console.log('[UPDATED] js/help-assistance.js (root & webapp)');

// 2. Fix delivery-dashboard.html static completed-trips-list & Tab 3 rating
const delivHtmlPath = path.join(rootDir, 'delivery-dashboard.html');
let delivHtml = fs.readFileSync(delivHtmlPath, 'utf8');

// Replace static completed-trips-list
const targetTripsBlock = `<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">
                <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <span class="fs-3">🛵</span>
                    <div>
                      <div class="fw-black text-contrast-dark">Meghana Foods (Trip #908)</div>
                      <small class="text-contrast-medium fw-semibold">Koramangala to Bellandur • 3.4 km • 15 mins ago</small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-black text-success fs-5">+₹85.00</div>
                    <span class="badge bg-success text-white small">Paid</span>
                  </div>
                </div>

                <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <span class="fs-3">🛵</span>
                    <div>
                      <div class="fw-black text-contrast-dark">Vidyarthi Bhavan (Trip #907)</div>
                      <small class="text-contrast-medium fw-semibold">Basavanagudi to Jayanagar • 4.1 km • 1 hr ago</small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-black text-success fs-5">+₹95.00</div>
                    <span class="badge bg-success text-white small">Paid</span>
                  </div>
                </div>

                <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <span class="fs-3">🛵</span>
                    <div>
                      <div class="fw-black text-contrast-dark">Truffles (Trip #906)</div>
                      <small class="text-contrast-medium fw-semibold">St. Marks Rd to Indiranagar • 2.8 km • 2 hrs ago</small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-black text-success fs-5">+₹75.00</div>
                    <span class="badge bg-success text-white small">Paid</span>
                  </div>
                </div>

                <div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-white">
                  <div class="d-flex align-items-center gap-3">
                    <span class="fs-3">🛵</span>
                    <div>
                      <div class="fw-black text-contrast-dark">Empire Restaurant (Trip #905)</div>
                      <small class="text-contrast-medium fw-semibold">Indiranagar to Domlur • 4.5 km • 3 hrs ago</small>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="fw-black text-success fs-5">+₹110.00</div>
                    <span class="badge bg-success text-white small">Paid</span>
                  </div>
                </div>
              </div>`;

const cleanZeroTripsHtml = `<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">
                <div class="text-center py-5 px-3 bg-white">
                  <div class="fs-1 mb-2">🚴</div>
                  <h6 class="fw-black text-contrast-dark mb-1">No trips completed yet today</h6>
                  <p class="text-muted small mb-3">Welcome to the FoodWala Delivery Fleet! Stay online to receive nearby delivery dispatches.</p>
                  <span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-1.5 fw-bold">
                    <i class="bi bi-broadcast me-1"></i> Radar Active & Searching Orders
                  </span>
                </div>
              </div>`;

if (delivHtml.includes(targetTripsBlock)) {
  delivHtml = delivHtml.replace(targetTripsBlock, cleanZeroTripsHtml);
} else {
  // Regex fallback matching the block
  delivHtml = delivHtml.replace(
    /<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">[\s\S]*?Empire Restaurant \(Trip #905\)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
    cleanZeroTripsHtml
  );
}

// Update Tab 3 static ratings
delivHtml = delivHtml.replace(
  `<h3 class="fw-black text-contrast-dark mb-0">4.89 / 5.0</h3>\n              <p class="text-contrast-medium small fw-bold mb-0">Customer Satisfaction (340 Ratings)</p>`,
  `<h3 class="fw-black text-contrast-dark mb-0" id="tab3-rating-val">5.0 / 5.0</h3>\n              <p class="text-contrast-medium small fw-bold mb-0" id="tab3-reviews-count">New Hero (0 Reviews)</p>`
);

// Update renderPartnerMetrics to also update tab3-rating-val and tab3-reviews-count
const metricSyncTarget = `const hReviews = document.getElementById('header-reviews-count');
        if (hReviews) {
          hReviews.textContent = reviewsCount > 0 ? (reviewsCount + ' Reviews') : 'New Hero (0 Reviews)';
        }`;

const metricSyncAddition = `const hReviews = document.getElementById('header-reviews-count');
        if (hReviews) {
          hReviews.textContent = reviewsCount > 0 ? (reviewsCount + ' Reviews') : 'New Hero (0 Reviews)';
        }

        const t3Rating = document.getElementById('tab3-rating-val');
        if (t3Rating) t3Rating.textContent = rating + ' / 5.0';
        const t3Reviews = document.getElementById('tab3-reviews-count');
        if (t3Reviews) t3Reviews.textContent = reviewsCount > 0 ? ('Customer Satisfaction (' + reviewsCount + ' Reviews)') : 'New Hero (0 Reviews)';`;

if (delivHtml.includes(metricSyncTarget) && !delivHtml.includes('tab3-rating-val')) {
  delivHtml = delivHtml.replace(metricSyncTarget, metricSyncAddition);
}

fs.writeFileSync(delivHtmlPath, delivHtml, 'utf8');
fs.writeFileSync(path.join(webappDir, 'delivery-dashboard.html'), delivHtml, 'utf8');
console.log('[UPDATED] delivery-dashboard.html (root & webapp)');

// 3. Perfect byte-for-byte mirror copy of js/app.js
fs.copyFileSync(path.join(rootDir, 'js/app.js'), path.join(webappDir, 'js/app.js'));
console.log('[COPIED] js/app.js -> src/main/webapp/js/app.js');

console.log('=== POLISH APPLICATION COMPLETED ===');
