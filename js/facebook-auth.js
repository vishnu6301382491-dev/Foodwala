/**
 * FoodWala Official Facebook SDK for JavaScript & OAuth Engine
 * 
 * App ID: 4702946809933364
 * 
 * Provides:
 * 1. Official Facebook JavaScript SDK asynchronous initialization (FB.init).
 * 2. Automatic check of customer login status on page load (FB.getLoginStatus).
 * 3. checkLoginState() and statusChangeCallback() handlers as requested by Meta Developer Portal.
 * 4. User profile graph fetching (id, name, email, picture) via FB.api('/me').
 * 5. Seamless local session persistence, toast notification, and post-login redirection.
 */

(function (window) {
  'use strict';

  // Configured Meta App ID
  const FACEBOOK_APP_ID = '4702946809933364';
  console.log('[FoodWala Facebook Auth] Official Facebook SDK Engine v2026.11.02 initialized');

  /**
   * Process Facebook Login Status response
   * @param {Object} response - Meta response { status: 'connected'|'not_authorized'|'unknown', authResponse: {...} }
   */
  function statusChangeCallback(response) {
    console.log('[FoodWala Facebook Auth] Status change response:', response);

    if (response && response.status === 'connected') {
      // The person is logged into Facebook and your app!
      console.log('[FoodWala Facebook Auth] User authenticated via Facebook. Fetching profile...');
      fetchUserProfile(response.authResponse);
    } else if (response && response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app
      console.log('[FoodWala Facebook Auth] User logged into Facebook, but not authorized for FoodWala.');
    } else {
      // The person is not logged into Facebook, so we're not sure if they are logged into this app or not
      console.log('[FoodWala Facebook Auth] User not logged into Facebook.');
    }
  }

  /**
   * Called by the <fb:login-button> onlogin attribute or custom button
   */
  function checkLoginState() {
    if (typeof FB === 'undefined') {
      console.warn('[FoodWala Facebook Auth] FB SDK not yet initialized. Please wait a moment.');
      return;
    }
    FB.getLoginStatus(function (response) {
      statusChangeCallback(response);
    });
  }

  /**
   * Trigger interactive Facebook Login Dialog
   */
  function loginWithFacebook() {
    if (typeof FB === 'undefined') {
      alert('Facebook SDK is still loading. Please try again in 2 seconds.');
      return;
    }

    try {
      FB.login(function (response) {
        statusChangeCallback(response);
      }, {
        scope: 'public_profile,email',
        return_scopes: true
      });
    } catch (err) {
      console.error('[FoodWala Facebook Auth] FB.login error:', err);
      if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
        window.FoodWalaApp.showToast('Unable to start Facebook Login. Please check popup settings.', 'error');
      }
    }
  }

  /**
   * Fetch authenticated user details from Meta Graph API
   */
  function fetchUserProfile(authResponse) {
    if (typeof FB === 'undefined') return;

    FB.api('/me', { fields: 'id,name,first_name,last_name,email,picture.width(200).height(200)' }, function (userInfo) {
      console.log('[FoodWala Facebook Auth] Profile received:', userInfo);

      if (!userInfo || userInfo.error) {
        console.error('[FoodWala Facebook Auth] Error fetching profile:', userInfo ? userInfo.error : 'Unknown');
        if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
          window.FoodWalaApp.showToast('Unable to retrieve Facebook profile. Please try again.', 'error');
        }
        return;
      }

      // Determine active role if selected in UI or URL query
      let targetRole = 'CUSTOMER';
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryRole = (urlParams.get('role') || urlParams.get('portal') || '').toUpperCase();
        if (queryRole) {
          targetRole = queryRole;
        } else if (typeof window.selectedRole !== 'undefined' && window.selectedRole) {
          targetRole = String(window.selectedRole).toUpperCase();
        } else if (typeof window.selectedRegRole !== 'undefined' && window.selectedRegRole) {
          targetRole = String(window.selectedRegRole).toUpperCase();
        }
      } catch (e) {}

      // Construct verified FoodWala customer object
      const safeEmail = userInfo.email || (userInfo.id + '@facebook.foodwala.com');
      const token = (authResponse && authResponse.accessToken) ? authResponse.accessToken : null;
      const customer = {
        userId: userInfo.id,
        id: userInfo.id,
        name: userInfo.name || 'Facebook User',
        username: userInfo.name || 'Facebook User',
        email: safeEmail,
        phone: (userInfo && userInfo.phone) || '',
        role: targetRole,
        avatar: userInfo.picture && userInfo.picture.data ? userInfo.picture.data.url : null,
        authProvider: 'facebook',
        accessToken: token,
        loginTime: new Date().toISOString()
      };

      // Persist in local and session browser storage across all standard keys
      const userStr = JSON.stringify(customer);
      try {
        localStorage.setItem('foodwala_current_user', userStr);
        sessionStorage.setItem('foodwala_current_user', userStr);
        localStorage.setItem('currentUser', userStr);
        sessionStorage.setItem('currentUser', userStr);
        localStorage.setItem('foodwala_user', userStr);
        sessionStorage.setItem('foodwala_user', userStr);
        if (token) {
          localStorage.setItem('foodwala_auth_token', token);
          sessionStorage.setItem('foodwala_auth_token', token);
        }
      } catch (storageErr) {
        console.warn('[FoodWala Facebook Auth] Storage error:', storageErr);
      }

      // Update FoodWalaApp session and UI if available
      if (window.FoodWalaApp && window.FoodWalaApp.Auth && typeof window.FoodWalaApp.Auth.setCurrentUser === 'function') {
        try {
          window.FoodWalaApp.Auth.setCurrentUser(customer);
        } catch (e) {}
      }
      if (window.FoodWalaApp && typeof window.FoodWalaApp.updateAuthUI === 'function') {
        try {
          window.FoodWalaApp.updateAuthUI();
        } catch (e) {}
      }

      // Dispatch global authentication change event
      try {
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: customer }));
      } catch (e) {}

      // Notify user visually
      showLoginSuccessToast(customer.username);

      // Handle redirect
      setTimeout(function () {
        if (typeof window.handlePostLoginNavigation === 'function') {
          window.handlePostLoginNavigation(customer);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        let redirectUrl = urlParams.get('redirect');
        if (!redirectUrl) {
          try {
            redirectUrl = localStorage.getItem('foodwala_post_login_redirect');
            localStorage.removeItem('foodwala_post_login_redirect');
          } catch (e) {}
        }

        // Sanitize redirectUrl to prevent loop and external redirects
        if (redirectUrl) {
          const lower = redirectUrl.toLowerCase();
          if (lower.includes('login.html') || lower.includes('register.html')) {
            redirectUrl = null;
          } else if (/^(?:[a-z]+:)?\/\//i.test(redirectUrl) || lower.startsWith('javascript:')) {
            try {
              const parsed = new URL(redirectUrl, window.location.href);
              if (parsed.origin !== window.location.origin) {
                redirectUrl = null;
              }
            } catch (e) {
              redirectUrl = null;
            }
          }
        }

        // If redirect target points to checkout or cart, verify that user actually has items in the cart
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
      }, 1000);
    });
  }

  /**
   * Display friendly login success toast
   */
  function showLoginSuccessToast(name) {
    const existing = document.getElementById('fb-auth-toast');
    if (existing) existing.remove();

    const toastHtml = `
      <div id="fb-auth-toast" style="position:fixed; top:20px; right:20px; z-index:99999; background:#1877F2; color:#fff; padding:14px 20px; border-radius:12px; box-shadow:0 10px 25px rgba(24,119,242,0.35); font-family:system-ui,-apple-system,sans-serif; display:flex; align-items:center; gap:12px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        <div>
          <div style="font-weight:700; font-size:14px;">Welcome to FoodWala, ${name}!</div>
          <div style="font-size:12px; opacity:0.9;">Logged in successfully with Facebook. Redirecting...</div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
  }

  // Bind Facebook buttons automatically
  function bindFacebookButtons() {
    const fbButtons = document.querySelectorAll('.js-facebook-auth-btn');
    fbButtons.forEach(function (btn) {
      if (btn.dataset && btn.dataset.fbBound) return;
      if (btn.dataset) btn.dataset.fbBound = 'true';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        loginWithFacebook();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindFacebookButtons);
  } else {
    bindFacebookButtons();
  }

  // Setup Global Facebook SDK Async Init
  window.fbAsyncInit = function () {
    FB.init({
      appId      : FACEBOOK_APP_ID,
      cookie     : true,
      xfbml      : true,
      version    : 'v21.0'
    });

    console.log('[FoodWala Facebook Auth] Facebook SDK initialized with App ID:', FACEBOOK_APP_ID);

    // Initial check of login status (Passive check only - DO NOT auto-redirect or auto-login on initial page load)
    try {
      FB.getLoginStatus(function (response) {
        console.log('[FoodWala Facebook Auth] Initial passive login status:', response ? response.status : 'unknown');
      });
    } catch (e) {
      console.warn('[FoodWala Facebook Auth] Passive getLoginStatus error:', e);
    }
  };

  // Asynchronously inject the Facebook SDK script tag into the DOM
  (function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  // Expose callbacks to global window object
  window.statusChangeCallback = statusChangeCallback;
  window.checkLoginState = checkLoginState;
  window.loginWithFacebook = loginWithFacebook;

})(window);
