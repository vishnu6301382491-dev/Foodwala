/**
 * FoodWala Modern UI System: Modal Dialogs & Toast Notifications
 * Replaces native alert(), confirm(), and prompt() with accessible, responsive dialogs.
 */

(function (window) {
  'use strict';

  // 1. Toast Notification Shelf
  function getToastShelf() {
    let shelf = document.getElementById('foodwala-toast-shelf');
    if (!shelf) {
      shelf = document.createElement('div');
      shelf.id = 'foodwala-toast-shelf';
      shelf.className = 'foodwala-toast-shelf';
      shelf.setAttribute('aria-live', 'polite');
      shelf.setAttribute('aria-atomic', 'true');
      document.body.appendChild(shelf);
    }
    return shelf;
  }

  function showToast(message, type = 'success') {
    if (!message) return;
    const shelf = getToastShelf();

    const toast = document.createElement('div');
    toast.className = `foodwala-toast-item ${type}`;

    let iconClass = 'bi-check-circle-fill';
    if (type === 'error' || type === 'danger') iconClass = 'bi-x-circle-fill';
    else if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
    else if (type === 'info') iconClass = 'bi-info-circle-fill';

    toast.innerHTML = `
      <i class="bi ${iconClass} foodwala-toast-icon"></i>
      <span class="foodwala-toast-msg">${message}</span>
    `;

    shelf.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // 2. Accessible Confirm Modal
  function showConfirm(options = {}) {
    const {
      title = 'Are you sure?',
      message = 'Please confirm this action.',
      confirmText = 'Yes, Continue',
      cancelText = 'Cancel',
      icon = 'bi-question-circle',
      type = 'primary'
    } = options;

    return new Promise((resolve) => {
      const previouslyFocused = document.activeElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const backdrop = document.createElement('div');
      backdrop.className = 'foodwala-modal-backdrop';
      backdrop.setAttribute('role', 'presentation');

      const card = document.createElement('div');
      card.className = 'foodwala-modal-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('tabindex', '-1');

      const isDanger = type === 'danger';
      const iconTypeClass = isDanger ? 'danger' : (type === 'warning' ? 'warning' : (type === 'info' ? 'info' : ''));
      const confirmBtnClass = isDanger ? 'danger' : '';

      card.innerHTML = `
        <div class="foodwala-modal-icon ${iconTypeClass}">
          <i class="bi ${icon}"></i>
        </div>
        <h3 class="foodwala-modal-title">${title}</h3>
        <p class="foodwala-modal-message">${message}</p>
        <div class="foodwala-modal-actions">
          <button type="button" class="foodwala-btn-cancel" id="fw-modal-cancel">${cancelText}</button>
          <button type="button" class="foodwala-btn-confirm ${confirmBtnClass}" id="fw-modal-confirm">${confirmText}</button>
        </div>
      `;

      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      const confirmBtn = card.querySelector('#fw-modal-confirm');
      const cancelBtn = card.querySelector('#fw-modal-cancel');

      function cleanup(result) {
        document.removeEventListener('keydown', handleKeydown);
        backdrop.classList.remove('show');
        card.style.transform = 'scale(0.92)';
        card.style.opacity = '0';

        setTimeout(() => {
          if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
          document.body.style.overflow = originalOverflow;
          if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
          }
          resolve(result);
        }, 200);
      }

      function handleKeydown(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup(false);
          return;
        }

        // Focus trap
        if (e.key === 'Tab') {
          const focusable = [cancelBtn, confirmBtn];
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      confirmBtn.addEventListener('click', () => cleanup(true));
      cancelBtn.addEventListener('click', () => cleanup(false));

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          cleanup(false);
        }
      });

      document.addEventListener('keydown', handleKeydown);

      // Animate in
      requestAnimationFrame(() => {
        backdrop.classList.add('show');
        confirmBtn.focus();
      });
    });
  }

  // Expose to window and FoodWala namespace
  window.showConfirm = showConfirm;
  window.showToast = showToast;

  if (window.FoodWalaApp) {
    window.FoodWalaApp.showConfirm = showConfirm;
    window.FoodWalaApp.showToast = showToast;
  }
})(window);
