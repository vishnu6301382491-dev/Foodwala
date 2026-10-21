const fs = require('fs');
const vm = require('vm');

function fixRestaurantDashboard(filePath) {
  console.log(`Fixing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove duplicate const restSelector declaration
  const oldSnippet = `      const restId = currentRestId;
      const previewBtn = document.getElementById('preview-store-btn');
      if (previewBtn) {
        previewBtn.href = \`./restaurant-details.html?id=\${restId}\`;
      }
      const restSelector = document.getElementById('restaurant-selector-dropdown');
      if (restSelector) {
        restSelector.value = restId.toString();
        restSelector.onchange = (e) => {
          window.location.search = '?id=' + e.target.value;
        };
      }`;

  const newSnippet = `      const restId = currentRestId;
      const previewBtn = document.getElementById('preview-store-btn');
      if (previewBtn) {
        previewBtn.href = \`./restaurant-details.html?id=\${restId}\`;
      }
      if (restSelector && isAdmin) {
        restSelector.value = restId.toString();
      }`;

  content = content.split('\r\n').join('\n');
  if (content.includes(oldSnippet)) {
    content = content.replace(oldSnippet, newSnippet);
    console.log(`  -> Successfully removed duplicate restSelector in ${filePath}`);
  } else {
    console.warn(`  ⚠️ oldSnippet not found directly in ${filePath}`);
  }

  // Add Super Admin Control Bar banner in the HTML if not present
  if (!content.includes('id="super-admin-control-bar"')) {
    const headerEnd = `</header>`;
    const adminBanner = `
  <!-- Super Admin Omnipotent Control Bar (visible only to Admin) -->
  <div id="super-admin-control-bar" class="py-2.5 px-4 shadow-sm" style="display: none; background: #2d1848; color: #f3e8ff; border-bottom: 2px solid #a855f7;">
    <div class="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div class="d-flex align-items-center gap-2">
        <span class="fs-5">👑</span>
        <span class="fw-bold fs-6">SUPER ADMIN CONTROL:</span>
        <span class="badge bg-warning text-dark fw-bold">Full Omnipotent Store Management Active</span>
        <small class="text-white-50 d-none d-lg-inline">Add/Edit Dishes, Modify Pricing, Toggle Stock, Dispatch Orders</small>
      </div>
      <div class="d-flex align-items-center gap-2">
        <a href="./admin.html" class="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold">
          <i class="bi bi-arrow-left me-1"></i> Admin Portal
        </a>
        <a href="./delivery-dashboard.html" class="btn btn-sm btn-outline-warning rounded-pill px-3 fw-bold">
          <i class="bi bi-bicycle me-1"></i> Delivery Hero
        </a>
      </div>
    </div>
  </div>`;
    
    content = content.replace(headerEnd, headerEnd + adminBanner);
    console.log(`  -> Injected Super Admin Control Bar in ${filePath}`);
  }

  // Ensure banner displays when user is admin
  const showBannerSnippet = `        if (roleBadge) {
          roleBadge.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-1 fw-bold small d-none d-md-inline-block';
          roleBadge.innerHTML = \`<i class="bi bi-gear-wide-connected me-1"></i> Super Admin Mode (All 105 Stores)\`;
        }`;

  const enhancedShowBanner = `        if (roleBadge) {
          roleBadge.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-1 fw-bold small d-none d-md-inline-block';
          roleBadge.innerHTML = \`<i class="bi bi-gear-wide-connected me-1"></i> Super Admin Mode (All 105 Stores)\`;
        }
        const adminBar = document.getElementById('super-admin-control-bar');
        if (adminBar) adminBar.style.display = 'block';`;

  if (content.includes(showBannerSnippet)) {
    content = content.replace(showBannerSnippet, enhancedShowBanner);
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

function updateAdminHtml(filePath) {
  console.log(`Updating ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  const oldNav = `<a href="./index.html" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold">
          <i class="bi bi-arrow-left me-1"></i> Storefront
        </a>`;

  const newNav = `<a href="./restaurant-dashboard.html" class="btn btn-sm btn-warning text-dark rounded-pill px-3 fw-bold shadow-sm">
          <i class="bi bi-shop me-1"></i> Manager Dashboard
        </a>
        <a href="./delivery-dashboard.html" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold">
          <i class="bi bi-bicycle me-1"></i> Delivery Hero
        </a>
        <a href="./index.html" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold">
          <i class="bi bi-arrow-left me-1"></i> Storefront
        </a>`;

  content = content.split('\r\n').join('\n');
  if (content.includes(oldNav)) {
    content = content.replace(oldNav, newNav);
    console.log(`  -> Added Manager Dashboard & Delivery Hero quick links to ${filePath}`);
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

fixRestaurantDashboard('D:/FoodWala_Eclipse_Project/restaurant-dashboard.html');
fixRestaurantDashboard('D:/FoodWala_Eclipse_Project/src/main/webapp/restaurant-dashboard.html');

updateAdminHtml('D:/FoodWala_Eclipse_Project/admin.html');
updateAdminHtml('D:/FoodWala_Eclipse_Project/src/main/webapp/admin.html');
