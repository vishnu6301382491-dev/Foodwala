/**
 * FoodWala Unified Application Configuration & Health Monitor (config.js)
 * 
 * - NO backend calls on page load (prevents red console errors during browsing).
 * - Shared checkBackend() with a 60-second memory + sessionStorage cache.
 * - Single request per 60s window across the entire application.
 * - Offline Demo Mode banner on target pages (login, register, checkout, orders).
 */
(function (window) {
  'use strict';

  const HEALTH_TIMEOUT_MS = 3000;
  const CACHE_TTL_MS = 60000; // 60 seconds
  const BANNER_ID = 'foodwala-offline-demo-banner';
  const BANNER_TEXT = 'Demo mode: backend offline. Data is stored only in this browser.';

  window.FOODWALA_CONFIG = {
    MODE: 'mock',
    API_BASE_URL: 'https://foodwala-backend-api.onrender.com',
    DEMO_MODE: true
  };

  // Default to demo mode while backend is unreachable
  window.FOODWALA_IS_DEMO_MODE = true;

  let isDemoMode = true;
  let memoryHealthCache = null; // { isUp: boolean, timestamp: number }
  const statusListeners = [];

  function getHealthUrl() {
    const base = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'https://foodwala-backend-api.onrender.com';
    return base.replace(/\/+$/, '') + '/api/health';
  }

  // Restore cached health status from sessionStorage on startup (ZERO network calls on page load)
  function initFromCache() {
    if (typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('foodwala_backend_health');
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          if (parsed && typeof parsed.isUp === 'boolean' && (now - parsed.timestamp < CACHE_TTL_MS)) {
            memoryHealthCache = parsed;
            isDemoMode = !parsed.isUp;
            window.FOODWALA_IS_DEMO_MODE = isDemoMode;
            if (window.FOODWALA_CONFIG) {
              window.FOODWALA_CONFIG.MODE = isDemoMode ? 'mock' : 'live';
              window.FOODWALA_CONFIG.DEMO_MODE = isDemoMode;
            }
            return;
          }
        }
      } catch (e) {}
    }
    // Default: offline demo mode
    isDemoMode = true;
    window.FOODWALA_IS_DEMO_MODE = true;
    if (window.FOODWALA_CONFIG) {
      window.FOODWALA_CONFIG.MODE = 'mock';
      window.FOODWALA_CONFIG.DEMO_MODE = true;
    }
  }

  /**
   * One shared checkBackend() function:
   * - Checks memory cache (< 60s)
   * - Checks sessionStorage (< 60s)
   * - Makes exactly ONE network call with 3s timeout only if cache expired
   * - Never makes 3 or 5 calls
   */
  async function checkBackend(forceRefresh = false) {
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceRefresh && memoryHealthCache && (now - memoryHealthCache.timestamp < CACHE_TTL_MS)) {
      return memoryHealthCache.isUp;
    }

    // 2. Check sessionStorage
    if (!forceRefresh && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('foodwala_backend_health');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.isUp === 'boolean' && (now - parsed.timestamp < CACHE_TTL_MS)) {
            memoryHealthCache = parsed;
            setMode(!parsed.isUp);
            return parsed.isUp;
          }
        }
      } catch (e) {}
    }

    // 3. Make ONE single request with 3s timeout
    let isUp = false;
    if (typeof fetch !== 'undefined') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      try {
        const res = await fetch(getHealthUrl(), {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          cache: 'no-cache'
        });
        clearTimeout(timeoutId);
        isUp = res.ok;
      } catch (err) {
        clearTimeout(timeoutId);
        isUp = false;
      }
    }

    // 4. Save to memory and sessionStorage
    memoryHealthCache = { isUp, timestamp: Date.now() };
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('foodwala_backend_health', JSON.stringify(memoryHealthCache));
      } catch (e) {}
    }

    // 5. Update mode and notify UI
    setMode(!isUp);

    return isUp;
  }

  function setMode(demoActive) {
    const changed = (isDemoMode !== demoActive);
    isDemoMode = demoActive;
    window.FOODWALA_IS_DEMO_MODE = demoActive;

    if (window.FOODWALA_CONFIG) {
      window.FOODWALA_CONFIG.MODE = demoActive ? 'mock' : 'live';
      window.FOODWALA_CONFIG.DEMO_MODE = demoActive;
    }

    if (demoActive) {
      renderBanner();
      updateDemoLoginButtons(true);
    } else {
      removeBanner();
      updateDemoLoginButtons(false);
      cleanUpDemoSessionIfLive();
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent('foodwala:demoModeChanged', { detail: { isDemoMode: demoActive } }));
      statusListeners.forEach(fn => {
        try { fn(demoActive); } catch (e) {}
      });
    }
  }

  function cleanUpDemoSessionIfLive() {
    try {
      const userStr = localStorage.getItem('foodwala_current_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && (u.isDemo || String(u.userId).startsWith('10'))) {
          localStorage.removeItem('foodwala_current_user');
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
          if (window.FoodWalaApp && FoodWalaApp.showToast) {
            FoodWalaApp.showToast('Backend online: demo session closed.', 'info');
          }
        }
      }
    } catch (e) {}
  }

  function isTargetPageForBanner() {
    if (typeof window === 'undefined' || !window.location) return false;
    const path = window.location.pathname.toLowerCase();
    return (
      path.includes('login') ||
      path.includes('register') ||
      path.includes('checkout') ||
      path.includes('orders')
    );
  }

  function renderBanner() {
    if (typeof document === 'undefined') return;
    if (!isTargetPageForBanner()) return;

    let banner = document.getElementById(BANNER_ID);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = BANNER_ID;
      banner.className = 'alert alert-warning py-2 px-3 small rounded-3 mb-4 d-flex align-items-center justify-content-center gap-2 border border-warning shadow-sm';
      banner.setAttribute('role', 'alert');
      banner.style.fontSize = '0.82rem';
      banner.innerHTML = `
        <span class="badge bg-warning text-dark fw-bold" style="font-size:0.75rem;">DEMO</span>
        <span class="fw-semibold">${BANNER_TEXT}</span>
      `;

      // Smart placement depending on target page
      const loginCard = document.querySelector('#email-login-section')?.closest('.card') || document.querySelector('.card');
      const regCard = document.querySelector('#register-form')?.closest('.card') || document.querySelector('.card');
      const checkoutContainer = document.querySelector('#checkout-form')?.closest('.container') || document.querySelector('main.container') || document.querySelector('.container');
      const ordersContainer = document.querySelector('#orders-list-container')?.closest('.container') || document.querySelector('main.container') || document.querySelector('.container');

      const path = window.location.pathname.toLowerCase();
      if (path.includes('login') && loginCard) {
        const tabs = loginCard.querySelector('[role="tablist"]');
        if (tabs) {
          loginCard.insertBefore(banner, tabs);
        } else {
          loginCard.insertBefore(banner, loginCard.firstChild);
        }
      } else if (path.includes('register') && regCard) {
        const form = document.getElementById('register-form');
        if (form) {
          regCard.insertBefore(banner, form);
        } else {
          regCard.insertBefore(banner, regCard.firstChild);
        }
      } else if (path.includes('checkout') && checkoutContainer) {
        checkoutContainer.insertBefore(banner, checkoutContainer.firstChild);
      } else if (path.includes('orders') && ordersContainer) {
        const heading = ordersContainer.querySelector('h3, h4, h2');
        if (heading && heading.parentNode) {
          heading.parentNode.insertBefore(banner, heading.nextSibling);
        } else {
          ordersContainer.insertBefore(banner, ordersContainer.firstChild);
        }
      } else {
        document.body.insertBefore(banner, document.body.firstChild);
      }
    }
    banner.style.display = 'flex';
  }

  function removeBanner() {
    if (typeof document === 'undefined') return;
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
      banner.remove();
    }
  }

  function updateDemoLoginButtons(show) {
    if (typeof document === 'undefined') return;
    const demoBox = document.getElementById('demo-logins-container');
    if (demoBox) {
      demoBox.style.display = show ? 'block' : 'none';
    }
  }

  window.FoodWalaHealth = {
    checkBackend: checkBackend,
    checkHealth: checkBackend,
    isDemoMode: function () { return isDemoMode; },
    setMode: setMode,
    onStatusChange: function (fn) { statusListeners.push(fn); },
    renderBanner: renderBanner,
    removeBanner: removeBanner
  };

  // Initialize from cache or default (NO network requests on page load)
  initFromCache();

  // Attach DOMContentLoaded handler for banner placement once DOM elements exist
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        if (isDemoMode) {
          renderBanner();
          updateDemoLoginButtons(true);
        }
      });
    } else {
      if (isDemoMode) {
        renderBanner();
        updateDemoLoginButtons(true);
      }
    }
  }

})(typeof window !== 'undefined' ? window : this);
