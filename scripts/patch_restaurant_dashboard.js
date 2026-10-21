const fs = require('fs');
const path = require('path');

const files = [
  'D:/FoodWala_Eclipse_Project/restaurant-dashboard.html',
  'D:/FoodWala_Eclipse_Project/src/main/webapp/restaurant-dashboard.html'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping missing file:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace static Vidyarthi Bhavan header text
  content = content.replace(
    '<h3 class="fw-extrabold text-dark mb-0" id="dash-rest-name">Vidyarthi Bhavan</h3>',
    '<h3 class="fw-extrabold text-dark mb-0" id="dash-rest-name">Restaurant Kitchen</h3>'
  );
  content = content.replace(
    '<p class="text-muted small mb-1 mt-1" id="dash-rest-cuisine">South Indian, Crispy Dosas, Breakfast Specials</p>',
    '<p class="text-muted small mb-1 mt-1" id="dash-rest-cuisine">Partner Kitchen Hub</p>'
  );

  // 2. Fix adminBar scope error and add defensive manager restaurant ID resolution
  const targetOldBlock = /const restSelector = document\.getElementById\('restaurant-selector-dropdown'\);\s*const roleBadge = document\.getElementById\('partner-role-badge'\);[\s\S]*?const adminBar = document\.getElementById\('super-admin-control-bar'\);\s*if \(adminBar\) adminBar\.style\.display = 'block';\s*\}/m;

  const newBlock = `const restSelector = document.getElementById('restaurant-selector-dropdown');
      const roleBadge = document.getElementById('partner-role-badge');
      const adminBar = document.getElementById('super-admin-control-bar');

      if (!isAdmin) {
        // --- RESTAURANT MANAGER: Strictly bound to their own restaurant ---
        // STRICT MANAGER ISOLATION: Manager can access ONLY their own restaurant!
        let managerRestId = (currentUser && (currentUser.restaurantId || currentUser.restaurant_id)) || null;
        if (!managerRestId && currentUser && currentUser.email) {
          const direct = typeof resolveManagerDirectly === 'function' ? resolveManagerDirectly(currentUser.email) : null;
          if (direct) {
            managerRestId = direct.id;
            currentUser.restaurantId = direct.id;
            currentUser.restaurant_id = direct.id;
            if (!currentUser.restaurantName) currentUser.restaurantName = direct.name;
            try {
              localStorage.setItem('foodwala_current_user', JSON.stringify(currentUser));
              localStorage.setItem('foodwala_user', JSON.stringify(currentUser));
            } catch (e) {}
          }
        }
        if (managerRestId) {
          currentRestId = parseInt(managerRestId, 10);
        } else {
          currentRestId = parseInt(urlParams.get('id') || '98', 10);
        }

        // HIDE restaurant switcher dropdown so managers cannot view or select other stores
        if (restSelector) {
          restSelector.style.setProperty('display', 'none', 'important');
        }
        if (adminBar) {
          adminBar.style.setProperty('display', 'none', 'important');
        }

        // Update Manager badge immediately
        if (roleBadge) {
          const storeName = (currentUser && currentUser.restaurantName) || ('Store #' + currentRestId);
          roleBadge.className = 'badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-bold small d-none d-md-inline-block';
          roleBadge.innerHTML = \`<i class="bi bi-shop me-1"></i> Manager: \${escapeHtml(storeName)}\`;
        }

        // Fast title placeholder sync before async fetch
        if (currentUser && currentUser.restaurantName) {
          const nameElem = document.getElementById('dash-rest-name');
          if (nameElem && (nameElem.textContent === 'Vidyarthi Bhavan' || nameElem.textContent === 'Restaurant Kitchen')) {
            nameElem.textContent = currentUser.restaurantName;
          }
        }

        // URL Tampering Protection: Keep URL synchronized with their store only
        if (urlParams.get('id') && parseInt(urlParams.get('id'), 10) !== currentRestId) {
          window.history.replaceState(null, '', \`./restaurant-dashboard.html?id=\${currentRestId}\`);
        }
      } else {
        // --- SUPER ADMIN: Full Access to All 105 Restaurants ---
        currentRestId = parseInt(urlParams.get('id') || '2', 10) || 2;
        if (restSelector) {
          restSelector.style.setProperty('display', 'inline-block', 'important');
          restSelector.value = currentRestId.toString();
          restSelector.onchange = (e) => {
            window.location.search = '?id=' + e.target.value;
          };
          populateAdminRestaurantDropdown(restSelector, currentRestId);
        }
        if (roleBadge) {
          roleBadge.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-3 py-1 fw-bold small d-none d-md-inline-block';
          roleBadge.innerHTML = \`<i class="bi bi-gear-wide-connected me-1"></i> Super Admin Mode (All 105 Stores)\`;
        }
        if (adminBar) adminBar.style.display = 'block';
      }`;

  if (targetOldBlock.test(content)) {
    content = content.replace(targetOldBlock, newBlock);
    console.log('Successfully patched adminBar and isolation in:', filePath);
  } else {
    console.warn('Could not match targetOldBlock in:', filePath);
  }

  // 3. Update detRes rendering logic
  const oldDetRes = `if (detRes && detRes.success && detRes.restaurant) {
          globalRestaurant = detRes.restaurant;
          renderRestaurantHeader(globalRestaurant);
        }`;
  const newDetRes = `if (detRes && (detRes.success && detRes.restaurant || detRes.restaurant || detRes.id || detRes.name)) {
          globalRestaurant = detRes.restaurant || detRes;
          renderRestaurantHeader(globalRestaurant);
          if (!isAdmin && roleBadge) {
            roleBadge.innerHTML = \`<i class="bi bi-shop me-1"></i> Manager: \${escapeHtml(globalRestaurant.name || ('Store #' + restId))}\`;
          }
        }`;
  content = content.replace(oldDetRes, newDetRes);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', filePath);
});
