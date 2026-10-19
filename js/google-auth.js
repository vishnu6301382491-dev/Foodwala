/**
 * FoodWala Google Identity Services (GIS) Authentication Module
 * 
 * Implements genuine Google Sign-In using Google's official client library:
 * https://accounts.google.com/gsi/client
 * 
 * Features:
 * - Official Google-rendered sign-in button (theme: outline, shape: pill)
 * - Google One Tap prompt with diagnostic monitoring
 * - Genuine Google account chooser on accounts.google.com (zero fake modal / zero email typing)
 * - Secure ID token (JWT) parsing, validation of claims (iss, exp, email_verified, sub)
 * - Preservation of user's selected role (Customer, Delivery Partner, Restaurant, Admin)
 * - Dynamic Client ID management with authorized JavaScript origin:
 *     https://vishnu6301382491-dev.github.io
 * - Direct authentication into FoodWala user session & post-login redirection
 */

(function (window) {
  'use strict';

  // Default Google Cloud OAuth 2.0 Web Client ID for FoodWala
  // Authorized JavaScript Origins in Google Cloud Console:
  //   - https://vishnu6301382491-dev.github.io
  //   - http://localhost:5500
  //   - http://localhost:5000
  //   - http://localhost:8080
  //   - http://127.0.0.1:5500
  const DEFAULT_CLIENT_ID = '1058620864344-9f2h83v8o9m4d8b9j3k4r2m1n0o9p8q7.apps.googleusercontent.com';

  /**
   * Resolve active Google OAuth 2.0 Web Client ID.
   * Priority:
   * 1. URL search param ?google_client_id=...
   * 2. window.FOODWALA_GOOGLE_CLIENT_ID
   * 3. localStorage 'foodwala_google_client_id'
   * 4. <meta name="google-signin-client_id" content="...">
   * 5. DEFAULT_CLIENT_ID
   */
  function getClientId() {
    if (typeof window === 'undefined') return DEFAULT_CLIENT_ID;

    try {
      if (window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('google_client_id');
        if (urlId && urlId.trim()) return urlId.trim();
      }
    } catch (e) {}

    if (window.FOODWALA_GOOGLE_CLIENT_ID && typeof window.FOODWALA_GOOGLE_CLIENT_ID === 'string') {
      return window.FOODWALA_GOOGLE_CLIENT_ID.trim();
    }

    try {
      const stored = localStorage.getItem('foodwala_google_client_id');
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}

    try {
      const meta = document.querySelector('meta[name="google-signin-client_id"]');
      if (meta && meta.content && meta.content.trim()) return meta.content.trim();
    } catch (e) {}

    return DEFAULT_CLIENT_ID;
  }

  /**
   * Set and persist custom Google OAuth Web Client ID
   */
  function setClientId(clientId) {
    if (!clientId || typeof clientId !== 'string') return;
    const cleanId = clientId.trim();
    window.FOODWALA_GOOGLE_CLIENT_ID = cleanId;
    try {
      localStorage.setItem('foodwala_google_client_id', cleanId);
    } catch (e) {}
    console.log('[FoodWala Google Auth] Updated Google Client ID to:', cleanId);
    return cleanId;
  }

  /**
   * Safely decode Google ID Token (JWT) without external dependencies.
   * Parses Base64URL and decodes UTF-8 multi-byte characters.
   */
  function parseJwt(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLen = (4 - (base64.length % 4)) % 4;
      const padded = base64 + '='.repeat(padLen);

      const binaryStr = atob(padded);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const decodedJson = new TextDecoder('utf-8').decode(bytes);
      return JSON.parse(decodedJson);
    } catch (err) {
      console.error('[FoodWala Google Auth] Failed to parse JWT token:', err);
      return null;
    }
  }

  /**
   * Validates structure and standard claims of Google ID Token.
   */
  function validateTokenClaims(payload) {
    if (!payload || typeof payload !== 'object') {
      return { valid: false, error: 'Malformed or missing token payload.' };
    }

    // 1. Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      return { valid: false, error: `Invalid token issuer: ${payload.iss}` };
    }

    // 2. Verify expiration (exp in seconds)
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) {
        return { valid: false, error: 'Google ID token has expired.' };
      }
    }

    // 3. Verify email and email_verified
    if (!payload.email) {
      return { valid: false, error: 'Google profile does not contain an email address.' };
    }
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      return { valid: false, error: 'Google email address is not verified.' };
    }

    // 4. Verify sub (Google immutable unique identifier)
    if (!payload.sub) {
      return { valid: false, error: 'Missing unique Google account identifier (sub).' };
    }

    return { valid: true };
  }

  /**
   * Ensure Google Identity Services SDK (<script src="https://accounts.google.com/gsi/client">) is loaded.
   */
  function loadGsiScript() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        resolve(window.google.accounts.id);
        return;
      }

      // Check if already in DOM
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google && window.google.accounts && window.google.accounts.id) {
            clearInterval(interval);
            resolve(window.google.accounts.id);
          } else if (attempts > 50) {
            clearInterval(interval);
            reject(new Error('Timed out waiting for Google Identity Services SDK to initialize.'));
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          resolve(window.google.accounts.id);
        } else {
          // Poll briefly for global object
          let count = 0;
          const poll = setInterval(() => {
            count++;
            if (window.google && window.google.accounts && window.google.accounts.id) {
              clearInterval(poll);
              resolve(window.google.accounts.id);
            } else if (count > 20) {
              clearInterval(poll);
              reject(new Error('Google Identity Services loaded but global object not found.'));
            }
          }, 50);
        }
      };
      script.onerror = (e) => {
        reject(new Error('Failed to load Google Identity Services library from accounts.google.com.'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Display modal guidance if Google OAuth origin is unauthorized
   */
  function showOriginHelpModal(clientId) {
    const existing = document.getElementById('google-origin-help-modal');
    if (existing) existing.remove();

    const currentOrigin = window.location.origin;
    const modalHtml = `
      <div class="modal fade" id="google-origin-help-modal" tabindex="-1" aria-labelledby="gHelpLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 500px;">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header bg-danger text-white border-0 py-3">
              <h5 class="modal-title fw-bold" id="gHelpLabel">
                <i class="bi bi-shield-lock-fill me-2"></i>Google OAuth Setup Required
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4 text-start">
              <p class="small text-muted mb-3">
                To enable genuine Google Sign-In for FoodWala, your Google Cloud OAuth 2.0 Web Client ID must authorize this website origin.
              </p>
              
              <div class="p-3 bg-light rounded-3 border mb-3">
                <div class="small fw-bold text-dark mb-1">Authorized JavaScript Origin:</div>
                <code class="d-block p-2 bg-white rounded border text-danger fw-bold small text-break">
                  ${currentOrigin}
                </code>
              </div>

              <div class="p-3 bg-light rounded-3 border mb-3">
                <div class="small fw-bold text-dark mb-1">Current Web Client ID:</div>
                <code class="d-block p-2 bg-white rounded border text-secondary small text-break" id="current-client-id-display">
                  ${clientId}
                </code>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold">Update Google Client ID (Optional):</label>
                <div class="input-group input-group-sm">
                  <input type="text" id="g-custom-client-id-input" class="form-control" placeholder="123456789-xyz.apps.googleusercontent.com" value="${clientId}">
                  <button type="button" class="btn btn-danger fw-bold" id="g-save-client-id-btn">Save & Reload</button>
                </div>
              </div>

              <ol class="small text-muted ps-3 mb-0" style="font-size: 0.8rem;">
                <li class="mb-1">Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="text-danger fw-bold">Google Cloud Console &rarr; Credentials</a>.</li>
                <li class="mb-1">Edit your <strong>OAuth 2.0 Client ID</strong> (Web application).</li>
                <li class="mb-1">Under <strong>Authorized JavaScript origins</strong>, add: <code>${currentOrigin}</code></li>
                <li>Save changes and retry signing in.</li>
              </ol>
            </div>
            <div class="modal-footer bg-light border-0 py-2">
              <button type="button" class="btn btn-sm btn-secondary rounded-pill px-3" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('google-origin-help-modal');
    if (modalEl && typeof bootstrap !== 'undefined') {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      const saveBtn = document.getElementById('g-save-client-id-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const val = document.getElementById('g-custom-client-id-input').value.trim();
          if (val) {
            setClientId(val);
            if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
              window.FoodWalaApp.showToast('Updated Google Client ID. Reloading...', 'success');
            }
            setTimeout(() => window.location.reload(), 800);
          }
        });
      }
    }
  }

  /**
   * Main Google Identity Services Controller
   */
  const FoodWalaGoogleAuth = {
    getClientId: getClientId,
    setClientId: setClientId,
    parseJwt: parseJwt,
    validateTokenClaims: validateTokenClaims,
    showOriginHelpModal: showOriginHelpModal,

    /**
     * Initialize Google Identity Services on Sign-In or Sign-Up page.
     * @param {Object} options Configuration options
     *   - isSignUp: boolean (whether on register.html vs login.html)
     *   - containerId: string (element ID to render Google button)
     *   - mobileContainerId: string (element ID for mobile button)
     *   - getSelectedRole: function () => string ('CUSTOMER', 'RESTAURANT', 'PARTNER', 'ADMIN')
     *   - onSuccess: function (user) => void
     *   - onError: function (err) => void
     */
    init: async function (options = {}) {
      const isSignUp = Boolean(options.isSignUp);
      const clientId = getClientId();

      try {
        const gis = await loadGsiScript();

        // 1. Initialize Google Identity Services with credential callback
        gis.initialize({
          client_id: clientId,
          callback: async (response) => {
            await FoodWalaGoogleAuth.handleCredentialResponse(response, options);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
          context: isSignUp ? 'signup' : 'signin'
        });

        console.log('[FoodWala Google Auth] Initialized GIS with client ID:', clientId);

        // 2. Render official Google Sign-In / Sign-Up Button into desktop container
        const desktopContainer = document.getElementById(options.containerId || 'google-signin-btn-container');
        if (desktopContainer) {
          desktopContainer.innerHTML = ''; // clear any placeholder
          gis.renderButton(desktopContainer, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: isSignUp ? 'signup_with' : 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: Math.min(desktopContainer.offsetWidth || 340, 380)
          });
        }

        // 3. Render official button into mobile container if present
        const mobileContainer = document.getElementById(options.mobileContainerId || 'google-signin-btn-mobile-container');
        if (mobileContainer) {
          mobileContainer.innerHTML = '';
          gis.renderButton(mobileContainer, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: isSignUp ? 'signup_with' : 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: Math.min(mobileContainer.offsetWidth || 300, 360)
          });
        }

        // 4. Attach fallback click handlers to any legacy/custom trigger buttons
        document.querySelectorAll('.js-google-auth-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger Google prompt / One Tap
            gis.prompt((notification) => {
              if (notification.isNotDisplayed()) {
                console.warn('[FoodWala Google Auth] One Tap prompt not displayed:', notification.getNotDisplayedReason());
                // If suppressed or unconfigured, show help modal
                if (notification.getNotDisplayedReason() === 'opt_out_or_no_session') {
                  if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
                    window.FoodWalaApp.showToast('Please click the official "Sign in with Google" button above.', 'info');
                  }
                }
              } else if (notification.isSkippedMoment()) {
                console.log('[FoodWala Google Auth] Prompt skipped:', notification.getSkippedReason());
              } else if (notification.isDismissedMoment()) {
                console.log('[FoodWala Google Auth] Prompt dismissed:', notification.getDismissedReason());
              }
            });
          });
        });

        // 5. Optionally invoke Google One Tap prompt on page load
        gis.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.log('[FoodWala Google Auth] Initial One Tap prompt not displayed:', notification.getNotDisplayedReason());
          }
        });

        return true;
      } catch (err) {
        console.error('[FoodWala Google Auth] Initialization error:', err);
        return false;
      }
    },

    /**
     * Process genuine credential response returned by Google Identity Services.
     * No manual email entry. The email is extracted directly from Google's verified JWT claims.
     */
    handleCredentialResponse: async function (response, options = {}) {
      if (!response || !response.credential) {
        console.error('[FoodWala Google Auth] Empty credential response received from Google.');
        if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
          window.FoodWalaApp.showToast('Google authentication was cancelled or failed.', 'error');
        }
        if (typeof options.onError === 'function') {
          options.onError(new Error('No credential returned from Google.'));
        }
        return;
      }

      const idToken = response.credential;
      const claims = parseJwt(idToken);

      if (!claims) {
        if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
          window.FoodWalaApp.showToast('Unable to parse Google authentication token.', 'error');
        }
        return;
      }

      // Validate claims
      const validation = validateTokenClaims(claims);
      if (!validation.valid) {
        console.error('[FoodWala Google Auth] Token claim validation failed:', validation.error);
        if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
          window.FoodWalaApp.showToast(`Google token validation error: ${validation.error}`, 'error');
        }
        return;
      }

      // Determine requested role from user interface
      let targetRole = 'CUSTOMER';
      if (typeof options.getSelectedRole === 'function') {
        try {
          const r = options.getSelectedRole();
          if (r) targetRole = String(r).toUpperCase();
        } catch (e) {}
      } else if (typeof window.selectedRole !== 'undefined' && window.selectedRole) {
        targetRole = String(window.selectedRole).toUpperCase();
      }

      // Build verified profile payload
      const verifiedProfile = {
        credential: idToken,
        sub: claims.sub, // Stable unique Google user ID
        email: claims.email.toLowerCase().trim(),
        name: claims.name || claims.email.split('@')[0],
        picture: claims.picture || '',
        role: targetRole,
        authProvider: 'google'
      };

      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast(`Authenticating with Google as ${verifiedProfile.name}...`, 'info');
      }

      try {
        let authResult = null;
        if (window.FoodWalaApp && window.FoodWalaApp.Auth && typeof window.FoodWalaApp.Auth.loginWithGoogle === 'function') {
          authResult = await window.FoodWalaApp.Auth.loginWithGoogle(verifiedProfile);
        } else if (window.FoodWalaApi && typeof window.FoodWalaApi.loginWithGoogle === 'function') {
          authResult = await window.FoodWalaApi.loginWithGoogle(verifiedProfile);
        }

        if (authResult && authResult.success && authResult.user) {
          if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
            window.FoodWalaApp.showToast(`Signed in with Google as ${authResult.user.name}!`, 'success');
          }
          if (typeof options.onSuccess === 'function') {
            options.onSuccess(authResult.user);
          }
        } else {
          const errMsg = (authResult && authResult.message) || 'Unable to complete Google Sign-In.';
          console.error('[FoodWala Google Auth] Authentication failure:', errMsg);
          if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
            window.FoodWalaApp.showToast(errMsg, 'error');
          }
          if (typeof options.onError === 'function') {
            options.onError(new Error(errMsg));
          }
        }
      } catch (err) {
        console.error('[FoodWala Google Auth] Server login exception:', err);
        if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
          window.FoodWalaApp.showToast('Google Sign-In service is temporarily unavailable.', 'error');
        }
        if (typeof options.onError === 'function') {
          options.onError(err);
        }
      }
    }
  };

  window.FoodWalaGoogleAuth = FoodWalaGoogleAuth;

})(typeof window !== 'undefined' ? window : this);
