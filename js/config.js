/**
 * FoodWala Unified Application Configuration (config.js)
 * 
 * Central configuration flag for switching between Mock (client-side only)
 * and Live (Render + Cloud MySQL) modes.
 */
(function (window) {
  'use strict';

  window.FOODWALA_CONFIG = {
    // Mode options: "mock" (browser-only localStorage/JSON) or "live" (Render backend + MySQL)
    MODE: 'mock',

    // Live backend endpoint (used when MODE === "live")
    API_BASE_URL: 'https://foodwala-backend-api.onrender.com',

    // Controls whether 1-click fast demo logins are visible on login.html and OTPs logged to console
    DEMO_MODE: false
  };

  // Render a subtle indicator banner when running in mock mode
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.MODE === 'mock' && !document.getElementById('foodwala-mock-banner')) {
        const banner = document.createElement('div');
        banner.id = 'foodwala-mock-banner';
        banner.className = 'bg-dark text-white text-center py-1 px-3 small border-bottom border-secondary d-flex align-items-center justify-content-center gap-2';
        banner.style.fontSize = '0.75rem';
        banner.style.zIndex = '1060';
        banner.innerHTML = '<span class="badge bg-warning text-dark py-0 px-2 fw-bold" style="font-size:0.68rem;">DEMO</span> <span>Demo mode — data stored in your browser only. Full browsing and checkout simulated locally.</span>';
        document.body.insertBefore(banner, document.body.firstChild);
      }
    });
  }

})(typeof window !== 'undefined' ? window : this);
