/**
 * FoodWala Unified Application Configuration & Health Monitor (config.js)
 * 
 * Manages live backend health check (3-second timeout), automatic offline
 * demo mode switching, demo banners on target pages, and recovery polling.
 */
(function (window) {
  'use strict';

  const HEALTH_TIMEOUT_MS = 3000;
  const POLL_INTERVAL_MS = 15000;
  const BANNER_ID = 'foodwala-offline-demo-banner';
  const BANNER_TEXT = 'Demo mode: backend offline. Data is stored only in this browser.';

  window.FOODWALA_CONFIG = {
    MODE: 'mock',
    API_BASE_URL: 'https://foodwala-backend-api.onrender.com',
    DEMO_MODE: true
  };

  window.FOODWALA_IS_DEMO_MODE = true;

  let isDemoMode = true;
  let pollTimer = null;
  const statusListeners = [];

  function getHealthUrl() {
    const base = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'https://foodwala-backend-api.onrender.com';
    return base.replace(/\/+$/, '') + '/api/health';
  }

  // Check health with strict 3-second timeout
  async function checkHealth() {
    if (typeof fetch === 'undefined') return false;
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
      return res.ok;
    } catch (err) {
      clearTimeout(timeoutId);
      return false;
    }
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

  // Initial Health Check
  async function initHealthCheck() {
    const isOnline = await checkHealth();
    setMode(!isOnline);

    // Setup periodic polling to auto-recover as soon as backend comes online
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      const online = await checkHealth();
      if (online && isDemoMode) {
        console.log('[FoodWala Health] Backend is UP! Switching back to live backend.');
        setMode(false);
      } else if (!online && !isDemoMode) {
        console.log('[FoodWala Health] Backend is DOWN! Switching to offline demo mode.');
        setMode(true);
      }
    }, POLL_INTERVAL_MS);
  }

  window.FoodWalaHealth = {
    checkHealth: checkHealth,
    isDemoMode: function () { return isDemoMode; },
    setMode: setMode,
    onStatusChange: function (fn) { statusListeners.push(fn); },
    renderBanner: renderBanner,
    removeBanner: removeBanner
  };

  // Start health check immediately
  initHealthCheck();

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
