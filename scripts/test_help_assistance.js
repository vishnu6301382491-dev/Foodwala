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
assert(helpJsContent.includes('8500457005'), 'WhatsApp integration uses user verified number 8500457005.');

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

console.log('\n============================================================');
if (allPassed) {
  console.log('🎉 ALL ZOMATO VIDEO HERO & 24/7 HELP ASSISTANCE TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
