/**
 * FoodWala Theme Controller (Dark Mode / Light Mode & Appetizing Background Palettes)
 * Seamlessly manages light and dark themes with localStorage persistence, system sync,
 * and dynamic background color palette switching (Sunset, Sapphire, Amber, Emerald).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'foodwala_theme';
  const PALETTE_STORAGE_KEY = 'foodwala_bg_palette';
  const AVAILABLE_PALETTES = ['sunset', 'sapphire', 'amber', 'emerald'];

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getActiveTheme() {
    return getSavedTheme() || getSystemPreference();
  }

  function getSavedPalette() {
    try {
      return localStorage.getItem(PALETTE_STORAGE_KEY) || 'sunset';
    } catch (e) {
      return 'sunset';
    }
  }

  function applyPalette(palette) {
    if (!AVAILABLE_PALETTES.includes(palette)) {
      palette = 'sunset';
    }
    const root = document.documentElement;
    root.setAttribute('data-fw-palette', palette);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('foodwala:palette-changed', { detail: { palette } }));
    return palette;
  }

  function cyclePalette() {
    const current = document.documentElement.getAttribute('data-fw-palette') || getSavedPalette();
    const idx = AVAILABLE_PALETTES.indexOf(current);
    const next = AVAILABLE_PALETTES[(idx + 1) % AVAILABLE_PALETTES.length];
    applyPalette(next);
    return next;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}

    updateToggleButtons(theme);
    window.dispatchEvent(new CustomEvent('foodwala:theme-changed', { detail: { theme } }));
  }

  function updateToggleButtons(theme) {
    const buttons = document.querySelectorAll('#fw-theme-toggle-btn, .theme-toggle-btn');
    buttons.forEach((btn) => {
      const icon = btn.querySelector('.theme-icon, i');
      const label = btn.querySelector('.theme-toggle-label, span');
      if (theme === 'dark') {
        if (icon) icon.className = 'bi bi-sun-fill text-warning fs-6';
        if (label) label.textContent = 'Light';
        btn.setAttribute('title', 'Switch to Light Mode');
      } else {
        if (icon) icon.className = 'bi bi-moon-stars-fill text-warning fs-6';
        if (label) label.textContent = 'Dark';
        btn.setAttribute('title', 'Switch to Dark Mode');
      }
    });
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-bs-theme') || getActiveTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  }

  // Early initialization before body loads to prevent FOUC
  const initialTheme = getActiveTheme();
  const initialPalette = getSavedPalette();
  document.documentElement.setAttribute('data-bs-theme', initialTheme);
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.documentElement.setAttribute('data-fw-palette', initialPalette);

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(initialTheme);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#fw-theme-toggle-btn, .theme-toggle-btn');
      if (btn) {
        e.preventDefault();
        toggle();
      }
    });
  });

  // Listen for system changes if no explicit user override
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getSavedTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  window.FoodWalaTheme = {
    get: getActiveTheme,
    getTheme: getActiveTheme,
    set: applyTheme,
    setTheme: applyTheme,
    toggle: toggle,
    toggleTheme: toggle,
    getPalette: getSavedPalette,
    setPalette: applyPalette,
    cyclePalette: cyclePalette,
    palettes: AVAILABLE_PALETTES
  };
})();
