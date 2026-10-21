const fs = require('fs');
const path = require('path');

console.log('=== Patching FoodWala Restaurant Manager Auth & Isolation ===');

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_credentials_dump.json'), 'utf8'));
const compactManagers = dump.map(r => ({
  id: r.restaurant_id,
  name: r.name,
  email: r.manager_email.toLowerCase(),
  area: r.area || 'Bengaluru',
  phone: r.phone ? r.phone.replace(/[^0-9]/g, '').slice(-10) : ('99' + String(r.restaurant_id).padStart(8, '0'))
}));

console.log(`Loaded ${compactManagers.length} managers.`);

// 1. Patch mockAdapter.js
function patchMockAdapter(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert ALL_RESTAURANT_MANAGERS before initMockUsers if not present
  if (!content.includes('const ALL_RESTAURANT_MANAGERS =')) {
    const managersDeclaration = `  // FoodWala Enterprise: Registry of all 105 Restaurant Managers
  const ALL_RESTAURANT_MANAGERS = ${JSON.stringify(compactManagers)};

  function findRestaurantManager(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const isEmail = clean.includes('@');
    if (isEmail) {
      const exact = ALL_RESTAURANT_MANAGERS.find(m => m.email.toLowerCase() === clean);
      if (exact) return exact;
      const userPart = clean.split('@')[0].replace(/\\bfoods\\b/g, 'food').replace(/[^a-z0-9]/g, '');
      return ALL_RESTAURANT_MANAGERS.find(m => {
        const mgrPart = m.email.split('@')[0].replace(/\\bfoods\\b/g, 'food').replace(/[^a-z0-9]/g, '');
        return mgrPart === userPart || mgrPart.includes(userPart) || userPart.includes(mgrPart);
      });
    } else {
      const phoneDigits = clean.replace(/[^0-9]/g, '').slice(-10);
      if (phoneDigits) {
        return ALL_RESTAURANT_MANAGERS.find(m => {
          const mPhone = (m.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return mPhone === phoneDigits || ('99' + String(m.id).padStart(8, '0')) === phoneDigits;
        });
      }
    }
    return null;
  }

`;

    content = content.replace('  // Pre-seed mock users if not present\n  function initMockUsers() {', managersDeclaration + '  // Pre-seed mock users if not present\n  function initMockUsers() {');
  }

  // Ensure defaultAccounts includes all 105 restaurant managers in initMockUsers()
  if (!content.includes('for (const mgr of ALL_RESTAURANT_MANAGERS)')) {
    const seedLoop = `
    // Auto-seed all 105 restaurant managers into mock directory
    if (typeof ALL_RESTAURANT_MANAGERS !== 'undefined' && Array.isArray(ALL_RESTAURANT_MANAGERS)) {
      for (const mgr of ALL_RESTAURANT_MANAGERS) {
        defaultAccounts.push({
          userId: 1000 + mgr.id,
          name: mgr.name + ' Manager',
          username: mgr.name + ' Manager',
          email: mgr.email.toLowerCase(),
          phone: mgr.phone ? mgr.phone.replace(/[^0-9]/g, '').slice(-10) : ('99' + String(mgr.id).padStart(8, '0')),
          role: 'restaurant',
          restaurantId: mgr.id,
          restaurant_id: mgr.id,
          restaurantName: mgr.name,
          passwordHash: mockHash('Vishnu@143'),
          address: mgr.area + ', Bengaluru',
          memberSince: 'October 2026',
          failedAttempts: 0,
          lockedUntil: 0
        });
      }
    }
`;
    content = content.replace('    if (!users || !Array.isArray(users) || users.length === 0) {', seedLoop + '    if (!users || !Array.isArray(users) || users.length === 0) {');
  }

  // Ensure merge loop in initMockUsers copies restaurantId and restaurantName
  if (!content.includes('users[idx].restaurantId = def.restaurantId || users[idx].restaurantId;')) {
    content = content.replace(
      'users[idx].role = def.role;',
      'users[idx].role = def.role;\n          users[idx].restaurantId = def.restaurantId || users[idx].restaurantId;\n          users[idx].restaurant_id = def.restaurant_id || users[idx].restaurant_id;\n          users[idx].restaurantName = def.restaurantName || users[idx].restaurantName;'
    );
  }

  // Ensure login() dynamically resolves restaurant managers if not yet in cache
  if (!content.includes('const mgr = findRestaurantManager(cleanEmail || normalizedPhone);')) {
    const dynamicLookupCode = `
      // Dynamic fallback for any of the 105 restaurant managers
      if (userIndex === -1 && (cleanEmail || normalizedPhone) && typeof findRestaurantManager === 'function') {
        const mgr = findRestaurantManager(cleanEmail || normalizedPhone);
        if (mgr) {
          const newMgrUser = {
            userId: 1000 + mgr.id,
            name: mgr.name + ' Manager',
            username: mgr.name + ' Manager',
            email: mgr.email.toLowerCase(),
            phone: mgr.phone ? mgr.phone.replace(/[^0-9]/g, '').slice(-10) : ('99' + String(mgr.id).padStart(8, '0')),
            role: 'restaurant',
            restaurantId: mgr.id,
            restaurant_id: mgr.id,
            restaurantName: mgr.name,
            passwordHash: mockHash('Vishnu@143'),
            address: mgr.area + ', Bengaluru',
            memberSince: 'October 2026',
            failedAttempts: 0,
            lockedUntil: 0
          };
          users.push(newMgrUser);
          userIndex = users.length - 1;
          setLocal(STORAGE_KEYS.MOCK_USERS, users);
        }
      }
`;
    content = content.replace(
      '      // User not found -> Generic error to prevent enumeration\n      if (userIndex === -1) {',
      dynamicLookupCode + '      // User not found -> Generic error to prevent enumeration\n      if (userIndex === -1) {'
    );
  }

  // Ensure safeUser preserves restaurantId, restaurant_id, and restaurantName
  if (!content.includes('restaurantId: user.restaurantId || user.restaurant_id || null,')) {
    content = content.replace(
      "role: user.role || 'customer',",
      "role: user.role || 'customer',\n        restaurantId: user.restaurantId || user.restaurant_id || null,\n        restaurant_id: user.restaurantId || user.restaurant_id || null,\n        restaurantName: user.restaurantName || user.restaurant_name || null,\n        partnerId: user.partnerId || user.partner_id || null,\n        partner_id: user.partnerId || user.partner_id || null,"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched ' + filePath);
}

patchMockAdapter(path.resolve('js/adapters/mockAdapter.js'));
patchMockAdapter(path.resolve('src/main/webapp/js/adapters/mockAdapter.js'));

// 2. Patch server/server.js to ensure Vishnu@143 is in allowedTestPasswords and allowedAdminPasswords
const serverPath = path.resolve('server/server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');
if (!serverContent.includes("'Vishnu@143', 'vishnu@143'")) {
  serverContent = serverContent.replace(
    "const allowedAdminPasswords = ['password', 'admin123', 'Admin123', 'Admin@123', 'admin', '12345678', 'Foodwala123', 'Password@123'];",
    "const allowedAdminPasswords = ['Vishnu@143', 'vishnu@143', 'password', 'admin123', 'Admin123', 'Admin@123', 'admin', '12345678', 'Foodwala123', 'Password@123'];"
  );
  serverContent = serverContent.replace(
    "const allowedTestPasswords = ['Password@123',",
    "const allowedTestPasswords = ['Vishnu@143', 'vishnu@143', 'Password@123',"
  );
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log('✅ Patched server/server.js passwords');
}

// 3. Patch restaurant-dashboard.html
function patchRestaurantDashboard(dashPath) {
  let content = fs.readFileSync(dashPath, 'utf8');

  // A. Hide dropdown & action buttons by default in HTML
  content = content.replace(
    '<select id="restaurant-selector-dropdown" class="form-select form-select-sm rounded-pill fw-semibold border shadow-sm d-none d-sm-inline-block" style="width: auto; min-width: 170px;">',
    '<select id="restaurant-selector-dropdown" class="form-select form-select-sm rounded-pill fw-semibold border shadow-sm" style="width: auto; min-width: 170px; display: none !important;">'
  );
  content = content.replace(
    '<button id="store-status-toggle-btn" class="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm">',
    '<button id="store-status-toggle-btn" class="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm" style="display: none !important;">'
  );
  content = content.replace(
    '<a href="./restaurant-details.html?id=2" id="preview-store-btn" target="_blank" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold">',
    '<a href="./restaurant-details.html?id=2" id="preview-store-btn" target="_blank" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold" style="display: none !important;">'
  );
  content = content.replace(
    '<button id="rest-logout-btn" class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold">',
    '<button id="rest-logout-btn" class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold" style="display: none !important;">'
  );

  // B. Update initRestaurantAuth() to strictly hide all manager/admin controls when !currentUser
  const targetInitAuth = `    function initRestaurantAuth() {
      const currentUser = FoodWalaApp.Auth.getCurrentUser();
      if (!currentUser) {
        document.getElementById('rest-gate').style.display = 'block';
        document.getElementById('rest-dashboard').style.display = 'none';
        const logoutBtn = document.getElementById('rest-logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
        return;
      }`;

  const newInitAuth = `    function initRestaurantAuth() {
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
      }`;

  if (content.includes(targetInitAuth)) {
    content = content.replace(targetInitAuth, newInitAuth);
  }

  // C. In initRestaurantAuth(), when user IS logged in, reveal manager buttons
  content = content.replace(
    `      document.getElementById('rest-gate').style.display = 'none';
      document.getElementById('rest-dashboard').style.display = 'block';
      const logoutBtn = document.getElementById('rest-logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      loadRestaurantDashboard();`,
    `      document.getElementById('rest-gate').style.display = 'none';
      document.getElementById('rest-dashboard').style.display = 'block';
      if (logoutBtn) logoutBtn.style.setProperty('display', 'inline-block', 'important');
      if (storeToggle) storeToggle.style.setProperty('display', 'inline-flex', 'important');
      if (previewBtn) previewBtn.style.setProperty('display', 'inline-block', 'important');
      loadRestaurantDashboard();`
  );

  // D. In loadRestaurantDashboard(), ensure managers can NEVER see other restaurants
  // Manager is STRICTLY locked to their own restaurant
  const targetLoadDash = `        // HIDE restaurant switcher dropdown so managers cannot view or select other stores
        if (restSelector) {
          restSelector.style.setProperty('display', 'none', 'important');
        }`;

  const newLoadDash = `        // STRICT MANAGER ISOLATION: Manager can access ONLY their own restaurant!
        // Restaurant switcher dropdown is permanently HIDDEN from managers
        if (restSelector) {
          restSelector.style.setProperty('display', 'none', 'important');
        }
        if (adminBar) {
          adminBar.style.setProperty('display', 'none', 'important');
        }`;

  if (content.includes(targetLoadDash)) {
    content = content.replace(targetLoadDash, newLoadDash);
  }

  fs.writeFileSync(dashPath, content, 'utf8');
  console.log('✅ Patched ' + dashPath);
}

patchRestaurantDashboard(path.resolve('restaurant-dashboard.html'));
patchRestaurantDashboard(path.resolve('src/main/webapp/restaurant-dashboard.html'));

console.log('=== All files patched successfully! ===');
