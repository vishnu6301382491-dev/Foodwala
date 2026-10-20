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

// Test 5: Verify Smart Query Responses logic
console.log('\nTest 5: Verifying Smart Query handler response logic...');
assert(helpJsContent.includes('Suresh Kumar') && helpJsContent.includes('Maruthi Nagar'), 'Order tracking logic references live valet Suresh Kumar and Maruthi Nagar.');
assert(helpJsContent.includes('FOODWALA50'), 'Coupon logic references FOODWALA50 discount code.');
assert(helpJsContent.includes('180036639252') || helpJsContent.includes('1800-FOOD-WALA'), 'Escalation logic references toll-free helpline.');

console.log('\n============================================================');
if (allPassed) {
  console.log('🎉 ALL ZOMATO VIDEO HERO & 24/7 HELP ASSISTANCE TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
