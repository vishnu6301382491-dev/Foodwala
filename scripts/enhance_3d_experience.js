const fs = require('fs');
const path = require('path');

console.log('--- Applying 3D Visual & Feature-Wise Enhancements ---');

// ============================================================================
// 1. UPDATE CSS (css/animations-3d.css)
// ============================================================================
const cssPath = path.resolve(__dirname, '../css/animations-3d.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// A. Add new category accents if not present
if (!cssContent.includes('.cat-desserts')) {
  const catInsertTarget = '.cat-beverages {\n  --cat-accent: rgba(139, 92, 246, 0.2);\n  --cat-shadow: rgba(139, 92, 246, 0.3);\n  --cat-glow: rgba(139, 92, 246, 0.25);\n}';
  const newCatAccents = `${catInsertTarget}
.cat-desserts {
  --cat-accent: rgba(236, 72, 153, 0.2);
  --cat-shadow: rgba(236, 72, 153, 0.3);
  --cat-glow: rgba(236, 72, 153, 0.25);
}
.cat-rolls {
  --cat-accent: rgba(245, 158, 11, 0.2);
  --cat-shadow: rgba(245, 158, 11, 0.3);
  --cat-glow: rgba(245, 158, 11, 0.25);
}`;
  cssContent = cssContent.replace(catInsertTarget, newCatAccents);
  console.log('Added .cat-desserts and .cat-rolls to CSS');
}

// B. Add new hero food chips if not present
if (!cssContent.includes('.hero-chip-biryani')) {
  const chipTarget = `.hero-chip-burger {\n  bottom: -15px;\n  left: 22%;\n  animation-duration: 6.5s;\n  animation-delay: -2.8s;\n}`;
  const newChips = `${chipTarget}
.hero-chip-biryani {
  top: 25%;
  left: -20px;
  animation-duration: 5.8s;
  animation-delay: -1.5s;
}
.hero-chip-dimsum {
  bottom: 25%;
  right: -20px;
  animation-duration: 6.2s;
  animation-delay: -3.2s;
}`;
  cssContent = cssContent.replace(chipTarget, newChips);
  console.log('Added .hero-chip-biryani and .hero-chip-dimsum to CSS');
}

// C. Add 3D Tracking Section and 3D Deal Card styles
if (!cssContent.includes('.fw-3d-tracking-section')) {
  const newSectionStyles = `
/* ==========================================================================
   3D LIVE ORDER TRACKING SECTION STYLES
   ========================================================================== */
.fw-3d-tracking-section {
  background: linear-gradient(135deg, #090d16 0%, #151b28 50%, #1a1528 100%);
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.fw-3d-tracking-milestone {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 0.9rem 1.15rem;
  transition: all 0.25s ease;
}

.fw-3d-tracking-milestone:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(220, 38, 38, 0.35);
  transform: translateX(6px);
}

.fw-3d-milestone-dot {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* ==========================================================================
   3D HOLOGRAPHIC GOURMET DEALS SECTION STYLES
   ========================================================================== */
.fw-3d-deals-section {
  background: linear-gradient(135deg, #1c1917 0%, #292524 50%, #451a03 100%);
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(245, 158, 11, 0.15);
  border-bottom: 1px solid rgba(245, 158, 11, 0.15);
}

.fw-3d-deal-card {
  position: relative;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(220, 38, 38, 0.18) 50%, rgba(139, 92, 246, 0.12) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 28px;
  padding: 2.25rem;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.25s cubic-bezier(0.2, 0, 0.2, 1), box-shadow 0.25s ease;
  overflow: hidden;
}

.fw-3d-deal-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 30px 60px -12px rgba(245, 158, 11, 0.35), 0 0 35px rgba(220, 38, 38, 0.25);
}

.fw-3d-holo-shimmer {
  position: absolute;
  inset: -100%;
  background: linear-gradient(
    45deg,
    transparent 35%,
    rgba(255, 255, 255, 0.16) 50%,
    transparent 65%
  );
  transform: rotate(25deg);
  animation: fwHoloSweep 6s infinite;
  pointer-events: none;
}

@keyframes fwHoloSweep {
  0% { transform: translateX(-100%) rotate(25deg); }
  35%, 100% { transform: translateX(100%) rotate(25deg); }
}
`;
  cssContent += newSectionStyles;
  console.log('Appended 3D Tracking Section & 3D Deals Section to CSS');
}

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('[SAVED] css/animations-3d.css');


// ============================================================================
// 2. UPDATE JS (js/animations-3d.js)
// ============================================================================
const jsPath = path.resolve(__dirname, '../js/animations-3d.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

if (!jsContent.includes('.fw-3d-deal-card')) {
  jsContent = jsContent.replace(
    "'.fw-3d-menu-card',",
    "'.fw-3d-menu-card',\n      '.fw-3d-deal-card',\n      '.hero-image-3d-wrapper',"
  );
  console.log('Added .fw-3d-deal-card and .hero-image-3d-wrapper to tiltSelectors in js/animations-3d.js');
}

fs.writeFileSync(jsPath, jsContent, 'utf8');
console.log('[SAVED] js/animations-3d.js');


// ============================================================================
// 3. GENERATE ENHANCED HTML FOR index.html & home.html
// ============================================================================
const newHeroRightHtml = `        <div class="col-lg-5 text-center position-relative">
          <div class="hero-image-3d-wrapper js-3d-tilt" style="transform-style: preserve-3d; perspective: 1200px;">
            <!-- Glowing Dish Aura -->
            <div class="position-absolute rounded-circle bg-danger bg-opacity-25" style="width: 320px; height: 320px; filter: blur(55px); top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0; pointer-events: none;"></div>

            <!-- 3D Floating Badges around hero image -->
            <div class="hero-3d-badge-floating hero-badge-1 d-flex align-items-center gap-2 shadow-lg" style="z-index: 10;">
              <span class="fs-4">🔥</span>
              <div class="text-start">
                <span class="fw-bold d-block text-dark lh-1" style="font-size: 0.85rem;">50% Flat Off</span>
                <small class="text-danger fw-semibold" style="font-size: 0.7rem;">Code: FOODWALA50</small>
              </div>
            </div>

            <div class="hero-3d-badge-floating hero-badge-2 d-flex align-items-center gap-2 shadow-lg" style="z-index: 10;">
              <span class="fs-4">⚡</span>
              <div class="text-start">
                <span class="fw-bold d-block text-dark lh-1" style="font-size: 0.85rem;">24 Min Delivery</span>
                <small class="text-success fw-semibold" style="font-size: 0.7rem;">Live GPS Tracking</small>
              </div>
            </div>

            <div class="hero-3d-badge-floating hero-badge-3 d-flex align-items-center gap-2 shadow-lg" style="z-index: 10;">
              <span class="fs-4">⭐</span>
              <div class="text-start">
                <span class="fw-bold d-block text-dark lh-1" style="font-size: 0.85rem;">4.9 Foodie Rating</span>
                <small class="text-muted fw-semibold" style="font-size: 0.7rem;">105+ Iconic Spots</small>
              </div>
            </div>

            <!-- 4 Floating 3D Food Chips -->
            <div class="hero-3d-chip hero-chip-pizza" title="Woodfired Pizza">🍕</div>
            <div class="hero-3d-chip hero-chip-burger" title="Gourmet Burger">🍔</div>
            <div class="hero-3d-chip hero-chip-biryani" title="Hyderabadi Biryani">🍚</div>
            <div class="hero-3d-chip hero-chip-dimsum" title="Fresh Dimsum">🥟</div>

            <!-- Main High-Definition Platter Image -->
            <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&auto=format&fit=crop&q=80" alt="Gourmet Bengaluru Feast" class="img-fluid hero-image-3d shadow-2xl rounded-circle position-relative" width="360" height="360" fetchpriority="high" decoding="async" style="width: 340px; height: 340px; object-fit: cover; border: 6px solid rgba(255, 255, 255, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75); z-index: 5;">
          </div>
        </div>`;

const newCategoriesHtml = `  <!-- Categories Section -->
  <section class="py-5 bg-white">
    <div class="container">
      <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
          <span class="text-danger fw-bold text-uppercase small letter-spacing-1">Inspiration for your order</span>
          <h2 class="fw-extrabold text-dark mb-0">Popular Food Categories</h2>
        </div>
        <a href="./restaurants.html" class="btn btn-outline-danger btn-sm rounded-pill fw-bold">View All Categories &rarr;</a>
      </div>

      <div class="row row-cols-2 row-cols-md-4 row-cols-lg-8 g-3 text-center">
        <div class="col">
          <a href="./restaurants.html?q=pizza" class="category-card-3d cat-pizza js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Pizza">
            </div>
            <span class="cat-label">Pizza</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?q=burger" class="category-card-3d cat-burger js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Burgers">
            </div>
            <span class="cat-label">Burger</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?q=biryani" class="category-card-3d cat-biryani js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Biryani">
            </div>
            <span class="cat-label">Biryani</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?cuisine=Chinese" class="category-card-3d cat-chinese js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Chinese">
            </div>
            <span class="cat-label">Chinese</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?cuisine=South+Indian" class="category-card-3d cat-south-indian js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="South Indian">
            </div>
            <span class="cat-label">South Indian</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?cuisine=Beverages" class="category-card-3d cat-beverages js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1544145945-f90425340c7e?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Beverages">
            </div>
            <span class="cat-label">Beverages</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?q=dessert" class="category-card-3d cat-desserts js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Desserts">
            </div>
            <span class="cat-label">Desserts</span>
          </a>
        </div>
        <div class="col">
          <a href="./restaurants.html?q=roll" class="category-card-3d cat-rolls js-3d-tilt">
            <div class="cat-img-wrap">
              <img src="https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=180&auto=format&fit=crop&q=75" width="86" height="86" loading="lazy" decoding="async" alt="Rolls">
            </div>
            <span class="cat-label">Rolls</span>
          </a>
        </div>
      </div>
    </div>
  </section>`;

const newLiveTrackingSectionHtml = `  <!-- ==========================================================================
       SESSION 3: 3D LIVE ORDER TRACKING & TURN-BY-TURN DELIVERY SECTION
       ========================================================================== -->
  <section class="fw-3d-tracking-section py-5 text-white">
    <div class="container py-3">
      <div class="row align-items-center g-5">
        <div class="col-lg-6">
          <div class="badge bg-emerald-500 bg-opacity-20 text-success border border-success border-opacity-30 px-3 py-1.5 rounded-pill mb-3 fw-bold small d-inline-flex align-items-center gap-2" style="color: #34d399 !important;">
            <span class="spinner-grow spinner-grow-sm text-success" style="width: 8px; height: 8px;" role="status"></span>
            <span>Live GPS Order Tracking Active</span>
          </div>
          <h2 class="display-6 fw-extrabold text-white mb-3">
            Hyper-Local Speed. <span class="text-transparent bg-clip-text text-warning" style="background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Turn-by-Turn Precision.</span>
          </h2>
          <p class="text-light text-opacity-75 mb-4">
            From our kitchen hubs in Maruthi Nagar, Koramangala, and across 14+ Bengaluru hubs straight to your doorstep in an average of 24 minutes.
          </p>

          <div class="d-flex flex-column gap-2 mb-4">
            <div class="fw-3d-tracking-milestone d-flex align-items-center gap-3">
              <div class="fw-3d-milestone-dot bg-danger text-white">🍳</div>
              <div>
                <span class="fw-bold text-white small d-block">1. Fresh Kitchen Prep</span>
                <small class="text-light text-opacity-50">Cooked to order with tamper-proof thermal packaging.</small>
              </div>
            </div>
            <div class="fw-3d-tracking-milestone d-flex align-items-center gap-3">
              <div class="fw-3d-milestone-dot bg-warning text-dark">🛵</div>
              <div>
                <span class="fw-bold text-white small d-block">2. Valet Live Dispatch</span>
                <small class="text-light text-opacity-50">Assigned immediately with turn-by-turn motorcycle telemetry.</small>
              </div>
            </div>
            <div class="fw-3d-tracking-milestone d-flex align-items-center gap-3">
              <div class="fw-3d-milestone-dot bg-success text-white">📍</div>
              <div>
                <span class="fw-bold text-white small d-block">3. Live GPS Arrival at Maruthi Nagar / BLR</span>
                <small class="text-light text-opacity-50">Watch your delivery partner arrive live on map in 24 mins.</small>
              </div>
            </div>
          </div>

          <div class="d-flex gap-3">
            <a href="./orders.html" class="btn btn-danger btn-danger-shimmer px-4 py-2.5 rounded-pill fw-bold d-inline-flex align-items-center gap-2 shadow">
              <i class="bi bi-geo-alt-fill"></i> Track Live Orders
            </a>
            <a href="./restaurants.html" class="btn btn-outline-light px-4 py-2.5 rounded-pill fw-bold">
              Explore Menu
            </a>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="p-4 bg-dark bg-opacity-60 rounded-4 border border-secondary border-opacity-25 shadow-2xl">
            <!-- 3D Road Stage -->
            <div class="fw-3d-road-stage mb-3">
              <div class="fw-3d-sky-glow"></div>
              <div class="fw-3d-road-plane">
                <div class="fw-3d-road-curbs">
                  <div class="fw-3d-road-curb"></div>
                  <div class="fw-3d-road-curb"></div>
                </div>
                <div class="fw-3d-road-dashes"></div>
              </div>
              <div class="fw-3d-scooter-anchor">
                <div class="fw-3d-scooter-pulse-ring"></div>
                <div class="fw-3d-scooter-vehicle">
                  <span>🛵</span>
                  <div class="fw-3d-headlight-beam"></div>
                </div>
                <div class="fw-3d-scooter-shadow"></div>
              </div>
            </div>

            <!-- Live Telemetry Card -->
            <div class="bg-dark bg-opacity-90 p-3 rounded-3 border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
                  <i class="bi bi-shield-check fs-5"></i>
                </div>
                <div>
                  <span class="fw-bold text-white d-block small">Valet: Suresh Kumar</span>
                  <small class="text-success fw-semibold"><i class="bi bi-record-circle me-1"></i>En Route: Maruthi Nagar (14 min)</small>
                </div>
              </div>
              <span class="badge bg-danger rounded-pill px-3 py-2 fw-bold">SPEED: 32 km/h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;

const newGourmetDealsSectionHtml = `  <!-- ==========================================================================
       SESSION 5: 3D HOLOGRAPHIC GOURMET DEALS & OFFERS BANNER
       ========================================================================== -->
  <section class="fw-3d-deals-section py-5 text-white">
    <div class="container py-3">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="fw-3d-deal-card js-3d-tilt">
            <div class="fw-3d-holo-shimmer"></div>
            <div class="row align-items-center g-4 position-relative" style="z-index: 5;">
              <div class="col-md-8">
                <div class="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-40 px-3 py-1.5 rounded-pill mb-2 fw-bold small">
                  ⭐ DAILY CHEF SPECIAL OFFER
                </div>
                <h3 class="display-6 fw-black text-white mb-2">
                  FLAT 50% OFF <span class="text-warning">EVERY ORDER</span>
                </h3>
                <p class="text-light text-opacity-75 mb-3 small">
                  Apply coupon code on your favourite Biryani, Woodfired Pizza, Gourmet Burgers, and Desserts across Bengaluru.
                </p>
                <div class="d-flex flex-wrap align-items-center gap-2">
                  <div class="bg-dark bg-opacity-75 px-3 py-2 rounded-3 border border-warning border-opacity-50 text-warning font-monospace fw-bold fs-6 tracking-wide">
                    FOODWALA50
                  </div>
                  <button type="button" class="btn btn-warning rounded-pill px-4 py-2 fw-bold text-dark shadow" onclick="navigator.clipboard && navigator.clipboard.writeText('FOODWALA50'); FoodWalaApp && FoodWalaApp.showToast('Coupon code FOODWALA50 copied to clipboard!', 'success');">
                    <i class="bi bi-copy me-1"></i> Copy Code
                  </button>
                  <small class="text-light text-opacity-50 ms-2">Valid across all 105+ restaurants</small>
                </div>
              </div>
              <div class="col-md-4 text-center">
                <div class="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-20 rounded-circle p-4 border border-warning border-opacity-30 shadow-2xl" style="width: 140px; height: 140px;">
                  <span class="display-2">🎁</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;

// ============================================================================
// 4. APPLY UPDATES TO index.html & home.html
// ============================================================================
function updateHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');

  // A. Replace Hero Right Column
  const oldHeroRegex = /<div class="col-lg-5 text-center position-relative">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
  if (oldHeroRegex.test(html)) {
    html = html.replace(oldHeroRegex, newHeroRightHtml + '\n      </div>\n    </div>\n  </section>');
    console.log(`Replaced Hero section in ${path.basename(filePath)}`);
  }

  // B. Replace Categories Section (8 categories)
  const oldCatRegex = /<!-- Categories Section -->[\s\S]*?<\/section>/;
  if (oldCatRegex.test(html)) {
    html = html.replace(oldCatRegex, newCategoriesHtml);
    console.log(`Replaced Categories section in ${path.basename(filePath)}`);
  }

  // C. Insert 3D Live Tracking Section after Categories
  if (!html.includes('fw-3d-tracking-section')) {
    html = html.replace(newCategoriesHtml, newCategoriesHtml + '\n\n' + newLiveTrackingSectionHtml);
    console.log(`Inserted 3D Live Tracking Section in ${path.basename(filePath)}`);
  }

  // D. Insert 3D Deals Section before Why Choose FoodWala
  if (!html.includes('fw-3d-deals-section')) {
    html = html.replace('<!-- 3D "Why Choose FoodWala" Features Section -->', newGourmetDealsSectionHtml + '\n\n  <!-- 3D "Why Choose FoodWala" Features Section -->');
    console.log(`Inserted 3D Deals Section in ${path.basename(filePath)}`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[SAVED] ${filePath}`);
}

updateHtmlFile(path.resolve(__dirname, '../index.html'));
updateHtmlFile(path.resolve(__dirname, '../home.html'));

// ============================================================================
// 5. MIRROR TO src/main/webapp/
// ============================================================================
const filesToMirror = [
  'css/animations-3d.css',
  'js/animations-3d.js',
  'index.html',
  'home.html'
];

for (const rel of filesToMirror) {
  const src = path.resolve(__dirname, '..', rel);
  const dst = path.resolve(__dirname, '..', 'src/main/webapp', rel);
  fs.copyFileSync(src, dst);
  console.log(`[MIRRORED] ${rel} -> src/main/webapp/${rel}`);
}

console.log('--- Enhancements Successfully Applied and Mirrored! ---');
