const fs = require('fs');

function fixFile(p) {
  let c = fs.readFileSync(p, 'utf8');

  // 1. initRestaurantAuth
  const oldInitRegex = /function initRestaurantAuth\(\)\s*\{[\s\S]*?loadRestaurantDashboard\(\);\s*\}/;
  const newInit = `function initRestaurantAuth() {
      const currentUser = FoodWalaApp.Auth.getCurrentUser();
      const restSelector = document.getElementById('restaurant-selector-dropdown');
      const storeToggle = document.getElementById('store-status-toggle-btn');
      const previewBtn = document.getElementById('preview-store-btn');
      const logoutBtn = document.getElementById('rest-logout-btn');
      const roleBadge = document.getElementById('partner-role-badge');
      const adminBar = document.getElementById('super-admin-control-bar');

      if (!currentUser) {
        document.getElementById('rest-gate').style.display = 'block';
        document.getElementById('rest-dashboard').style.display = 'none';
        if (adminBar) adminBar.style.setProperty('display', 'none', 'important');
        // STRICT ISOLATION: NEVER display restaurant switcher or store controls to unauthenticated visitors
        if (restSelector) restSelector.style.setProperty('display', 'none', 'important');
        if (storeToggle) storeToggle.style.setProperty('display', 'none', 'important');
        if (previewBtn) previewBtn.style.setProperty('display', 'none', 'important');
        if (logoutBtn) logoutBtn.style.setProperty('display', 'none', 'important');
        if (roleBadge) roleBadge.classList.add('d-none');
        return;
      }

      const role = (currentUser.role || '').toLowerCase();
      if (role !== 'restaurant' && role !== 'admin' && role !== 'restaurant_admin' && role !== 'manager') {
        FoodWalaApp.showToast('Access denied: Restaurant Manager role required.', 'danger');
        window.location.replace('./login.html');
        return;
      }

      document.getElementById('rest-gate').style.display = 'none';
      document.getElementById('rest-dashboard').style.display = 'block';
      if (logoutBtn) logoutBtn.style.setProperty('display', 'inline-block', 'important');
      if (storeToggle) storeToggle.style.setProperty('display', 'inline-flex', 'important');
      if (previewBtn) previewBtn.style.setProperty('display', 'inline-block', 'important');
      loadRestaurantDashboard();
    }`;

  if (oldInitRegex.test(c)) {
    c = c.replace(oldInitRegex, newInit);
  }

  // 2. loadRestaurantDashboard manager isolation
  const oldMgrRegex = /\/\/\s*---\s*RESTAURANT MANAGER: Strictly bound to their own restaurant[\s\S]*?\/\/\s*Update Manager badge/;
  const newMgr = `// --- RESTAURANT MANAGER: Strictly bound to their own restaurant ---
        // STRICT MANAGER ISOLATION: Manager can access ONLY their own restaurant!
        let managerRestId = (currentUser && (currentUser.restaurantId || currentUser.restaurant_id)) || null;
        if (managerRestId) {
          currentRestId = parseInt(managerRestId, 10);
        } else {
          currentRestId = parseInt(urlParams.get('id') || '7', 10);
        }

        // HIDE restaurant switcher dropdown so managers cannot view or select other stores
        if (restSelector) {
          restSelector.style.setProperty('display', 'none', 'important');
        }
        if (adminBar) {
          adminBar.style.setProperty('display', 'none', 'important');
        }

        // Update Manager badge`;

  if (oldMgrRegex.test(c)) {
    c = c.replace(oldMgrRegex, newMgr);
  }

  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed', p);
}

fixFile('restaurant-dashboard.html');
fixFile('src/main/webapp/restaurant-dashboard.html');
