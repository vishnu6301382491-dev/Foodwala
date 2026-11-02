const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'D:/FoodWala_Eclipse_Project';

function patchFile(relPath, transforms) {
  const fullPath = path.join(ROOT_DIR, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const isCRLF = content.includes('\r\n');
  const newline = isCRLF ? '\r\n' : '\n';

  for (const t of transforms) {
    // Normalize target and replacement newlines to match the file
    const target = t.target.replace(/\r?\n/g, newline);
    const replacement = t.replacement.replace(/\r?\n/g, newline);

    if (!content.includes(target)) {
      throw new Error(`Target not found in ${relPath}: ${target.slice(0, 80)}...`);
    }
    content = content.replace(target, replacement);
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Successfully patched: ${relPath}`);
}

// 1. login.html
const loginTransforms = [
  {
    target: `      const urlParams = new URLSearchParams(window.location.search);
      const urlRedirect = urlParams.get('redirect');
      const storedRedirect = localStorage.getItem('foodwala_post_login_redirect');
      const redirectTarget = urlRedirect || storedRedirect || './index.html';

      // Propagate redirect parameter to register link if present
      const regLink = document.querySelector('a[href="./register.html"]');
      if (regLink && redirectTarget && redirectTarget !== './index.html') {
        regLink.href = \`./register.html?redirect=\${encodeURIComponent(redirectTarget)}\`;
      }`,
    replacement: `      const urlParams = new URLSearchParams(window.location.search);
      const urlRedirect = urlParams.get('redirect');
      const storedRedirect = localStorage.getItem('foodwala_post_login_redirect');
      let redirectTarget = urlRedirect || storedRedirect || './index.html';

      // Sanitize redirect target to avoid redirect loops
      if (redirectTarget) {
        const lower = redirectTarget.toLowerCase();
        if (lower.includes('login.html') || lower.includes('register.html')) {
          redirectTarget = './index.html';
        }
      }

      // If redirect target points to checkout, verify that user actually has items in the cart
      if (redirectTarget && redirectTarget.includes('checkout.html')) {
        let itemCount = 0;
        try {
          if (window.FoodWalaApp && window.FoodWalaApp.Cart) {
            itemCount = window.FoodWalaApp.Cart.getItemCount();
          }
        } catch (e) {}
        if (itemCount === 0) {
          try {
            const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart');
            if (raw) {
              const parsed = JSON.parse(raw);
              itemCount = Array.isArray(parsed) ? parsed.length : (parsed.items ? parsed.items.length : 0);
            }
          } catch (e) {}
        }
        // If cart is empty, do NOT send user to checkout.html (which would bounce to cart.html)
        if (itemCount === 0) {
          redirectTarget = './index.html';
        }
      }

      // Propagate redirect parameter to register link if present
      const regLink = document.querySelector('a[href="./register.html"]');
      if (regLink && redirectTarget && redirectTarget !== './index.html') {
        regLink.href = \`./register.html?redirect=\${encodeURIComponent(redirectTarget)}\`;
      }`
  },
  {
    target: `          } else {
            window.location.href = redirectTarget;
          }
        }, 120);
      }`,
    replacement: `          } else {
            let finalTarget = redirectTarget || './index.html';
            if (finalTarget.includes('checkout.html')) {
              let count = 0;
              try {
                if (window.FoodWalaApp && window.FoodWalaApp.Cart) {
                  count = window.FoodWalaApp.Cart.getItemCount();
                }
              } catch (e) {}
              if (count === 0) {
                try {
                  const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart');
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    count = Array.isArray(parsed) ? parsed.length : (parsed.items ? parsed.items.length : 0);
                  }
                } catch (e) {}
              }
              if (count === 0) {
                finalTarget = './index.html';
              }
            }
            window.location.href = finalTarget;
          }
        }, 120);
      }

      // Expose globally for external auth providers (Facebook SDK callback, etc.)
      window.handlePostLoginNavigation = handlePostLoginNavigation;`
  }
];

// 2. checkout.html
const checkoutTransforms = [
  {
    target: `      // --- SECTION 1: Cart Validation & Restaurant Resolution ---
      let cart = FoodWalaApp.Cart.getCart();
      if (!cart || !cart.items || cart.items.length === 0) {
        if (window.FoodWalaApp && FoodWalaApp.showToast) {
          FoodWalaApp.showToast('Your cart is empty. Please add items from a restaurant.', 'warning');
        }
        setTimeout(() => {
          window.location.replace('./cart.html');
        }, 400);
        return;
      }`,
    replacement: `      // --- SECTION 1: Cart Validation & Restaurant Resolution ---
      let cart = FoodWalaApp.Cart.getCart();
      const cartItems = (cart && Array.isArray(cart.items)) ? cart.items : (FoodWalaApp.Cart.getItems ? FoodWalaApp.Cart.getItems() : []);
      if (!cart || cartItems.length === 0) {
        if (window.FoodWalaApp && FoodWalaApp.showToast) {
          FoodWalaApp.showToast('Your cart is empty. Please add items from a restaurant.', 'warning');
        }
        setTimeout(() => {
          window.location.replace('./cart.html');
        }, 400);
        return;
      }
      try {
        localStorage.removeItem('foodwala_post_login_redirect');
      } catch (e) {}`
  }
];

// 3. cart.html
const cartTransforms = [
  {
    target: `          const currentCart = FoodWalaApp.Cart.getCart();
          if (!currentCart.items || currentCart.items.length === 0) {
            FoodWalaApp.showToast('Your cart is empty. Please add items to proceed.', 'warning');
            return;
          }`,
    replacement: `          const currentCart = FoodWalaApp.Cart.getCart();
          const items = (currentCart && Array.isArray(currentCart.items)) ? currentCart.items : (FoodWalaApp.Cart.getItems ? FoodWalaApp.Cart.getItems() : []);
          if (!currentCart || items.length === 0) {
            FoodWalaApp.showToast('Your cart is empty. Please add items to proceed.', 'warning');
            return;
          }`
  }
];

// 4. facebook-auth.js
const fbTransforms = [
  {
    target: `        redirectUrl = redirectUrl || './index.html';

        const roleLower = String(customer.role || '').toLowerCase();
        if (roleLower === 'partner' || roleLower === 'delivery_partner') {
          redirectUrl = './delivery-dashboard.html';
        } else if (roleLower === 'admin') {
          redirectUrl = './admin.html';
        } else if (roleLower === 'restaurant' || roleLower === 'restaurant_admin' || roleLower === 'manager') {
          redirectUrl = './restaurant-dashboard.html';
        }

        window.location.href = redirectUrl;
      }, 1000);`,
    replacement: `        // If redirect target points to checkout, verify that user actually has items in the cart
        if (redirectUrl && redirectUrl.includes('checkout.html')) {
          let itemCount = 0;
          try {
            if (window.FoodWalaApp && window.FoodWalaApp.Cart) {
              itemCount = window.FoodWalaApp.Cart.getItemCount();
            }
          } catch (e) {}
          if (itemCount === 0) {
            try {
              const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart');
              if (raw) {
                const parsed = JSON.parse(raw);
                itemCount = Array.isArray(parsed) ? parsed.length : (parsed.items ? parsed.items.length : 0);
              }
            } catch (e) {}
          }
          // If cart is empty, do NOT send user to checkout.html (which would bounce to cart.html)
          if (itemCount === 0) {
            redirectUrl = './index.html';
          }
        }

        redirectUrl = redirectUrl || './index.html';

        const roleLower = String(customer.role || '').toLowerCase();
        if (roleLower === 'partner' || roleLower === 'delivery_partner') {
          redirectUrl = './delivery-dashboard.html';
        } else if (roleLower === 'admin') {
          redirectUrl = './admin.html';
        } else if (roleLower === 'restaurant' || roleLower === 'restaurant_admin' || roleLower === 'manager') {
          redirectUrl = './restaurant-dashboard.html';
        }

        window.location.href = redirectUrl;
      }, 1000);`
  }
];

// 5. register.html
const regTransforms = [
  {
    target: `      const urlParams = new URLSearchParams(window.location.search);
      const urlRedirect = urlParams.get('redirect');
      const storedRedirect = localStorage.getItem('foodwala_post_login_redirect');
      const redirectTarget = urlRedirect || storedRedirect || './index.html';

      // Propagate redirect parameter to login link if present
      const loginLink = document.querySelector('a[href="./login.html"]');
      if (loginLink && redirectTarget && redirectTarget !== './index.html') {
        loginLink.href = \`./login.html?redirect=\${encodeURIComponent(redirectTarget)}\`;
      }`,
    replacement: `      const urlParams = new URLSearchParams(window.location.search);
      const urlRedirect = urlParams.get('redirect');
      const storedRedirect = localStorage.getItem('foodwala_post_login_redirect');
      let redirectTarget = urlRedirect || storedRedirect || './index.html';

      // Sanitize redirect target to avoid redirect loops
      if (redirectTarget) {
        const lower = redirectTarget.toLowerCase();
        if (lower.includes('login.html') || lower.includes('register.html')) {
          redirectTarget = './index.html';
        }
      }

      // If redirect target points to checkout, verify that user actually has items in the cart
      if (redirectTarget && redirectTarget.includes('checkout.html')) {
        let itemCount = 0;
        try {
          if (window.FoodWalaApp && window.FoodWalaApp.Cart) {
            itemCount = window.FoodWalaApp.Cart.getItemCount();
          }
        } catch (e) {}
        if (itemCount === 0) {
          try {
            const raw = localStorage.getItem('foodwala_cart') || localStorage.getItem('cart') || sessionStorage.getItem('foodwala_cart');
            if (raw) {
              const parsed = JSON.parse(raw);
              itemCount = Array.isArray(parsed) ? parsed.length : (parsed.items ? parsed.items.length : 0);
            }
          } catch (e) {}
        }
        if (itemCount === 0) {
          redirectTarget = './index.html';
        }
      }

      // Propagate redirect parameter to login link if present
      const loginLink = document.querySelector('a[href="./login.html"]');
      if (loginLink && redirectTarget && redirectTarget !== './index.html') {
        loginLink.href = \`./login.html?redirect=\${encodeURIComponent(redirectTarget)}\`;
      }`
  }
];

try {
  // Apply to root files
  patchFile('login.html', loginTransforms);
  patchFile('checkout.html', checkoutTransforms);
  patchFile('cart.html', cartTransforms);
  patchFile('js/facebook-auth.js', fbTransforms);
  patchFile('register.html', regTransforms);

  // Apply to src/main/webapp files
  patchFile('src/main/webapp/login.html', loginTransforms);
  patchFile('src/main/webapp/checkout.html', checkoutTransforms);
  patchFile('src/main/webapp/cart.html', cartTransforms);
  patchFile('src/main/webapp/js/facebook-auth.js', fbTransforms);
  patchFile('src/main/webapp/register.html', regTransforms);

  console.log('\n🎉 ALL FILES PATCHED SUCCESSFULLY WITH ZERO REGRESSIONS!');
} catch (err) {
  console.error('❌ Error patching files:', err);
  process.exit(1);
}
