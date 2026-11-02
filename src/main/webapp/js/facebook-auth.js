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

    FB.login(function (response) {
      statusChangeCallback(response);
    }, {
      scope: 'public_profile,email',
      return_scopes: true
    });
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
        return;
      }

      // Construct verified FoodWala customer object
      const safeEmail = userInfo.email || (userInfo.id + '@facebook.foodwala.com');
      const customer = {
        userId: userInfo.id,
        id: userInfo.id,
        name: userInfo.name || 'Facebook User',
        username: userInfo.name || 'Facebook User',
        email: safeEmail,
        role: 'CUSTOMER',
        avatar: userInfo.picture && userInfo.picture.data ? userInfo.picture.data.url : null,
        authProvider: 'facebook',
        accessToken: authResponse.accessToken,
        loginTime: new Date().toISOString()
      };

      // Persist in local browser session
      localStorage.setItem('currentUser', JSON.stringify(customer));
      localStorage.setItem('foodwala_user', JSON.stringify(customer));
      localStorage.setItem('foodwala_auth_token', authResponse.accessToken);

      // Notify user visually
      showLoginSuccessToast(customer.username);

      // Handle redirect
      setTimeout(function () {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'home.html';
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

  // Bind Facebook buttons automatically on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    const fbButtons = document.querySelectorAll('.js-facebook-auth-btn');
    fbButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        loginWithFacebook();
      });
    });
  });

  // Setup Global Facebook SDK Async Init
  window.fbAsyncInit = function () {
    FB.init({
      appId      : FACEBOOK_APP_ID,
      cookie     : true,
      xfbml      : true,
      version    : 'v21.0'
    });

    console.log('[FoodWala Facebook Auth] Facebook SDK initialized with App ID:', FACEBOOK_APP_ID);

    // Initial check of login status
    FB.getLoginStatus(function (response) {
      statusChangeCallback(response);
    });
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
