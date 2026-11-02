const fs = require('fs');
const path = require('path');

const projectRoot = 'D:/FoodWala_Eclipse_Project';
const webappRoot = 'D:/FoodWala_Eclipse_Project/src/main/webapp';

console.log('Applying comprehensive cart/login fix across project root and src/main/webapp...');

// 1. UPDATE checkout.html
function updateCheckout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace script tags with fresh cache busters
  content = content.replace(/src="\.\/js\/app\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/api\.js(?:\?v=[^"]*)?"/g, 'src="./js/api.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/ui\.js(?:\?v=[^"]*)?"/g, 'src="./js/ui.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/config\.js(?:\?v=[^"]*)?"/g, 'src="./js/config.js?v=20261102_02"');

  // Find the initialization script in checkout.html
  // Replace the Section 0 & Section 1 logic with cart-first validation and proper redirect clearing
  const oldBlockRegex = /\/\/ --- SECTION 0: Top-Level Authentication[\s\S]*?\/\/ Resolve real restaurant name and address/g;

  const newBlock = `// --- SECTION 1: Cart Validation & Restaurant Resolution ---
      let cart = FoodWalaApp.Cart.getCart();
      const cartItems = (cart && Array.isArray(cart.items)) ? cart.items : (FoodWalaApp.Cart.getItems ? FoodWalaApp.Cart.getItems() : []);
      if (!cart || cartItems.length === 0) {
        try {
          localStorage.removeItem('foodwala_post_login_redirect');
        } catch (e) {}
        if (window.FoodWalaApp && FoodWalaApp.showToast) {
          FoodWalaApp.showToast('Your cart is empty. Please add items from a restaurant.', 'warning');
        }
        setTimeout(() => {
          window.location.replace('./cart.html');
        }, 400);
        return;
      }

      // --- SECTION 0: Top-Level Authentication & Profile Resolution ---
      const currentUser = (window.FoodWalaApp && FoodWalaApp.Auth) ? FoodWalaApp.Auth.getCurrentUser() : null;
      if (!currentUser) {
        try {
          localStorage.setItem('foodwala_post_login_redirect', './checkout.html');
        } catch (e) {}
        if (window.FoodWalaApp && FoodWalaApp.showToast) {
          FoodWalaApp.showToast('Please sign in to proceed with checkout.', 'warning');
        }
        setTimeout(() => {
          window.location.replace('./login.html?redirect=./checkout.html');
        }, 300);
        return;
      }

      // Clean post-login redirect immediately once authenticated user enters populated checkout
      try {
        localStorage.removeItem('foodwala_post_login_redirect');
      } catch (e) {}

      try {
        if (window.FoodWalaApp && FoodWalaApp.loadData) {
          await FoodWalaApp.loadData();
        }
      } catch (err) {
        console.warn('[FoodWala Checkout] Data preloading completed with warning:', err);
      }

      // Resolve real restaurant name and address`;

  if (oldBlockRegex.test(content)) {
    content = content.replace(oldBlockRegex, newBlock);
  } else {
    console.warn('Regex match failed for checkout oldBlockRegex in', filePath);
  }

  // Ensure safe restaurant ID resolution
  content = content.replace(
    /const rId = cart\.restaurantId \|\| \(cart\.items\[0\] && cart\.items\[0\]\.restaurantId\);/g,
    'const rId = cart.restaurantId || (cartItems[0] && (cartItems[0].restaurantId || cartItems[0].restaurant_id));'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated checkout at', filePath);
}

// 2. UPDATE cart.html
function updateCart(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update script tags with fresh cache busters
  content = content.replace(/src="\.\/js\/app\.min\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.min.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/api\.js(?:\?v=[^"]*)?"/g, 'src="./js/api.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/ui\.js(?:\?v=[^"]*)?"/g, 'src="./js/ui.js?v=20261102_02"');

  // In renderCart(), when cart is empty, clean post-login redirect
  if (!content.includes("localStorage.removeItem('foodwala_post_login_redirect');")) {
    const target = 'if (!cart.items || cart.items.length === 0) {';
    const replacement = `if (!cart.items || cart.items.length === 0) {
          try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}`;
    content = content.replace(target, replacement);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated cart at', filePath);
}

// 3. UPDATE login.html
function updateLogin(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update script tags with fresh cache busters
  content = content.replace(/src="\.\/js\/facebook-auth\.js(?:\?v=[^"]*)?"/g, 'src="./js/facebook-auth.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.min\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.min.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/api\.js(?:\?v=[^"]*)?"/g, 'src="./js/api.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/google-auth\.js(?:\?v=[^"]*)?"/g, 'src="./js/google-auth.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/config\.js(?:\?v=[^"]*)?"/g, 'src="./js/config.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/adapters\/liveAdapter\.js(?:\?v=[^"]*)?"/g, 'src="./js/adapters/liveAdapter.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/adapters\/mockAdapter\.js(?:\?v=[^"]*)?"/g, 'src="./js/adapters/mockAdapter.js?v=20261102_02"');

  // Replace redirect guard and handlePostLoginNavigation logic
  const oldLoginLogicRegex = /\/\/ Sanitize redirect target to avoid redirect loops[\s\S]*?\/\/ Propagate redirect parameter to register link if present/g;
  const newLoginGuard = `// Sanitize redirect target to avoid redirect loops
      if (redirectTarget) {
        const lower = redirectTarget.toLowerCase();
        if (lower.includes('login.html') || lower.includes('register.html')) {
          redirectTarget = './index.html';
        }
      }

      function getActiveCartCount() {
        let count = 0;
        try {
          if (window.FoodWalaApp && window.FoodWalaApp.Cart && typeof window.FoodWalaApp.Cart.getItemCount === 'function') {
            count = window.FoodWalaApp.Cart.getItemCount();
          }
        } catch (e) {}
        if (count === 0) {
          try {
            const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart') || sessionStorage.getItem('cart') || localStorage.getItem('foodwalaCart');
            if (raw) {
              const parsed = JSON.parse(raw);
              count = Array.isArray(parsed) ? parsed.length : (parsed.items && Array.isArray(parsed.items) ? parsed.items.length : 0);
            }
          } catch (e) {}
        }
        return count;
      }

      // If redirect target points to checkout or cart, verify that user actually has items in the cart
      if (redirectTarget && (redirectTarget.includes('checkout.html') || redirectTarget.includes('cart.html'))) {
        const count = getActiveCartCount();
        // If cart is empty, do NOT send user to checkout.html or cart.html (which causes bounce or empty cart view)
        if (count === 0) {
          try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}
          redirectTarget = './index.html';
        }
      }

      // Propagate redirect parameter to register link if present`;

  if (oldLoginLogicRegex.test(content)) {
    content = content.replace(oldLoginLogicRegex, newLoginGuard);
  } else {
    console.warn('Regex match failed for oldLoginLogicRegex in', filePath);
  }

  // Ensure finalTarget in handlePostLoginNavigation uses getActiveCartCount()
  const oldFinalTargetRegex = /let finalTarget = redirectTarget \|\| '\.\/index\.html';[\s\S]*?window\.location\.href = finalTarget;\s*}/g;
  const newFinalTarget = `let finalTarget = redirectTarget || './index.html';
            const count = getActiveCartCount();
            if ((finalTarget.includes('checkout.html') || finalTarget.includes('cart.html')) && count === 0) {
              try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}
              finalTarget = './index.html';
            }
            window.location.href = finalTarget;
          }`;

  if (oldFinalTargetRegex.test(content)) {
    content = content.replace(oldFinalTargetRegex, newFinalTarget);
  } else {
    console.warn('Regex match failed for oldFinalTargetRegex in', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated login at', filePath);
}

// 4. UPDATE register.html
function updateRegister(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update script tags with fresh cache busters
  content = content.replace(/src="\.\/js\/facebook-auth\.js(?:\?v=[^"]*)?"/g, 'src="./js/facebook-auth.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.min\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.min.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/api\.js(?:\?v=[^"]*)?"/g, 'src="./js/api.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/google-auth\.js(?:\?v=[^"]*)?"/g, 'src="./js/google-auth.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/config\.js(?:\?v=[^"]*)?"/g, 'src="./js/config.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/adapters\/liveAdapter\.js(?:\?v=[^"]*)?"/g, 'src="./js/adapters/liveAdapter.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/adapters\/mockAdapter\.js(?:\?v=[^"]*)?"/g, 'src="./js/adapters/mockAdapter.js?v=20261102_02"');

  const oldRegLogicRegex = /\/\/ Sanitize redirect target to avoid redirect loops[\s\S]*?\/\/ Propagate redirect parameter to login link if present/g;
  const newRegGuard = `// Sanitize redirect target to avoid redirect loops
      if (redirectTarget) {
        const lower = redirectTarget.toLowerCase();
        if (lower.includes('login.html') || lower.includes('register.html')) {
          redirectTarget = './index.html';
        }
      }

      function getActiveCartCount() {
        let count = 0;
        try {
          if (window.FoodWalaApp && window.FoodWalaApp.Cart && typeof window.FoodWalaApp.Cart.getItemCount === 'function') {
            count = window.FoodWalaApp.Cart.getItemCount();
          }
        } catch (e) {}
        if (count === 0) {
          try {
            const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart') || sessionStorage.getItem('cart') || localStorage.getItem('foodwalaCart');
            if (raw) {
              const parsed = JSON.parse(raw);
              count = Array.isArray(parsed) ? parsed.length : (parsed.items && Array.isArray(parsed.items) ? parsed.items.length : 0);
            }
          } catch (e) {}
        }
        return count;
      }

      // If redirect target points to checkout or cart, verify that user actually has items in the cart
      if (redirectTarget && (redirectTarget.includes('checkout.html') || redirectTarget.includes('cart.html'))) {
        const count = getActiveCartCount();
        if (count === 0) {
          try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}
          redirectTarget = './index.html';
        }
      }

      // Expose handlePostLoginNavigation globally on register page as well
      window.handlePostLoginNavigation = function (user) {
        let finalTarget = redirectTarget || './index.html';
        const count = getActiveCartCount();
        if ((finalTarget.includes('checkout.html') || finalTarget.includes('cart.html')) && count === 0) {
          try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}
          finalTarget = './index.html';
        }
        window.location.href = finalTarget;
      };

      // Propagate redirect parameter to login link if present`;

  if (oldRegLogicRegex.test(content)) {
    content = content.replace(oldRegLogicRegex, newRegGuard);
  } else {
    console.warn('Regex match failed for oldRegLogicRegex in', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated register at', filePath);
}

// 5. UPDATE facebook-auth.js
function updateFacebookAuth(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add version console log
  if (!content.includes('Official Facebook SDK Engine v2026.11.02 initialized')) {
    content = content.replace(
      "const FACEBOOK_APP_ID = '4702946809933364';",
      `const FACEBOOK_APP_ID = '4702946809933364';\n  console.log('[FoodWala Facebook Auth] Official Facebook SDK Engine v2026.11.02 initialized');`
    );
  }

  // Update fallback redirect logic
  const oldFbGuardRegex = /\/\/ If redirect target points to checkout, verify that user actually has items in the cart[\s\S]*?redirectUrl = redirectUrl \|\| '\.\/index\.html';/g;
  const newFbGuard = `// If redirect target points to checkout or cart, verify that user actually has items in the cart
        if (redirectUrl && (redirectUrl.includes('checkout.html') || redirectUrl.includes('cart.html'))) {
          let itemCount = 0;
          try {
            if (window.FoodWalaApp && window.FoodWalaApp.Cart && typeof window.FoodWalaApp.Cart.getItemCount === 'function') {
              itemCount = window.FoodWalaApp.Cart.getItemCount();
            }
          } catch (e) {}
          if (itemCount === 0) {
            try {
              const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart') || sessionStorage.getItem('cart') || localStorage.getItem('foodwalaCart');
              if (raw) {
                const parsed = JSON.parse(raw);
                itemCount = Array.isArray(parsed) ? parsed.length : (parsed.items && Array.isArray(parsed.items) ? parsed.items.length : 0);
              }
            } catch (e) {}
          }
          // If cart is empty, do NOT send user to checkout.html or cart.html
          if (itemCount === 0) {
            try { localStorage.removeItem('foodwala_post_login_redirect'); } catch (e) {}
            redirectUrl = './index.html';
          }
        }

        redirectUrl = redirectUrl || './index.html';`;

  if (oldFbGuardRegex.test(content)) {
    content = content.replace(oldFbGuardRegex, newFbGuard);
  } else {
    console.warn('Regex match failed for oldFbGuardRegex in', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated facebook-auth.js at', filePath);
}

// 6. UPDATE index.html and home.html script cache busters
function updateIndexAndHome(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/src="\.\/js\/app\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/app\.min\.js(?:\?v=[^"]*)?"/g, 'src="./js/app.min.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/api\.js(?:\?v=[^"]*)?"/g, 'src="./js/api.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/ui\.js(?:\?v=[^"]*)?"/g, 'src="./js/ui.js?v=20261102_02"');
  content = content.replace(/src="\.\/js\/config\.js(?:\?v=[^"]*)?"/g, 'src="./js/config.js?v=20261102_02"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated index/home cache busters at', filePath);
}

// Execute on root
updateCheckout(path.join(projectRoot, 'checkout.html'));
updateCart(path.join(projectRoot, 'cart.html'));
updateLogin(path.join(projectRoot, 'login.html'));
updateRegister(path.join(projectRoot, 'register.html'));
updateFacebookAuth(path.join(projectRoot, 'js/facebook-auth.js'));
updateIndexAndHome(path.join(projectRoot, 'index.html'));
updateIndexAndHome(path.join(projectRoot, 'home.html'));

// Execute on src/main/webapp
updateCheckout(path.join(webappRoot, 'checkout.html'));
updateCart(path.join(webappRoot, 'cart.html'));
updateLogin(path.join(webappRoot, 'login.html'));
updateRegister(path.join(webappRoot, 'register.html'));
updateFacebookAuth(path.join(webappRoot, 'js/facebook-auth.js'));
updateIndexAndHome(path.join(webappRoot, 'index.html'));
updateIndexAndHome(path.join(webappRoot, 'home.html'));

console.log('All file updates applied successfully!');
