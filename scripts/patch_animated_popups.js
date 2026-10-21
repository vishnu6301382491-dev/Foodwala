const fs = require('fs');
const path = require('path');
const vm = require('vm');

function verifyHtmlSyntax(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1].trim();
    if (!code) continue;
    try {
      new vm.Script(code);
    } catch (err) {
      console.error('❌ SyntaxError in ' + filePath + ' (script #' + scriptIndex + '): ' + err.message);
      return false;
    }
  }
  return true;
}

console.log('============================================================');
console.log('🎨 APPLYING ANIMATED COLORS & POP-UP MESSAGE SYSTEM');
console.log('============================================================\n');

// ============================================================================
// 1. ENHANCE CSS/UI.CSS WITH ANIMATIONS & THEME COLORS
// ============================================================================
function patchUiCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const animatedStyles = `

/* ==========================================================================
   VIBRANT COLORFUL ANIMATED POPUP MESSAGES (FOODWALA DESIGN SYSTEM)
   ========================================================================== */

@keyframes fwPopSpring {
  0% {
    opacity: 0;
    transform: scale(0.68) translateY(35px);
  }
  50% {
    opacity: 1;
    transform: scale(1.06) translateY(-6px);
  }
  75% {
    transform: scale(0.97) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fwPulseDangerAura {
  0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 22px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes fwPulseSuccessAura {
  0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 22px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes fwPulseWarningAura {
  0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 22px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

@keyframes fwPulseInfoAura {
  0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7); }
  70% { transform: scale(1.08); box-shadow: 0 0 0 22px rgba(6, 182, 212, 0); }
  100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
}

@keyframes fwShineBar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.foodwala-modal-card {
  position: relative;
  overflow: hidden;
  border-radius: 26px !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.foodwala-modal-backdrop.show .foodwala-modal-card {
  animation: fwPopSpring 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* Theme: DANGER / ACCESS RESTRICTED */
.foodwala-modal-card.fw-theme-danger {
  border: 2px solid rgba(239, 68, 68, 0.5) !important;
  box-shadow: 0 30px 65px -12px rgba(239, 68, 68, 0.4), 0 0 35px rgba(249, 115, 22, 0.25) !important;
  background: linear-gradient(150deg, #ffffff 0%, #fff1f2 100%) !important;
}
body.dark-mode .foodwala-modal-card.fw-theme-danger,
[data-theme="dark"] .foodwala-modal-card.fw-theme-danger {
  background: linear-gradient(150deg, #0f172a 0%, #1c1017 100%) !important;
  border-color: rgba(239, 68, 68, 0.6) !important;
}
.foodwala-modal-card.fw-theme-danger .foodwala-modal-icon {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%) !important;
  color: #ef4444 !important;
  border: 2px solid #ef4444;
  animation: fwPulseDangerAura 2s infinite !important;
}
.foodwala-modal-card.fw-theme-danger .foodwala-btn-confirm {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45) !important;
}

/* Theme: SUCCESS / CELEBRATION */
.foodwala-modal-card.fw-theme-success {
  border: 2px solid rgba(34, 197, 94, 0.5) !important;
  box-shadow: 0 30px 65px -12px rgba(34, 197, 94, 0.4), 0 0 35px rgba(16, 185, 129, 0.25) !important;
  background: linear-gradient(150deg, #ffffff 0%, #f0fdf4 100%) !important;
}
body.dark-mode .foodwala-modal-card.fw-theme-success,
[data-theme="dark"] .foodwala-modal-card.fw-theme-success {
  background: linear-gradient(150deg, #0f172a 0%, #062412 100%) !important;
  border-color: rgba(34, 197, 94, 0.6) !important;
}
.foodwala-modal-card.fw-theme-success .foodwala-modal-icon {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
  color: #16a34a !important;
  border: 2px solid #22c55e;
  animation: fwPulseSuccessAura 2s infinite !important;
}
.foodwala-modal-card.fw-theme-success .foodwala-btn-confirm {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.45) !important;
}

/* Theme: WARNING / ALERT */
.foodwala-modal-card.fw-theme-warning {
  border: 2px solid rgba(245, 158, 11, 0.5) !important;
  box-shadow: 0 30px 65px -12px rgba(245, 158, 11, 0.4), 0 0 35px rgba(251, 191, 36, 0.25) !important;
  background: linear-gradient(150deg, #ffffff 0%, #fffbeb 100%) !important;
}
body.dark-mode .foodwala-modal-card.fw-theme-warning,
[data-theme="dark"] .foodwala-modal-card.fw-theme-warning {
  background: linear-gradient(150deg, #0f172a 0%, #261904 100%) !important;
  border-color: rgba(245, 158, 11, 0.6) !important;
}
.foodwala-modal-card.fw-theme-warning .foodwala-modal-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
  color: #d97706 !important;
  border: 2px solid #f59e0b;
  animation: fwPulseWarningAura 2s infinite !important;
}
.foodwala-modal-card.fw-theme-warning .foodwala-btn-confirm {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45) !important;
}
`;

  if (!content.includes('VIBRANT COLORFUL ANIMATED POPUP MESSAGES')) {
    content += animatedStyles;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Injected vibrant animated popup styles into ' + filePath);
  }
}

patchUiCss(path.resolve('css/ui.css'));
if (fs.existsSync('src/main/webapp/css/ui.css')) {
  patchUiCss(path.resolve('src/main/webapp/css/ui.css'));
}

// ============================================================================
// 2. ENHANCE JS/UI.JS WITH FOODWALA POPUP API & SHOWALERT
// ============================================================================
function patchUiJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const showAlertFunction = `
  // 3. Vibrant Animated Alert / Notification Modal
  function showAlert(options = {}) {
    if (typeof options === 'string') {
      options = { message: options };
    }
    const {
      title = 'FoodWala Notification',
      message = '',
      type = 'info', // 'success', 'danger', 'warning', 'info'
      icon = null,
      confirmText = 'OK',
      cancelText = null,
      onConfirm = null,
      onCancel = null
    } = options;

    return new Promise((resolve) => {
      const previouslyFocused = document.activeElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const backdrop = document.createElement('div');
      backdrop.className = 'foodwala-modal-backdrop';
      backdrop.setAttribute('role', 'presentation');

      const card = document.createElement('div');
      card.className = \`foodwala-modal-card fw-theme-\${type}\`;
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-modal', 'true');
      card.setAttribute('tabindex', '-1');

      let iconClass = icon;
      if (!iconClass) {
        if (type === 'danger' || type === 'error') iconClass = 'bi-shield-lock-fill';
        else if (type === 'success') iconClass = 'bi-check-circle-fill';
        else if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';
        else iconClass = 'bi-info-circle-fill';
      }

      let actionsHtml = \`<button type="button" class="foodwala-btn-confirm" id="fw-alert-confirm">\${confirmText}</button>\`;
      if (cancelText) {
        actionsHtml = \`
          <button type="button" class="foodwala-btn-cancel" id="fw-alert-cancel">\${cancelText}</button>
          <button type="button" class="foodwala-btn-confirm" id="fw-alert-confirm">\${confirmText}</button>
        \`;
      }

      card.innerHTML = \`
        <div class="foodwala-modal-icon \${type}">
          <i class="bi \${iconClass}"></i>
        </div>
        <h3 class="foodwala-modal-title">\${title}</h3>
        <div class="foodwala-modal-message">\${message}</div>
        <div class="foodwala-modal-actions">
          \${actionsHtml}
        </div>
      \`;

      backdrop.appendChild(card);
      document.body.appendChild(backdrop);

      const confirmBtn = card.querySelector('#fw-alert-confirm');
      const cancelBtn = card.querySelector('#fw-alert-cancel');

      function cleanup(result) {
        document.removeEventListener('keydown', handleKeydown);
        backdrop.classList.remove('show');
        card.style.transform = 'scale(0.92)';
        card.style.opacity = '0';

        setTimeout(() => {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
          document.body.style.overflow = originalOverflow;
          if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
          }
          if (result && typeof onConfirm === 'function') onConfirm();
          if (!result && typeof onCancel === 'function') onCancel();
          resolve(result);
        }, 220);
      }

      function handleKeydown(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup(false);
        }
      }

      confirmBtn.addEventListener('click', () => cleanup(true));
      if (cancelBtn) cancelBtn.addEventListener('click', () => cleanup(false));

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) cleanup(false);
      });

      document.addEventListener('keydown', handleKeydown);

      requestAnimationFrame(() => {
        backdrop.classList.add('show');
        confirmBtn.focus();
      });
    });
  }
`;

  if (!content.includes('function showAlert(')) {
    content = content.replace('// 2. Accessible Confirm Modal', showAlertFunction + '\n  // 2. Accessible Confirm Modal');
    content = content.replace('window.showConfirm = showConfirm;', 'window.showAlert = showAlert;\n  window.showConfirm = showConfirm;');
    content = content.replace('window.FoodWalaApp.showConfirm = showConfirm;', 'window.FoodWalaApp.showAlert = showAlert;\n    window.FoodWalaApp.showConfirm = showConfirm;');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Added showAlert to ' + filePath);
  }
}

patchUiJs(path.resolve('js/ui.js'));
if (fs.existsSync('src/main/webapp/js/ui.js')) {
  patchUiJs(path.resolve('src/main/webapp/js/ui.js'));
}

// ============================================================================
// 3. PATCH DELIVERY-DASHBOARD.HTML (INTEGRATE UI.JS & ANIMATED ACCESS RESTRICTED MODAL)
// ============================================================================
function patchDeliveryDashboardAnimatedPopups(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure js/ui.js is loaded
  if (!content.includes('<script src="./js/ui.js"></script>')) {
    content = content.replace('<script src="./js/theme.js"></script>', '<script src="./js/theme.js"></script>\n  <script src="./js/ui.js"></script>');
    console.log('✅ Added js/ui.js script include in ' + filePath);
  }

  // Replace Access Denied alert with animated Danger modal
  const oldAccessCheck = `      if (!isAdmin && !isPartner) {
        alert('Access denied. This portal is restricted to authorized Delivery Partners.');
        window.location.href = './login.html';
        return;
      }`;

  const newAccessCheck = `      if (!isAdmin && !isPartner) {
        if (typeof showAlert === 'function') {
          showAlert({
            title: 'Partner Portal Restricted',
            message: '<div class="py-1"><div class="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30 rounded-pill px-3 py-1 mb-2 fw-bold">Security Alert</div><p class="text-dark dark:text-white mb-2 fw-semibold">This console is exclusively reserved for authorized FoodWala Delivery Heroes.</p><p class="small text-muted mb-0">Please sign in with your delivery fleet credentials.</p></div>',
            type: 'danger',
            icon: 'bi-shield-lock-fill',
            confirmText: 'Sign In as Delivery Hero',
            cancelText: 'Back to Storefront',
            onConfirm: () => { window.location.href = './login.html?portal=partner'; },
            onCancel: () => { window.location.href = './index.html'; }
          });
        } else {
          window.location.href = './login.html?portal=partner';
        }
        return;
      }`;

  if (content.includes(oldAccessCheck)) {
    content = content.replace(oldAccessCheck, newAccessCheck);
    console.log('✅ Replaced access denied alert with animated danger modal in ' + filePath);
  } else {
    // Try regex
    content = content.replace(
      /if\s*\(!isAdmin\s*&&\s*!isPartner\)\s*\{\s*alert\(['"]Access denied[\s\S]*?return;\s*\}/,
      newAccessCheck
    );
  }

  // Also replace !currentUser redirect with helpful animated prompt if user visits cold
  const oldNoUserCheck = `      if (!currentUser) {
        window.location.href = './login.html?redirect=./delivery-dashboard.html';
        return;
      }`;

  const newNoUserCheck = `      if (!currentUser) {
        if (typeof showAlert === 'function') {
          showAlert({
            title: 'Delivery Hero Sign In Required',
            message: '<div class="py-1"><div class="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 rounded-pill px-3 py-1 mb-2 fw-bold">Rider Authentication</div><p class="text-dark dark:text-white mb-2 fw-semibold">Please authenticate to activate your live GPS navigation radar and shift wallet.</p></div>',
            type: 'warning',
            icon: 'bi-bicycle',
            confirmText: 'Sign In as Delivery Hero',
            cancelText: 'Back to Storefront',
            onConfirm: () => { window.location.href = './login.html?portal=partner'; },
            onCancel: () => { window.location.href = './index.html'; }
          });
        } else {
          window.location.href = './login.html?portal=partner';
        }
        return;
      }`;

  if (content.includes(oldNoUserCheck)) {
    content = content.replace(oldNoUserCheck, newNoUserCheck);
    console.log('✅ Enhanced cold-visit authentication prompt in ' + filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  verifyHtmlSyntax(filePath);
}

patchDeliveryDashboardAnimatedPopups(path.resolve('delivery-dashboard.html'));
if (fs.existsSync('src/main/webapp/delivery-dashboard.html')) {
  patchDeliveryDashboardAnimatedPopups(path.resolve('src/main/webapp/delivery-dashboard.html'));
}

// ============================================================================
// 4. CLEAN UP REGISTER.HTML & RESTAURANT-DASHBOARD.HTML ALERTS
// ============================================================================
function patchOtherAlerts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace alert in restaurant-dashboard.html
  content = content.replace(
    /alert\(['"]Please enter a valid price[\s\S]*?\);/,
    "if (window.FoodWalaApp && FoodWalaApp.showToast) { FoodWalaApp.showToast('Please enter a valid price (greater than 0).', 'warning'); } else { console.warn('Invalid price'); }"
  );

  // Replace alert in register.html
  content = content.replace(
    /alert\(['"]Phone number already registered[\s\S]*?\);/,
    "if (window.FoodWalaApp && FoodWalaApp.showToast) { FoodWalaApp.showToast('Phone number already registered. Please login.', 'warning'); } else { console.warn('Phone exists'); }"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  verifyHtmlSyntax(filePath);
}

patchOtherAlerts(path.resolve('restaurant-dashboard.html'));
patchOtherAlerts(path.resolve('register.html'));
if (fs.existsSync('src/main/webapp/restaurant-dashboard.html')) {
  patchOtherAlerts(path.resolve('src/main/webapp/restaurant-dashboard.html'));
}
if (fs.existsSync('src/main/webapp/register.html')) {
  patchOtherAlerts(path.resolve('src/main/webapp/register.html'));
}

console.log('\n🎉 ALL ANIMATIONS, COLORS & POPUPS ENHANCED SUCCESSFULLY!');
