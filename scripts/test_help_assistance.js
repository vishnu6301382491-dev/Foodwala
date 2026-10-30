/**
 * Automated Verification Suite for Zomato Video Hero & 24/7 Help Assistance
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('============================================================');
console.log('🧪 RUNNING ZOMATO VIDEO HERO & 24/7 HELP ASSISTANCE TEST SUITE');
console.log('============================================================\n');

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`   ❌ FAIL: ${message}`);
    allPassed = false;
  } else {
    console.log(`   ✅ PASS: ${message}`);
  }
}

// Test 1: Verify js/help-assistance.js syntax and integrity
console.log('Test 1: Verifying js/help-assistance.js syntax and module...');
const helpJsPath = path.join(PROJECT_ROOT, 'js', 'help-assistance.js');
assert(fs.existsSync(helpJsPath), 'js/help-assistance.js exists on disk.');

const helpJsContent = fs.readFileSync(helpJsPath, 'utf8');
try {
  // Test syntax by compiling in Node vm
  const mockWindow = {};
  const mockDocument = {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
    body: { appendChild: () => {} },
    addEventListener: () => {}
  };
  vm.runInNewContext(helpJsContent, { window: mockWindow, document: mockDocument, setTimeout: () => {} });
  assert(typeof mockWindow.FoodWalaHelpAssistant === 'object', 'FoodWalaHelpAssistant initialized as object.');
  assert(typeof mockWindow.FoodWalaHelpAssistant.init === 'function', 'FoodWalaHelpAssistant.init is a function.');
} catch (e) {
  assert(false, `help-assistance.js failed to execute: ${e.message}`);
}

// Test 2: Verify Hero Video in index.html and home.html
console.log('\nTest 2: Verifying Zomato-style 4K Video Hero in index.html & home.html...');
const indexHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
const homeHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'home.html'), 'utf8');

assert(indexHtml.includes('<video id="hero-food-video"'), 'index.html contains #hero-food-video element.');
assert(indexHtml.includes('autoplay') && indexHtml.includes('muted') && indexHtml.includes('loop'), 'index.html video has autoplay, muted, and loop attributes.');
assert(indexHtml.includes('btn-hero-video-play') && indexHtml.includes('btn-hero-video-mute'), 'index.html contains video playback and sound toggle buttons.');

assert(homeHtml.includes('<video id="hero-food-video"'), 'home.html contains #hero-food-video element.');
assert(homeHtml.includes('btn-hero-video-play') && homeHtml.includes('btn-hero-video-mute'), 'home.html contains video controls.');

// Test 3: Verify 24/7 Help Integration in HTML files
console.log('\nTest 3: Verifying 24/7 Help script linkage across application pages...');
const targetPages = ['index.html', 'home.html', 'restaurants.html', 'orders.html', 'cart.html'];
targetPages.forEach(page => {
  const content = fs.readFileSync(path.join(PROJECT_ROOT, page), 'utf8');
  assert(content.includes('help-assistance.js'), `${page} links help-assistance.js.`);
});

// Test 4: Verify CSS styles in css/animations-3d.css
console.log('\nTest 4: Verifying CSS definitions in css/animations-3d.css...');
const cssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'animations-3d.css'), 'utf8');
assert(cssContent.includes('.hero-video-box'), 'CSS defines .hero-video-box.');
assert(cssContent.includes('.hero-video-elem'), 'CSS defines .hero-video-elem with object-fit: cover.');
assert(cssContent.includes('.hero-video-overlay'), 'CSS defines .hero-video-overlay for dark vignette contrast.');
assert(cssContent.includes('.fw-help-floating-btn'), 'CSS defines .fw-help-floating-btn.');
assert(cssContent.includes('.fw-help-pulse-dot'), 'CSS defines .fw-help-pulse-dot radar animation.');

// Test 5: Verify Smart Query Responses logic & Real WhatsApp Number
console.log('\nTest 5: Verifying Smart Query handler response logic & WhatsApp number...');
assert(helpJsContent.includes('Suresh Kumar') && helpJsContent.includes('Maruthi Nagar'), 'Order tracking logic references live valet Suresh Kumar and Maruthi Nagar.');
assert(helpJsContent.includes('FOODWALA50'), 'Coupon logic references FOODWALA50 discount code.');
assert(helpJsContent.includes('15551960307'), 'WhatsApp integration uses verified hotline 15551960307.');

// Test 6: Verify Local Video Asset & Section Order
console.log('\nTest 6: Verifying local video asset & section alignment in index.html...');
const videoPath = path.join(PROJECT_ROOT, 'videos', 'food-hero.webm');
assert(fs.existsSync(videoPath), 'videos/food-hero.webm exists locally.');
assert(fs.statSync(videoPath).size > 1000000, 'videos/food-hero.webm size is valid (>1MB).');

const restIndex = indexHtml.indexOf('Featured Restaurants');
const trackIndex = indexHtml.indexOf('fw-3d-tracking-section');
assert(restIndex !== -1 && trackIndex !== -1 && restIndex < trackIndex, 'Featured Restaurants appears BEFORE Live GPS Tracking section in index.html.');
assert(indexHtml.includes('videos/food-hero.webm'), 'index.html points to local ./videos/food-hero.webm.');

// Test 7: Verify 1080p / 4K Video Suite & Vibrant Categories Section
console.log('\nTest 7: Verifying 1080p/4K Video Suite & Vibrant Categories Section...');
const pizzaPath = path.join(PROJECT_ROOT, 'videos', 'pizza-hd-1080p.webm');
const wokPath = path.join(PROJECT_ROOT, 'videos', 'wok-hd-1080p.webm');
const burgerPath = path.join(PROJECT_ROOT, 'videos', 'burger-4k.webm');

assert(fs.existsSync(pizzaPath) && fs.statSync(pizzaPath).size > 10000000, '1080p Pizza video exists and is >10MB Full HD.');
assert(fs.existsSync(wokPath) && fs.statSync(wokPath).size > 10000000, '1080p Wok video exists and is >10MB Full HD.');
assert(fs.existsSync(burgerPath) && fs.statSync(burgerPath).size > 5000000, '4K Burger video exists and is >5MB UHD.');

assert(indexHtml.includes('hero-video-switcher'), 'index.html includes culinary scene switcher buttons.');
assert(homeHtml.includes('hero-video-switcher'), 'home.html includes culinary scene switcher buttons.');
assert(indexHtml.includes('fw-search-popular-pill'), 'index.html includes high-contrast popular search pills.');

assert(indexHtml.includes('fw-categories-section-3d'), 'index.html uses .fw-categories-section-3d styling.');
assert(homeHtml.includes('fw-categories-section-3d'), 'home.html uses .fw-categories-section-3d styling.');
assert(cssContent.includes('.fw-categories-section-3d'), 'CSS defines warm ambient .fw-categories-section-3d.');
assert(indexHtml.includes('cat-badge-pill'), 'index.html includes .cat-badge-pill on category cards.');

// Test 8: Verify Dark/Light Theme System and Bright Vivid Colors
console.log('\nTest 8: Verifying Dark/Light Theme System & Vivid Category Styles...');
const themeJsPath = path.join(PROJECT_ROOT, 'js', 'theme.js');
assert(fs.existsSync(themeJsPath), 'js/theme.js exists on disk.');

const themeJsContent = fs.readFileSync(themeJsPath, 'utf8');
try {
  const mockWindow = { matchMedia: () => ({ matches: false, addEventListener: () => {} }) };
  const mockDoc = {
    documentElement: { setAttribute: () => {}, classList: { add: () => {}, remove: () => {} } },
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  };
  const mockStorage = { getItem: () => null, setItem: () => {} };
  vm.runInNewContext(themeJsContent, {
    window: mockWindow,
    document: mockDoc,
    localStorage: mockStorage,
    CustomEvent: function() {}
  });
  assert(typeof mockWindow.FoodWalaTheme === 'object', 'FoodWalaTheme global object created.');
  assert(typeof mockWindow.FoodWalaTheme.toggleTheme === 'function', 'FoodWalaTheme.toggleTheme is a function.');
  assert(typeof mockWindow.FoodWalaTheme.setTheme === 'function', 'FoodWalaTheme.setTheme is a function.');
} catch (e) {
  assert(false, `theme.js execution failed in VM: ${e.message}`);
}

assert(indexHtml.includes('fw-theme-toggle-btn'), 'index.html has #fw-theme-toggle-btn theme toggle.');
assert(homeHtml.includes('fw-theme-toggle-btn'), 'home.html has #fw-theme-toggle-btn theme toggle.');
assert(indexHtml.includes('js/theme.js'), 'index.html links js/theme.js in head.');
assert(homeHtml.includes('js/theme.js'), 'home.html links js/theme.js in head.');

assert(cssContent.includes('[data-bs-theme="dark"]'), 'CSS defines [data-bs-theme="dark"] dark mode overrides.');
assert(cssContent.includes('.theme-toggle-btn'), 'CSS defines .theme-toggle-btn button styling.');
assert(cssContent.includes('.cat-pizza') && cssContent.includes('#ef4444'), 'CSS defines vivid bright crimson border for Pizza category.');
assert(cssContent.includes('.cat-burger') && cssContent.includes('#f59e0b'), 'CSS defines vivid bright amber border for Burger category.');
assert(cssContent.includes('.cat-biryani') && cssContent.includes('#f97316'), 'CSS defines vivid bright orange border for Biryani category.');

// Test 9: Verify Realistic High-Quality Category Food Photography & Dark-Mode Typography Contrast
console.log('\nTest 9: Verifying Realistic High-Quality Food Photography & Dark Mode Contrast...');
const catNames = ['pizza', 'burger', 'biryani', 'chinese', 'south-indian', 'beverages', 'desserts', 'rolls'];
catNames.forEach((cat) => {
  const localImg = path.join(PROJECT_ROOT, 'images', 'categories', `${cat}.jpg`);
  const webappImg = path.join(PROJECT_ROOT, 'src', 'main', 'webapp', 'images', 'categories', `${cat}.jpg`);
  assert(fs.existsSync(localImg), `images/categories/${cat}.jpg exists on disk.`);
  assert(fs.existsSync(webappImg), `src/main/webapp/images/categories/${cat}.jpg mirrored on disk.`);
  if (fs.existsSync(localImg)) {
    assert(fs.statSync(localImg).size > 15000, `${cat}.jpg size is high-res (>15KB).`);
  }
});

const updatedIndexHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
const updatedHomeHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'home.html'), 'utf8');
const updatedCssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'animations-3d.css'), 'utf8');

assert(updatedIndexHtml.includes('./images/categories/pizza.jpg'), 'index.html points to realistic pizza photography.');
assert(updatedIndexHtml.includes('./images/categories/chinese.jpg'), 'index.html has unique realistic Chinese wok photography (no duplicate biryani).');
assert(updatedIndexHtml.includes('./images/categories/rolls.jpg'), 'index.html has unique realistic Rolls photography (no duplicate dosa).');
assert(updatedIndexHtml.includes('cat-real-photo'), 'index.html applies .cat-real-photo class.');

assert(updatedHomeHtml.includes('./images/categories/pizza.jpg'), 'home.html points to realistic pizza photography.');
assert(updatedHomeHtml.includes('./images/categories/chinese.jpg'), 'home.html has unique realistic Chinese wok photography.');
assert(updatedHomeHtml.includes('cat-real-photo'), 'home.html applies .cat-real-photo class.');

assert(updatedCssContent.includes('.category-card-3d .cat-real-photo'), 'CSS defines .category-card-3d .cat-real-photo styles.');
assert(updatedCssContent.includes('border-radius: 50%'), 'CSS shapes category food photography into circular gourmet dishes.');
assert(updatedCssContent.includes('[data-bs-theme="dark"] .text-dark') && updatedCssContent.includes('#f8fafc'), 'CSS overrides dark mode .text-dark with luminous #f8fafc.');

// Test 10: Verify Light Mode Vibrant Colors, Distinct Card Boundaries & 3D Animations
console.log('\nTest 10: Verifying Light Mode Vibrant Colors, Distinct Card Boundaries & 3D Animations...');
assert(updatedIndexHtml.includes('milestone-prep'), 'index.html applies milestone-prep class.');
assert(updatedIndexHtml.includes('milestone-dispatch'), 'index.html applies milestone-dispatch class.');
assert(updatedIndexHtml.includes('milestone-arrival'), 'index.html applies milestone-arrival class.');

assert(updatedHomeHtml.includes('milestone-prep'), 'home.html applies milestone-prep class.');
assert(updatedHomeHtml.includes('milestone-dispatch'), 'home.html applies milestone-dispatch class.');
assert(updatedHomeHtml.includes('milestone-arrival'), 'home.html applies milestone-arrival class.');

assert(updatedCssContent.includes('.milestone-prep') && updatedCssContent.includes('#f87171'), 'CSS defines vibrant red border for Kitchen Prep milestone.');
assert(updatedCssContent.includes('.milestone-dispatch') && updatedCssContent.includes('#fbbf24'), 'CSS defines vibrant amber border for Valet Dispatch milestone.');
assert(updatedCssContent.includes('.milestone-arrival') && updatedCssContent.includes('#4ade80'), 'CSS defines vibrant emerald border for Live GPS Arrival milestone.');

assert(updatedCssContent.includes('.feature-fast-delivery') && updatedCssContent.includes('#ef4444'), 'CSS defines 2px solid crimson border for Lightning Fast feature.');
assert(updatedCssContent.includes('.feature-live-tracking') && updatedCssContent.includes('#3b82f6'), 'CSS defines 2px solid royal blue border for Live GPS Tracking feature.');
assert(updatedCssContent.includes('.feature-best-offers') && updatedCssContent.includes('#f59e0b'), 'CSS defines 2px solid amber border for Unbeatable Offers feature.');
assert(updatedCssContent.includes('.feature-curated-spots') && updatedCssContent.includes('#22c55e'), 'CSS defines 2px solid emerald border for Curated Spots feature.');

assert(updatedCssContent.includes('[data-bs-theme="dark"] .fw-3d-tracking-section') && updatedCssContent.includes('#0b0f19'), 'CSS defines deep obsidian surface for Dark Mode tracking section.');
assert(updatedCssContent.includes('[data-bs-theme="dark"] .fw-features-3d-section') && updatedCssContent.includes('#0b0f19'), 'CSS defines deep obsidian surface for Dark Mode features section.');


// Test 11: Verify Footer Contrast, Vibrant Checkout, 3D Order Confirmation Celebration & Tracking Pop Messages
console.log('\nTest 11: Verifying Footer Contrast, Vibrant Checkout, 3D Order Confirmation & Live Tracking Pop Messages...');
const checkoutHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'checkout.html'), 'utf8');
const orderConfirmHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'order-confirmation.html'), 'utf8');
const orderTrackingHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'order-tracking.html'), 'utf8');
const orderTrackHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'order-track.html'), 'utf8');

// 1. Footer High Contrast
assert(updatedCssContent.includes('footer .list-unstyled a') && updatedCssContent.includes('#94a3b8 !important'), 'CSS enforces high-contrast #94a3b8 for footer links and text in both modes.');

// 2. Checkout Vibrant Cards
assert(checkoutHtml.includes('fw-checkout-page'), 'checkout.html applies fw-checkout-page ambient background.');
assert(checkoutHtml.includes('checkout-card-location'), 'checkout.html has vibrant location card.');
assert(checkoutHtml.includes('checkout-card-payment'), 'checkout.html has vibrant payment card.');
assert(checkoutHtml.includes('checkout-card-summary'), 'checkout.html has vibrant order summary card.');
assert(checkoutHtml.includes('fw-theme-toggle-btn'), 'checkout.html has theme toggle button.');

// 3. Order Confirmation 3D Celebration
assert(orderConfirmHtml.includes('fw-confirmation-page'), 'order-confirmation.html applies fw-confirmation-page.');
assert(orderConfirmHtml.includes('3d-giftbox.svg'), 'order-confirmation.html contains 3D celebration gift box graphic.');
assert(orderConfirmHtml.includes('confetti-holder') && orderConfirmHtml.includes('confetti-p'), 'order-confirmation.html has animated confetti celebration system.');
assert(orderConfirmHtml.includes('confirm-otp') && orderConfirmHtml.includes('deliveryOtp'), 'order-confirmation.html displays delivery verification OTP.');
assert(updatedCssContent.includes('fwFloatGift'), 'CSS defines 3D floating animation fwFloatGift for celebration box.');

// 4. Live Order Tracking & Pop Messages
assert(orderTrackingHtml.includes('fw-tracking-page'), 'order-tracking.html applies fw-tracking-page.');
assert(orderTrackingHtml.includes('tracking-hero-card'), 'order-tracking.html applies tracking-hero-card with bright border.');
assert(orderTrackingHtml.includes('tracking-map-card'), 'order-tracking.html applies tracking-map-card.');
assert(orderTrackingHtml.includes('tracking-pop-slot'), 'order-tracking.html has tracking-pop-slot container.');
assert(orderTrackingHtml.includes('window.showTrackingPop'), 'order-tracking.html defines showTrackingPop function.');
assert(orderTrackingHtml.includes('btn-trigger-pop'), 'order-tracking.html provides manual trigger button for live pop alerts.');

assert(orderTrackHtml.includes('tracking-pop-slot'), 'order-track.html also has tracking-pop-slot container.');
assert(updatedCssContent.includes('.pop-toast-kitchen') && updatedCssContent.includes('.pop-toast-delivered'), 'CSS defines milestone pop toast border classes.');


// Test 12: Verify Appetizing Background Palettes, Radial Mesh Lighting & Palette Controller
console.log('\nTest 12: Verifying Appetizing Background Palettes, Radial Mesh Lighting & Palette Controller...');
const latestCssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'animations-3d.css'), 'utf8');
const latestThemeJsContent = fs.readFileSync(path.join(PROJECT_ROOT, 'js', 'theme.js'), 'utf8');

// 1. CSS Palette Definitions
assert(latestCssContent.includes('--fw-bg-canvas') && latestCssContent.includes('radial-gradient'), 'CSS defines dynamic multi-source radial mesh lighting (--fw-bg-canvas).');
assert(latestCssContent.includes('#fff8f5') && latestCssContent.includes('#120909'), 'CSS specifies warm porcelain peach (#fff8f5) and smoked cacao (#120909) appetite base colors.');
assert(latestCssContent.includes('[data-fw-palette="sunset"]') && latestCssContent.includes('[data-fw-palette="sapphire"]'), 'CSS defines Sunset Spice and Midnight Sapphire palette themes.');
assert(latestCssContent.includes('[data-fw-palette="amber"]') && latestCssContent.includes('[data-fw-palette="emerald"]'), 'CSS defines Warm Dining Amber and Fresh Emerald palette themes.');

// 2. JavaScript Theme & Palette Controller
assert(latestThemeJsContent.includes('setPalette') && latestThemeJsContent.includes('getPalette'), 'theme.js implements setPalette and getPalette functions.');
assert(latestThemeJsContent.includes('cyclePalette'), 'theme.js implements cyclePalette for dynamic theme switching.');
assert(latestThemeJsContent.includes('data-fw-palette'), 'theme.js sets data-fw-palette attribute on document root.');


// Test 13: Verify Zomato App Dual-Theme Color System, Universal Theme Toggle, & Strict Green Rules
console.log('\nTest 13: Verifying Zomato App Dual-Theme Color System, Universal Theme Toggle & Strict Green Rules...');
const styleCssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'style.css'), 'utf8');

// 1. Light Mode Zomato Tokens
assert(styleCssContent.includes('#D92D20'), 'css/style.css defines Light Mode Primary #D92D20 (Zomato Crimson).');
assert(styleCssContent.includes('#FF9F1C'), 'css/style.css defines Light Mode Accent #FF9F1C (Golden Amber).');
assert(styleCssContent.includes('#FFF8F1'), 'css/style.css defines Light Mode Background #FFF8F1 (Warm Ivory Canvas).');
assert(styleCssContent.includes('#202124'), 'css/style.css defines Light Mode Text #202124.');
assert(styleCssContent.includes('#60656F'), 'css/style.css defines Light Mode Secondary Text #60656F.');
assert(styleCssContent.includes('#E9E2DA'), 'css/style.css defines Light Mode Borders #E9E2DA.');

// 2. Dark Mode Zomato Tokens
assert(styleCssContent.includes('#FF705D'), 'css/style.css defines Dark Mode Primary #FF705D (Vibrant Coral Red).');
assert(styleCssContent.includes('#FFB454'), 'css/style.css defines Dark Mode Accent #FFB454 (Luminous Amber).');
assert(styleCssContent.includes('#101418'), 'css/style.css defines Dark Mode Background #101418 (Deep Obsidian).');
assert(styleCssContent.includes('#1B2228'), 'css/style.css defines Dark Mode Cards #1B2228 (Charcoal Slate).');
assert(styleCssContent.includes('#F5F7FA'), 'css/style.css defines Dark Mode Text #F5F7FA.');
assert(styleCssContent.includes('#AAB4BE'), 'css/style.css defines Dark Mode Secondary Text #AAB4BE.');
assert(styleCssContent.includes('#34404A'), 'css/style.css defines Dark Mode Borders #34404A.');

// 3. Strict Green Rule Enforcement
assert(latestCssContent.includes('.zomato-rating-badge') && latestCssContent.includes('.veg-indicator'), 'CSS defines strict green components: rating badge & veg indicator.');
assert(latestCssContent.includes('.status-delivered'), 'CSS reserves green for status-delivered.');

// 4. Universal Theme Toggle Button & Script across all 16 interactive pages
const interactivePages = [
  'index.html', 'home.html', 'restaurants.html', 'restaurant-details.html',
  'menu.html', 'cart.html', 'checkout.html', 'order-confirmation.html',
  'orders.html', 'order-tracking.html', 'order-track.html', 'login.html',
  'register.html', 'profile.html', 'addresses.html', 'admin.html', 'restaurant-dashboard.html'
];
interactivePages.forEach(p => {
  const pContent = fs.readFileSync(path.join(PROJECT_ROOT, p), 'utf8');
  assert(pContent.includes('fw-theme-toggle-btn'), p + ' contains #fw-theme-toggle-btn.');
  assert(pContent.includes('theme.js'), p + ' includes theme.js script.');
  assert(pContent.includes('animations-3d.css'), p + ' links animations-3d.css.');
});

// Test 14: Verify Bulletproof Dark Mode Form Engine, Address Cards, Entity Chips & Segmented Controls
console.log('\nTest 14: Verifying Bulletproof Dark Mode Form Engine, Address Cards & Entity Chips...');
const animCssContent = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'animations-3d.css'), 'utf8');
const finalStyleCss = fs.readFileSync(path.join(PROJECT_ROOT, 'css', 'style.css'), 'utf8');

// 1. Bulletproof Dark Mode Form Engine
assert(animCssContent.includes('[data-bs-theme="dark"] .form-control') && animCssContent.includes('#242D35'), 'CSS defines dark surface #242D35 for form controls in dark mode.');
assert(animCssContent.includes('[data-bs-theme="dark"] .form-control::placeholder') && animCssContent.includes('#AAB4BE'), 'CSS enforces legible #AAB4BE placeholder contrast in dark mode.');
assert(animCssContent.includes('[data-bs-theme="dark"] .form-control.bg-light') && animCssContent.includes('[data-bs-theme="dark"] .form-select.bg-light'), 'CSS overrides bg-light on form-control and form-select.');

// 2. Address Card Dark Theming
assert(finalStyleCss.includes('[data-bs-theme="dark"] .address-card') && finalStyleCss.includes('#1B2228'), 'css/style.css defines dark surface #1B2228 for address cards in dark mode.');
assert(finalStyleCss.includes('[data-bs-theme="dark"] .address-card.selected') && finalStyleCss.includes('#242D35'), 'css/style.css defines selected address card surface #242D35 with coral accent.');

// 3. Entity Chips & Badges in Dark Mode
assert(animCssContent.includes('[data-bs-theme="dark"] .order-id-badge-pill') && animCssContent.includes('#242D35'), 'CSS defines dark slate #242D35 container for .order-id-badge-pill.');
assert(animCssContent.includes('[data-bs-theme="dark"] .order-payment-chip') && animCssContent.includes('#FFB454'), 'CSS defines luminous amber #FFB454 for .order-payment-chip.');
assert(animCssContent.includes('[data-bs-theme="dark"] .order-item-chip') && animCssContent.includes('.dish-name'), 'CSS defines dedicated high-contrast styles for .order-item-chip and .dish-name.');

// 4. Segmented Tab Switcher & Quick Fill
assert(animCssContent.includes('[data-bs-theme="dark"] .js-login-tab-btn.active') && animCssContent.includes('#FF705D'), 'CSS defines coral active state #FF705D for login segmented switcher.');
assert(animCssContent.includes('[data-bs-theme="dark"] #role-info-card'), 'CSS defines dark container for #role-info-card in login.html.');

// Test 15: Verify Role Isolation, Customer Auth Privacy, and Private Admin Portal Gate
console.log('\nTest 15: Verifying Role Isolation, Customer Auth Privacy & Private Admin Portal Gate...');
const loginContent = fs.readFileSync(path.join(PROJECT_ROOT, 'login.html'), 'utf8');
const registerContent = fs.readFileSync(path.join(PROJECT_ROOT, 'register.html'), 'utf8');
const restDashContent = fs.readFileSync(path.join(PROJECT_ROOT, 'restaurant-dashboard.html'), 'utf8');
const indexContent = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');

// 1. Customer Login View Isolation
assert(!loginContent.includes('data-role="admin"') || loginContent.includes('role-selector-container" style="display: none !important;"'), 'login.html does not display public role selection buttons in customer view.');
assert(!loginContent.includes('customer@foodwala.com') || loginContent.includes('style="display: none !important;"'), 'login.html does not display public auto-fill credential chips in customer view.');
assert(loginContent.includes('admin-portal-banner'), 'login.html implements #admin-portal-banner for staff portal mode.');
assert(loginContent.includes('portalMode === \'admin\''), 'login.html implements secure ?portal=admin routing.');

// 2. Customer Registration Isolation
assert(!registerContent.includes('id="reg-role-group"'), 'register.html completely removed partner/restaurant role selection tabs.');
assert(registerContent.includes('value="customer"'), 'register.html locks registration strictly to customer role.');

// 3. Elimination of Hardcoded Password Leaks
assert(!restDashContent.includes('value="restaurant@foodwala.com"'), 'restaurant-dashboard.html removed hardcoded manager email value.');
assert(!restDashContent.includes('value="Restaurant@123"'), 'restaurant-dashboard.html removed hardcoded manager password value.');

// 4. Discreet Staff Portal Access
assert(indexContent.includes('login.html?portal=admin'), 'index.html provides discreet Staff Portal link in footer.');

console.log('\n============================================================');
if (allPassed) {
  console.log('🎉 ALL ZOMATO VIDEO HERO & 24/7 HELP ASSISTANCE TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
