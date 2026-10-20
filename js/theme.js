/**
 * FoodWala Theme Controller (Dark Mode / Light Mode)
 * Seamlessly manages light and dark themes with localStorage persistence and system sync.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'foodwala_theme';

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
  document.documentElement.setAttribute('data-bs-theme', initialTheme);
  document.documentElement.setAttribute('data-theme', initialTheme);

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
  };
})();
