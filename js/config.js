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
    API_BASE_URL: 'https://foodwala-backend.onrender.com',
    DEMO_MODE: true
  };

  // Default to demo mode while backend is unreachable
  window.FOODWALA_IS_DEMO_MODE = true;

  let isDemoMode = true;
  let memoryHealthCache = null; // { isUp: boolean, timestamp: number }
  const statusListeners = [];

  function getHealthUrl() {
    const base = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'https://foodwala-backend.onrender.com';
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

    // 0. In mock mode, resolve offline status silently to avoid 404 network errors in browser console
    if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.MODE === 'mock' && !window.FOODWALA_CONFIG.PROBE_BACKEND) {
      setMode(true);
      return false;
    }

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

    removeBanner();

    if (demoActive) {
      updateDemoLoginButtons(true);
    } else {
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
    // Disabled - completely removed per user request
    removeBanner();
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

  // Attach DOMContentLoaded handler
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        removeBanner();
        if (isDemoMode) {
          updateDemoLoginButtons(true);
        }
      });
    } else {
      removeBanner();
      if (isDemoMode) {
        updateDemoLoginButtons(true);
      }
    }
  }

})(typeof window !== 'undefined' ? window : this);
