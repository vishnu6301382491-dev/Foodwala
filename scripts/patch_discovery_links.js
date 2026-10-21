const fs = require('fs');
const vm = require('vm');

function updateLogin(filePath) {
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Portal Switcher Buttons above card if not present
  const portalSwitcherHtml = `
          <!-- Multi-Portal Quick Switcher -->
          <div class="d-flex justify-content-center gap-1.5 mb-3 p-1 bg-light rounded-pill border">
            <a href="./login.html" class="btn btn-sm rounded-pill px-2.5 py-1 fw-bold text-decoration-none js-portal-link" style="font-size: 0.78rem;">Customer</a>
            <a href="./login.html?portal=partner" class="btn btn-sm rounded-pill px-2.5 py-1 fw-bold text-decoration-none js-portal-link text-warning" style="font-size: 0.78rem;"><i class="bi bi-bicycle me-1"></i>Delivery Hero</a>
            <a href="./login.html?portal=restaurant" class="btn btn-sm rounded-pill px-2.5 py-1 fw-bold text-decoration-none js-portal-link text-danger" style="font-size: 0.78rem;"><i class="bi bi-shop me-1"></i>Manager</a>
            <a href="./login.html?portal=admin" class="btn btn-sm rounded-pill px-2.5 py-1 fw-bold text-decoration-none js-portal-link text-dark" style="font-size: 0.78rem;"><i class="bi bi-shield-lock me-1"></i>Admin</a>
          </div>`;

  const cardTarget = `<div class="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white fw-3d-card position-relative">\n          <div class="fw-3d-shine"></div>`;
  const cardTargetLF = `<div class="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white fw-3d-card position-relative">\r\n          <div class="fw-3d-shine"></div>`;

  content = content.split('\r\n').join('\n');
  if (!content.includes('js-portal-link')) {
    if (content.includes(cardTarget)) {
      content = content.replace(cardTarget, cardTarget + portalSwitcherHtml);
      console.log(`  -> Injected portal switcher buttons in ${filePath}`);
    }
  }

  // 2. Add delivery partner portal mode handling in JS
  const deliveryPortalModeLogic = `      } else if (portalMode === 'partner' || portalMode === 'delivery' || portalMode === 'delivery_partner') {
        selectedRole = 'partner';
        if (loginHeaderTitle) loginHeaderTitle.textContent = 'Delivery Hero Partner Portal';
        if (loginHeaderDesc) loginHeaderDesc.textContent = 'Authorized FoodWala delivery fleet partners only.';
        if (loginIconBox) {
          loginIconBox.style.background = '#0f172a';
          loginIconBox.style.border = '2px solid #ff5200';
        }
        if (loginIcon) loginIcon.className = 'bi bi-bicycle fs-3 text-warning';
        if (adminBanner) {
          adminBanner.style.display = 'block';
          adminBanner.innerHTML = \`<div class="alert alert-warning border border-warning rounded-3 py-2 px-3 small d-flex align-items-center gap-2 mb-0" style="background: rgba(255, 82, 0, 0.1); color: #c2410c;"><i class="bi bi-bicycle fs-4"></i><div><strong>Delivery Hero Console</strong><div class="small">Sign in to start your delivery shift.</div></div></div>\`;
        }
        if (emailLabel) emailLabel.textContent = 'Delivery Partner Email or Phone';
        if (emailInput) emailInput.placeholder = 'deliveryfoodwala@gmail.com';
        if (loginSubmitBtn) loginSubmitBtn.textContent = 'Access Delivery Hero Dashboard';
        if (signupPrompt) {
          signupPrompt.innerHTML = 'Delivery fleet access &bull; <a href="./login.html" class="text-secondary fw-semibold">Customer Sign In</a>';
        }`;

  const restPortalTarget = `} else if (portalMode === 'restaurant') {`;
  if (!content.includes("portalMode === 'partner'")) {
    if (content.includes(restPortalTarget)) {
      content = content.replace(restPortalTarget, deliveryPortalModeLogic + '\n      ' + restPortalTarget);
      console.log(`  -> Added delivery portal mode logic in ${filePath}`);
    }
  }

  content = content.split('\n').join('\r\n');
  fs.writeFileSync(filePath, content, 'utf8');

  // Verify syntax
  const scriptMatch = content.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1], { filename: filePath });
      console.log(`  ✅ SYNTAX CHECK PASSED for ${filePath}`);
    } catch (err) {
      console.error(`  ❌ SYNTAX ERROR in ${filePath}:`, err.message);
      process.exit(1);
    }
  }
}

function updateIndex(filePath) {
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.split('\r\n').join('\n');

  // 1. Add Delivery Hero button in navbar next to 24/7 Help
  const helpBtnTarget = `<li class="nav-item">
            <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 js-open-247-help" title="FoodWala 24/7 Customer Help Assistance">
              <i class="bi bi-headset fs-6 text-danger"></i>
              <span>24/7 Help</span>
            </button>
          </li>`;

  const heroNavAddition = `\n          <li class="nav-item">
            <a class="btn btn-outline-warning text-dark btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" href="./delivery-dashboard.html" title="FoodWala Delivery Partner Hero Portal">
              <i class="bi bi-bicycle text-danger"></i>
              <span>Delivery Hero</span>
            </a>
          </li>`;

  if (!content.includes('href="./delivery-dashboard.html"')) {
    if (content.includes(helpBtnTarget)) {
      content = content.replace(helpBtnTarget, helpBtnTarget + heroNavAddition);
      console.log(`  -> Injected Delivery Hero button in navbar in ${filePath}`);
    }
  }

  // 2. Add Delivery Hero link in footer
  const staffPortalTarget = `<li><a href="./login.html?portal=admin" class="text-muted text-decoration-none hover-light"><i class="bi bi-shield-lock me-1"></i>Staff Portal</a></li>`;
  const footerAdditions = `\n            <li><a href="./delivery-dashboard.html" class="text-warning text-decoration-none hover-light fw-bold"><i class="bi bi-bicycle me-1"></i>Delivery Hero Portal</a></li>\n            <li><a href="./restaurant-dashboard.html" class="text-muted text-decoration-none hover-light"><i class="bi bi-shop me-1"></i>Restaurant Manager</a></li>`;

  if (!content.includes('Delivery Hero Portal</a></li>')) {
    if (content.includes(staffPortalTarget)) {
      content = content.replace(staffPortalTarget, staffPortalTarget + footerAdditions);
      console.log(`  -> Injected Delivery Hero link in footer in ${filePath}`);
    }
  }

  content = content.split('\n').join('\r\n');
  fs.writeFileSync(filePath, content, 'utf8');

  // Verify syntax
  const scriptMatch = content.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1], { filename: filePath });
      console.log(`  ✅ SYNTAX CHECK PASSED for ${filePath}`);
    } catch (err) {
      console.error(`  ❌ SYNTAX ERROR in ${filePath}:`, err.message);
      process.exit(1);
    }
  }
}

updateLogin('D:/FoodWala_Eclipse_Project/login.html');
updateLogin('D:/FoodWala_Eclipse_Project/src/main/webapp/login.html');

updateIndex('D:/FoodWala_Eclipse_Project/index.html');
updateIndex('D:/FoodWala_Eclipse_Project/src/main/webapp/index.html');
