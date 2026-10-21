const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = 'D:/FoodWala_Eclipse_Project';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`   ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`   ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('🧪 COMPREHENSIVE VERIFICATION: RESTAURANT MANAGER & WHATSAPP');
  console.log('============================================================\n');

  // 1. Static HTML & JS Invariant Verification
  console.log('Test Group 1: restaurant-dashboard.html Invariants...');
  const dashHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'restaurant-dashboard.html'), 'utf8');
  const webappDashHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'src/main/webapp/restaurant-dashboard.html'), 'utf8');

  assert(dashHtml === webappDashHtml, 'restaurant-dashboard.html in root and src/main/webapp/ are 100% identical');

  assert(
    !dashHtml.includes('<h3 class="fw-extrabold text-dark mb-0" id="dash-rest-name">Vidyarthi Bhavan</h3>'),
    'Static template Vidyarthi Bhavan name replaced with generic placeholder'
  );

  // Check adminBar declaration position
  const adminBarPos = dashHtml.indexOf("const adminBar = document.getElementById('super-admin-control-bar');");
  const ifNotAdminPos = dashHtml.indexOf("if (!isAdmin) {");
  assert(adminBarPos !== -1 && ifNotAdminPos !== -1 && adminBarPos < ifNotAdminPos, 'adminBar is declared at function scope BEFORE if (!isAdmin) block');

  // Verify no duplicate const adminBar inside else
  const elseBlock = dashHtml.substring(dashHtml.indexOf("} else {"), dashHtml.indexOf("const restId = currentRestId;"));
  assert(!elseBlock.includes("const adminBar ="), 'No duplicate "const adminBar" in else block (prevents SyntaxError / TDZ bugs)');

  // Verify manager isolation
  assert(
    dashHtml.includes("restSelector.style.setProperty('display', 'none', 'important');"),
    'restSelector is strictly hidden for managers'
  );
  assert(
    dashHtml.includes("adminBar.style.setProperty('display', 'none', 'important');"),
    'adminBar is strictly hidden for managers'
  );

  // 2. Login routing invariant
  console.log('\nTest Group 2: login.html Routing & Manager Store Binding...');
  const loginHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'login.html'), 'utf8');
  const webappLoginHtml = fs.readFileSync(path.join(PROJECT_ROOT, 'src/main/webapp/login.html'), 'utf8');

  assert(loginHtml === webappLoginHtml, 'login.html in root and src/main/webapp/ are 100% identical');
  assert(
    loginHtml.includes('./restaurant-dashboard.html?id=${restId}'),
    'login.html routes restaurant manager directly with their designated store id parameter'
  );

  // 3. WhatsApp & Help Widget Invariants
  console.log('\nTest Group 3: js/help-assistance.js & Customer Pages...');
  const helpJs = fs.readFileSync(path.join(PROJECT_ROOT, 'js/help-assistance.js'), 'utf8');
  const webappHelpJs = fs.readFileSync(path.join(PROJECT_ROOT, 'src/main/webapp/js/help-assistance.js'), 'utf8');

  assert(helpJs === webappHelpJs, 'help-assistance.js in root and src/main/webapp/ are 100% identical');
  assert(helpJs.includes('setWhatsAppTheme'), 'help-assistance.js provides dynamic WhatsApp theme switching');
  assert(helpJs.includes('fw-floating-whatsapp-btn'), 'help-assistance.js injects floating WhatsApp button');
  assert(helpJs.includes('fw-help-chat-messages'), 'help-assistance.js provides interactive in-app live chat');

  // 4. Live Server Endpoints Verification
  console.log('\nTest Group 4: Live Server APIs (Auth, Manager Isolation & AI Assistance)...');
  try {
    // A. Manager Login via Server
    const loginResp = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'kababmagicbasavanagudi@gmail.com', password: 'Password@123' })
    });
    const loginData = await loginResp.json();
    assert(loginData.success === true, 'Kabab Magic manager logs in successfully via /api/auth/login');
    assert(loginData.user && loginData.user.restaurantId === 98, 'Manager user is bound to restaurantId 98 (Kabab Magic)');
    assert(loginData.user && loginData.user.role === 'restaurant', 'Manager user role is "restaurant"');

    const token = loginData.token;

    // B. Manager Restaurant Details via Server
    const detResp = await fetch('http://localhost:5000/api/restaurant/details', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const detData = await detResp.json();
    assert(detData.success === true, 'Manager can fetch their restaurant details via /api/restaurant/details');
    assert(detData.restaurant && detData.restaurant.restaurant_id === 98, 'Fetched restaurant is Kabab Magic (#98)');
    assert(detData.restaurant && detData.restaurant.name.includes('Kabab Magic'), 'Restaurant name is "Kabab Magic - Basavanagudi"');

    // C. Manager Restaurant Menu via Server
    const menuResp = await fetch('http://localhost:5000/api/restaurant/menu', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const menuData = await menuResp.json();
    assert(menuData.success === true, 'Manager can fetch their restaurant menu via /api/restaurant/menu');
    assert(Array.isArray(menuData.menu) && menuData.menu.length > 0, `Kabab Magic menu has ${menuData.menu?.length} dishes`);

    // D. 24/7 Support AI Chat via Server
    const chatResp1 = await fetch('http://localhost:5000/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hi' })
    });
    const chatData1 = await chatResp1.json();
    assert(chatData1.success === true && chatData1.reply.includes('Hello'), 'AI replies instantly to greeting "hi"');

    const chatResp2 = await fetch('http://localhost:5000/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'where is my order' })
    });
    const chatData2 = await chatResp2.json();
    assert(chatData2.success === true && chatData2.reply.includes('order'), 'AI replies instantly to "where is my order" with order tracking');

    const chatResp3 = await fetch('http://localhost:5000/api/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What discount coupons are available?' })
    });
    const chatData3 = await chatResp3.json();
    assert(chatData3.success === true && chatData3.reply.includes('FOODWALA50'), 'AI replies instantly with FOODWALA50 coupon');

    // E. WhatsApp Simulation Endpoint
    const waResp = await fetch('http://localhost:5000/api/whatsapp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9900000098', message: 'where is my order' })
    });
    const waData = await waResp.json();
    assert(waData.success === true && waData.reply.length > 0, 'WhatsApp simulator returns live AI reply');

  } catch (err) {
    assert(false, `Server endpoint test encountered error: ${err.message}`);
  }

  console.log('\n============================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
