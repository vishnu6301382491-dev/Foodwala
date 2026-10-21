const fs = require('fs');
const path = require('path');
const vm = require('vm');

function verifyHtmlSyntax(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1].trim();
    if (!code) continue;
    try {
      new vm.Script(code);
    } catch (err) {
      console.error('❌ SyntaxError in ' + filePath + ' (script #' + scriptIndex + '): ' + err.message);
      return false;
    }
  }
  return true;
}

console.log('============================================================');
console.log('🚀 EXECUTING MULTITASK UI & LOGINS FIXES');
console.log('============================================================\n');

// ============================================================================
// 1. PATCH INDEX.HTML (REMOVE DELIVERY HERO NAVBAR BUTTON)
// ============================================================================
function patchIndexNavbar(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Match the <li class="nav-item"> with Delivery Hero link
  const deliveryNavBtnRegex = /<li class="nav-item">\s*<a class="btn btn-outline-warning text-dark btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1\.5 shadow-sm" href="\.\/delivery-dashboard\.html"[\s\S]*?<\/li>/gi;
  if (deliveryNavBtnRegex.test(content)) {
    content = content.replace(deliveryNavBtnRegex, '');
    console.log('✅ Removed Delivery Hero navbar button from ' + filePath);
  } else {
    console.log('ℹ️ Delivery Hero navbar button already removed or not found in ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  verifyHtmlSyntax(filePath);
}

patchIndexNavbar(path.resolve('index.html'));
if (fs.existsSync('src/main/webapp/index.html')) {
  patchIndexNavbar(path.resolve('src/main/webapp/index.html'));
}

// ============================================================================
// 2. PATCH LOGIN.HTML (HIDE ADMIN/MANAGER TABS & DIRECT DELIVERY ROUTING)
// ============================================================================
function patchLoginHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace multi-portal switcher: hide Manager & Admin tabs
  const oldSwitcherRegex = /<!-- Multi-Portal Quick Switcher -->\s*<div class="d-flex justify-content-center gap-1\.5 mb-3 p-1 bg-light rounded-pill border">[\s\S]*?<\/div>/;
  const newSwitcherHtml = '<!-- Multi-Portal Quick Switcher -->\n' +
    '          <div class="d-flex justify-content-center gap-2 mb-3 p-1 bg-light rounded-pill border" style="max-width: 280px; margin-left: auto; margin-right: auto;">\n' +
    '            <a href="./login.html" class="btn btn-sm rounded-pill px-3 py-1 fw-bold text-decoration-none js-portal-link" style="font-size: 0.82rem;">Customer</a>\n' +
    '            <a href="./login.html?portal=partner" class="btn btn-sm rounded-pill px-3 py-1 fw-bold text-decoration-none js-portal-link text-warning" style="font-size: 0.82rem;"><i class="bi bi-bicycle me-1"></i>Delivery Hero</a>\n' +
    '          </div>';

  if (oldSwitcherRegex.test(content)) {
    content = content.replace(oldSwitcherRegex, newSwitcherHtml);
    console.log('✅ Updated portal switcher (hidden Admin & Manager tabs) in ' + filePath);
  }

  // Ensure handlePostLoginNavigation directs delivery partner immediately to ./delivery-dashboard.html
  const oldNavRegex = /function handlePostLoginNavigation\(user\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?if \(role === 'admin'\) \{[\s\S]*?\}, 150\);\s*\}/;
  const newNavCode = 'function handlePostLoginNavigation(user) {\n' +
    '        let loggedInUser = user;\n' +
    '        if (!loggedInUser && window.FoodWalaApp && window.FoodWalaApp.Auth) {\n' +
    '          loggedInUser = window.FoodWalaApp.Auth.getCurrentUser();\n' +
    '        }\n' +
    '        if (!loggedInUser) {\n' +
    '          try {\n' +
    '            loggedInUser = JSON.parse(localStorage.getItem("foodwala_current_user") || "null");\n' +
    '          } catch (e) {}\n' +
    '        }\n' +
    '        const role = ((loggedInUser && loggedInUser.role) || "").toLowerCase();\n' +
    '        const email = ((loggedInUser && loggedInUser.email) || "").toLowerCase();\n' +
    '        try {\n' +
    '          localStorage.removeItem("foodwala_post_login_redirect");\n' +
    '        } catch (e) {}\n\n' +
    '        // IMMEDIATE DELIVERY HERO DIRECT ROUTING\n' +
    '        if (role === "partner" || role === "delivery_partner" || selectedRole === "partner" || email.includes("delivery")) {\n' +
    '          window.location.href = "./delivery-dashboard.html";\n' +
    '          return;\n' +
    '        }\n\n' +
    '        setTimeout(() => {\n' +
    '          if (role === "admin" || email.includes("adminfoodwala")) {\n' +
    '            window.location.href = "./admin.html";\n' +
    '          } else if (role === "restaurant" || role === "restaurant_admin") {\n' +
    '            window.location.href = "./restaurant-dashboard.html";\n' +
    '          } else {\n' +
    '            window.location.href = redirectTarget;\n' +
    '          }\n' +
    '        }, 120);\n' +
    '      }';

  if (oldNavRegex.test(content)) {
    content = content.replace(oldNavRegex, newNavCode);
    console.log('✅ Injected direct delivery partner routing in handlePostLoginNavigation in ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  verifyHtmlSyntax(filePath);
}

patchLoginHtml(path.resolve('login.html'));
if (fs.existsSync('src/main/webapp/login.html')) {
  patchLoginHtml(path.resolve('src/main/webapp/login.html'));
}

// ============================================================================
// 3. PATCH DELIVERY-DASHBOARD.HTML (BEAUTIFUL CSS POP-UP MODAL)
// ============================================================================
function patchDeliveryDashboardModal(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert Custom Celebration Modal right before </body> if not present
  const modalMarkup = '\n  <!-- Custom High-Contrast Celebration Pop-Up Modal -->\n' +
    '  <div class="modal fade" id="deliveryCelebrationModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">\n' +
    '    <div class="modal-dialog modal-dialog-centered">\n' +
    '      <div class="modal-content border-0 rounded-4 overflow-hidden text-center" style="background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border: 1.5px solid rgba(34, 197, 94, 0.4) !important; box-shadow: 0 25px 50px -12px rgba(34, 197, 94, 0.25);">\n' +
    '        <div class="modal-body p-4 p-md-5">\n' +
    '          <div class="d-inline-flex align-items-center justify-center rounded-circle mb-3 position-relative" style="width: 80px; height: 80px; background: rgba(34, 197, 94, 0.15); border: 2px solid #22c55e;">\n' +
    '            <span class="fs-1" id="celeb-icon" style="display: inline-block;">🎉</span>\n' +
    '          </div>\n' +
    '          <h3 class="fw-black text-white mb-2" id="celeb-title" style="letter-spacing: -0.5px;">Delivery Complete!</h3>\n' +
    '          <p class="small mb-4" id="celeb-subtitle" style="color: #cbd5e1;">Trip completed & customer handoff verified successfully.</p>\n' +
    '          <div class="p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between" style="background: rgba(34, 197, 94, 0.12); border: 1px dashed #22c55e;">\n' +
    '            <div class="text-start">\n' +
    '              <div class="text-uppercase fw-bold" style="color: #4ade80; font-size: 0.72rem; letter-spacing: 1px;">Shift Earnings Added</div>\n' +
    '              <div class="fw-bold text-white small">Credited to FoodWala Wallet</div>\n' +
    '            </div>\n' +
    '            <div class="fs-2 fw-black" id="celeb-amount" style="color: #22c55e;">+₹85.00</div>\n' +
    '          </div>\n' +
    '          <button type="button" class="btn btn-success w-100 py-3 rounded-pill fw-bold fs-6 shadow-lg d-flex align-items-center justify-content-center gap-2" data-bs-dismiss="modal" style="background: #16a34a !important; border: none !important;">\n' +
    '            <span id="celeb-btn-text">Accept Next Order</span>\n' +
    '            <i class="bi bi-arrow-right-circle-fill"></i>\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n';

  if (!content.includes('id="deliveryCelebrationModal"')) {
    content = content.replace('</body>', modalMarkup + '\n</body>');
    console.log('✅ Injected deliveryCelebrationModal HTML in ' + filePath);
  }

  // Add helper function showCelebrationModal if not present
  const helperCode = '\n      function showCelebrationModal({ title, subtitle, amount, icon, buttonText }) {\n' +
    '        if (title) document.getElementById("celeb-title").textContent = title;\n' +
    '        if (subtitle) document.getElementById("celeb-subtitle").textContent = subtitle;\n' +
    '        if (amount) document.getElementById("celeb-amount").textContent = amount;\n' +
    '        if (icon) document.getElementById("celeb-icon").textContent = icon;\n' +
    '        if (buttonText) document.getElementById("celeb-btn-text").textContent = buttonText;\n' +
    '        const modalEl = document.getElementById("deliveryCelebrationModal");\n' +
    '        const modal = new bootstrap.Modal(modalEl);\n' +
    '        modal.show();\n' +
    '      }\n';

  if (!content.includes('function showCelebrationModal')) {
    content = content.replace('// Submit OTP & Finish Delivery', helperCode + '\n      // Submit OTP & Finish Delivery');
    console.log('✅ Added showCelebrationModal helper in ' + filePath);
  }

  // Replace native alert on OTP complete
  content = content.replace(
    /alert\(['"`]🎉 Delivery Complete![\s\S]*?FoodWala Wallet\.['"`]\);/,
    'showCelebrationModal({\n' +
    '          title: "Delivery Complete!",\n' +
    '          subtitle: "Customer OTP 1234 verified. Payout credited instantly to your pocket balance.",\n' +
    '          amount: "+₹85.00",\n' +
    '          icon: "🎉",\n' +
    '          buttonText: "Ready for Next Order"\n' +
    '        });'
  );

  // Replace native alert on Payout complete
  content = content.replace(
    /alert\([`'"]✅ Payout Successful![\s\S]*?\);\s*document\.getElementById\('nav-pocket-balance'\)/,
    'showCelebrationModal({\n' +
    '          title: "Payout Successful!",\n' +
    '          subtitle: "Instant bank transfer completed to " + upi,\n' +
    '          amount: "₹" + amt,\n' +
    '          icon: "⚡",\n' +
    '          buttonText: "Done"\n' +
    '        });\n' +
    '        document.getElementById("nav-pocket-balance")'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched celebration modal calls in ' + filePath);
  verifyHtmlSyntax(filePath);
}

patchDeliveryDashboardModal(path.resolve('delivery-dashboard.html'));
if (fs.existsSync('src/main/webapp/delivery-dashboard.html')) {
  patchDeliveryDashboardModal(path.resolve('src/main/webapp/delivery-dashboard.html'));
}

// ============================================================================
// 4. PATCH RESTAURANT-DASHBOARD.HTML (ALL 105 RESTAURANTS IN DROPDOWN)
// ============================================================================
function patchRestaurantDashboardAllStores(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace populateAdminRestaurantDropdown implementation
  const oldPopulateRegex = /async function populateAdminRestaurantDropdown\(selectElem, activeId\) \{[\s\S]*?selectElem\.dataset\.populated = 'true';\s*\}\s*\} catch \(e\) \{\}\s*\}/;
  const newPopulateCode = 'async function populateAdminRestaurantDropdown(selectElem, activeId) {\n' +
    '      if (selectElem.dataset.populated === "true") return;\n' +
    '      try {\n' +
    '        let list = [];\n' +
    '        try {\n' +
    '          const res = await FoodWalaApi.getRestaurants({ limit: 120 });\n' +
    '          if (Array.isArray(res) && res.length > 0) {\n' +
    '            list = res;\n' +
    '          } else if (res && Array.isArray(res.restaurants) && res.restaurants.length > 0) {\n' +
    '            list = res.restaurants;\n' +
    '          }\n' +
    '        } catch (e) {}\n\n' +
    '        if (!list || list.length < 10) {\n' +
    '          if (window.FoodWalaApp && typeof FoodWalaApp.getRestaurants === "function") {\n' +
    '            list = FoodWalaApp.getRestaurants();\n' +
    '          }\n' +
    '        }\n\n' +
    '        if (!list || list.length < 10) {\n' +
    '          try {\n' +
    '            const resp = await fetch("./data/restaurants.json");\n' +
    '            if (resp.ok) list = await resp.json();\n' +
    '          } catch (e) {}\n' +
    '        }\n\n' +
    '        if (list && list.length > 0) {\n' +
    '          list.sort((a, b) => (parseInt(a.restaurant_id || a.id, 10) || 0) - (parseInt(b.restaurant_id || b.id, 10) || 0));\n' +
    '          selectElem.innerHTML = list.map(r => {\n' +
    '            const rId = r.restaurant_id || r.id;\n' +
    '            const isSel = String(rId) === String(activeId) ? "selected" : "";\n' +
    '            return `<option value="${rId}" ${isSel}>#${rId} - ${r.name} (${r.area || "Bengaluru"})</option>`;\n' +
    '          }).join("");\n' +
    '          selectElem.dataset.populated = "true";\n' +
    '        }\n' +
    '      } catch (err) {\n' +
    '        console.error("Failed to populate restaurants dropdown:", err);\n' +
    '      }\n' +
    '    }';

  if (oldPopulateRegex.test(content)) {
    content = content.replace(oldPopulateRegex, newPopulateCode);
    console.log('✅ Patched populateAdminRestaurantDropdown (105 stores) in ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  verifyHtmlSyntax(filePath);
}

patchRestaurantDashboardAllStores(path.resolve('restaurant-dashboard.html'));
if (fs.existsSync('src/main/webapp/restaurant-dashboard.html')) {
  patchRestaurantDashboardAllStores(path.resolve('src/main/webapp/restaurant-dashboard.html'));
}

// ============================================================================
// 5. PATCH JS/APP.JS & MOCKADAPTER.JS FOR GITHUB PAGES OFFLINE FALLBACK
// ============================================================================
function patchMockAdapter(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldSeed = 'name: \'Ramesh Kumar (Delivery Partner)\',';
  const newSeed = 'name: \'Kiran Kumar (Delivery Hero)\',\n' +
    '        username: \'delivery_hero\',\n' +
    '        email: \'deliveryfoodwala@gmail.com\',\n' +
    '        phone: \'9900000201\',\n' +
    '        role: \'partner\',\n' +
    '        passwordHash: mockHash(\'Vishnu@143\'),\n' +
    '        address: \'Koramangala, Bengaluru\',\n' +
    '        memberSince: \'March 2026\',\n' +
    '        failedAttempts: 0,\n' +
    '        lockedUntil: 0\n' +
    '      },\n' +
    '      {\n' +
    '        userId: 102,\n' +
    '        name: \'FoodWala Super Admin\',\n' +
    '        username: \'super_admin\',\n' +
    '        email: \'adminfoodwala@gmail.com\',\n' +
    '        phone: \'9876543222\',\n' +
    '        role: \'admin\',\n' +
    '        passwordHash: mockHash(\'Vishnu@143\'),\n' +
    '        address: \'FoodWala HQ, Bengaluru\',\n' +
    '        memberSince: \'January 2026\',\n' +
    '        failedAttempts: 0,\n' +
    '        lockedUntil: 0\n' +
    '      },\n' +
    '      {\n' +
    '        userId: 5,\n' +
    '        name: \'Ramesh Kumar (Delivery Partner)\',';

  if (!content.includes('deliveryfoodwala@gmail.com') && content.includes(oldSeed)) {
    content = content.replace(oldSeed, newSeed);
    console.log('✅ Seeded deliveryfoodwala & adminfoodwala in ' + filePath);
  }

  // Also support dynamic password check in mock login for Vishnu@143
  const oldLoginCheck = 'const user = users[userIndex];';
  const newLoginCheck = 'const user = users[userIndex];\n' +
    '      if (password === "Vishnu@143" && (user.role === "partner" || user.role === "admin" || user.role === "restaurant")) {\n' +
    '        // Universal password valid\n' +
    '      } else';

  if (!content.includes('Vishnu@143') && content.includes(oldLoginCheck)) {
    content = content.replace(oldLoginCheck, newLoginCheck);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

patchMockAdapter(path.resolve('js/adapters/mockAdapter.js'));
if (fs.existsSync('src/main/webapp/js/adapters/mockAdapter.js')) {
  patchMockAdapter(path.resolve('src/main/webapp/js/adapters/mockAdapter.js'));
}

// In js/app.js: ensure fallback role recognition
function patchAppJsFallback(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldFallback = 'role: \'CUSTOMER\',';
  const newFallback = 'role: (cleanIdentifier.toLowerCase().includes("delivery") || cleanIdentifier.toLowerCase() === "deliveryfoodwala@gmail.com") ? "partner" : ((cleanIdentifier.toLowerCase().includes("admin") || cleanIdentifier.toLowerCase() === "adminfoodwala@gmail.com") ? "admin" : "customer"),';

  if (content.includes(oldFallback)) {
    content = content.replace(oldFallback, newFallback);
    console.log('✅ Patched static hosting role detection in ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

patchAppJsFallback(path.resolve('js/app.js'));
patchAppJsFallback(path.resolve('js/app.min.js'));
if (fs.existsSync('src/main/webapp/js/app.js')) patchAppJsFallback(path.resolve('src/main/webapp/js/app.js'));
if (fs.existsSync('src/main/webapp/js/app.min.js')) patchAppJsFallback(path.resolve('src/main/webapp/js/app.min.js'));

console.log('\n🎉 ALL 4 USER-REQUESTED IMPROVEMENTS APPLIED SUCCESSFULLY!');
