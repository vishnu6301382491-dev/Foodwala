/**
 * FoodWala Modern UI System: Modal Dialogs & Toast Notifications
 * Replaces native alert(), confirm(), and prompt() with accessible, responsive dialogs.
 */

(function (window) {
  'use strict';

  // 1. Toast Notification Shelf & Active State Tracker
  let activeToast = null; // { el: HTMLElement, timer: number, message: string }

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

  function dismissToast(el, immediate = false) {
    if (!el) return;
    if (activeToast && activeToast.el === el) {
      clearTimeout(activeToast.timer);
      activeToast = null;
    }
    if (immediate) {
      if (el.parentNode) el.parentNode.removeChild(el);
    } else {
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 280);
    }
  }

  /**
   * Unified FoodWala Toast System:
   * - De-duplicates by message (restarts 4-second timer if identical message is already visible)
   * - At most 1 visible toast at a time (new message replaces current one)
   * - 4-second auto-dismiss with animated slide out
   * - Working close (X) button
   */
  function showToast(message, type = 'success') {
    if (!message) return null;
    const cleanMsg = String(message).trim();
    const shelf = getToastShelf();

    // 1. De-duplicate by message: if identical toast is already visible, restart timer
    if (activeToast && activeToast.el && document.body.contains(activeToast.el)) {
      if (activeToast.message === cleanMsg) {
        clearTimeout(activeToast.timer);
        activeToast.timer = setTimeout(() => {
          dismissToast(activeToast ? activeToast.el : null);
        }, 4000);

        // Visual pulse feedback
        activeToast.el.classList.remove('pulse');
        void activeToast.el.offsetWidth; // trigger reflow
        activeToast.el.classList.add('pulse');
        return activeToast.el;
      }

      // 2. Allow at most 1 visible toast: a new different message replaces current
      dismissToast(activeToast.el, true);
    }

    // Clear any orphaned elements in shelf
    shelf.innerHTML = '';

    const toast = document.createElement('div');
    const isDanger = type === 'error' || type === 'danger';
    const normalizedType = isDanger ? 'error' : (type === 'warning' ? 'warning' : (type === 'info' ? 'info' : 'success'));
    toast.className = `foodwala-toast-item ${normalizedType}`;
    toast.setAttribute('role', 'alert');

    let iconClass = 'bi-check-circle-fill';
    if (normalizedType === 'error') iconClass = 'bi-x-circle-fill';
    else if (normalizedType === 'warning') iconClass = 'bi-exclamation-triangle-fill';
    else if (normalizedType === 'info') iconClass = 'bi-info-circle-fill';

    toast.innerHTML = `
      <i class="bi ${iconClass} foodwala-toast-icon"></i>
      <span class="foodwala-toast-msg">${cleanMsg}</span>
      <button type="button" class="foodwala-toast-close" aria-label="Close" title="Dismiss">&times;</button>
    `;

    // 3. Working close (X) button
    const closeBtn = toast.querySelector('.foodwala-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissToast(toast, false);
      });
    }

    shelf.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    });

    // 3. Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      dismissToast(toast, false);
    }, 4000);

    activeToast = {
      el: toast,
      timer: timer,
      message: cleanMsg
    };

    return toast;
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
