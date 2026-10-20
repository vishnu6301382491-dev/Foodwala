const fs = require('fs');
const path = require('path');

function updateFile(relativePath, replacements) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const usesCrlf = content.includes('\r\n');
  let normalized = content.replace(/\r\n/g, '\n');

  for (const item of replacements) {
    const { name, search, replace } = item;
    if (typeof search === 'string') {
      const normSearch = search.replace(/\r\n/g, '\n');
      if (!normalized.includes(normSearch)) {
        console.error(`[FAIL] String match not found for: "${name}" in ${relativePath}`);
        process.exit(1);
      }
      normalized = normalized.replace(normSearch, replace.replace(/\r\n/g, '\n'));
      console.log(`[PASS] Replaced: ${name}`);
    } else if (search instanceof RegExp) {
      if (!search.test(normalized)) {
        console.error(`[FAIL] Regex match not found for: "${name}" in ${relativePath}`);
        process.exit(1);
      }
      normalized = normalized.replace(search, replace.replace(/\r\n/g, '\n'));
      console.log(`[PASS] Replaced: ${name}`);
    }
  }

  if (usesCrlf) {
    normalized = normalized.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(fullPath, normalized, 'utf8');
  console.log(`[SAVED] Updated ${relativePath}`);
}

// ---------------------------------------------------------
// 1. LOGIN.HTML REPLACEMENTS
// ---------------------------------------------------------
updateFile('login.html', [
  {
    name: 'login.html: Replace mobile OTP banner with instructions',
    search: `                <div id="login-otp-demo-notice" class="alert alert-info py-2 px-3 small rounded-3 mt-2 mb-0 text-start border-0 shadow-sm">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <div>
                      <i class="bi bi-shield-check text-primary me-1"></i>
                      <strong>Verification Code:</strong> 
                      <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white" id="login-otp-code-badge">123456</span>
                    </div>
                    <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="autofill-login-otp-btn">
                      Auto-Fill
                    </button>
                  </div>
                  <div class="text-muted" style="font-size: 0.77rem;">
                    <i class="bi bi-info-circle me-1"></i> SMS Gateway Simulation: In testing sandbox, code <strong id="login-otp-code-text">123456</strong> is auto-filled below. You can also enter <strong>123456</strong>.
                  </div>
                </div>`,
    replace: `                <p class="text-muted small mt-2 mb-0">Enter the 6-digit verification code sent to your mobile number.</p>`
  },
  {
    name: 'login.html: Clear OTP boxes and leave empty for manual entry',
    search: `      // 2. 6-Box OTP Input Management (Auto advance, backspace, paste)
      function clearOtpBoxes(receivedOtp) {
        otpBoxes.forEach(box => box.value = '');
        otpError.style.display = 'none';

        let codeToShow = receivedOtp || '';
        if (!codeToShow) {
          try {
            const activeOtp = JSON.parse(localStorage.getItem('foodwala_mock_active_otp') || '{}');
            if (activeOtp && activeOtp.code) codeToShow = activeOtp.code;
          } catch (e) {}
        }
        if (!codeToShow) codeToShow = '123456';

        const notice = document.getElementById('login-otp-demo-notice');
        if (notice) {
          notice.className = 'alert alert-info py-2 px-3 small text-center mt-2 mb-0 rounded-3 border-0 shadow-sm';
          notice.innerHTML = \`
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div>
                <i class="bi bi-shield-check text-primary me-1"></i>
                <strong>Verification Code:</strong> 
                <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white">\${codeToShow}</span>
              </div>
              <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="autofill-login-otp-btn">
                Auto-Fill
              </button>
            </div>
            <div class="text-muted" style="font-size: 0.77rem;">
              <i class="bi bi-info-circle me-1"></i> SMS Gateway is simulated in testing sandbox. Code <strong>\${codeToShow}</strong> is auto-filled below. You can also enter <strong>123456</strong>.
            </div>
          \`;
          notice.style.display = 'block';

          const btnFill = notice.querySelector('#autofill-login-otp-btn');
          if (btnFill) {
            btnFill.addEventListener('click', () => {
              codeToShow.split('').forEach((d, i) => { if (otpBoxes[i]) otpBoxes[i].value = d; });
            });
          }
        }

        codeToShow.split('').forEach((d, i) => { if (otpBoxes[i]) otpBoxes[i].value = d; });
      }`,
    replace: `      // 2. 6-Box OTP Input Management (Auto advance, backspace, paste)
      function clearOtpBoxes() {
        otpBoxes.forEach(box => box.value = '');
        otpError.style.display = 'none';
        if (otpBoxes[0]) setTimeout(() => otpBoxes[0].focus(), 100);
      }`
  },
  {
    name: 'login.html: Forgot password OTP dispatch leave empty',
    search: `              const otpCode = res.code || res.otp || '123456';
              if (forgotSandboxBadge) forgotSandboxBadge.textContent = otpCode;
              if (forgotSandboxNotice) forgotSandboxNotice.style.display = 'block';

              const otpInput = document.getElementById('forgot-otp');
              if (otpInput) {
                otpInput.value = otpCode;
                setTimeout(() => otpInput.focus(), 200);
              }

              if (autofillForgotOtpBtn) {
                autofillForgotOtpBtn.onclick = () => {
                  if (otpInput) otpInput.value = otpCode;
                };
              }`,
    replace: `              const otpInput = document.getElementById('forgot-otp');
              if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 200);
              }`
  },
  {
    name: 'login.html: Forgot password resend OTP leave empty',
    search: `          if (res && res.success) {
            const newCode = res.code || res.otp || '123456';
            if (forgotSandboxBadge) forgotSandboxBadge.textContent = newCode;
            const otpInput = document.getElementById('forgot-otp');
            if (otpInput) otpInput.value = newCode;
            startForgotResendTimer(60);
            FoodWalaApp.showToast('New verification code sent to your email!', 'success');
          }`,
    replace: `          if (res && res.success) {
            const otpInput = document.getElementById('forgot-otp');
            if (otpInput) {
              otpInput.value = '';
              otpInput.focus();
            }
            startForgotResendTimer(60);
            FoodWalaApp.showToast('New verification code sent to your email!', 'success');
          }`
  },
  {
    name: 'login.html: Remove forgot password sandbox notice HTML',
    search: `            <!-- Testing Sandbox Helper Notice -->
            <div id="forgot-otp-sandbox-notice" class="alert alert-info py-2 px-3 small rounded-3 mb-3 border-0 shadow-sm" style="display: none;">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div>
                  <i class="bi bi-shield-check text-primary me-1"></i>
                  <strong>Verification Code:</strong> 
                  <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white" id="forgot-sandbox-otp-badge">123456</span>
                </div>
                <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="autofill-forgot-otp-btn">
                  Auto-Fill
                </button>
              </div>
              <div class="text-muted" style="font-size: 0.77rem;">
                <i class="bi bi-info-circle me-1"></i> For testing sandbox convenience, code is shown above. You can also enter <strong>123456</strong>.
              </div>
            </div>\n\n`,
    replace: ``
  }
]);

// ---------------------------------------------------------
// 2. REGISTER.HTML REPLACEMENTS
// ---------------------------------------------------------
updateFile('register.html', [
  {
    name: 'register.html: Remove reg-otp-demo-notice HTML',
    search: `          <div id="reg-otp-demo-notice" class="alert alert-info py-2 px-3 small rounded-3 mb-3 text-start border-0 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div>
                <i class="bi bi-shield-check text-primary me-1"></i>
                <strong>Verification Code:</strong> 
                <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white" id="reg-otp-code-badge">123456</span>
              </div>
              <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="auto-fill-reg-otp-btn">
                Auto-Fill
              </button>
            </div>
            <div class="text-muted" style="font-size: 0.77rem;">
              <i class="bi bi-info-circle me-1"></i> SMS Gateway Simulation: In testing sandbox, code <strong id="reg-otp-code-text">123456</strong> is auto-filled below. You can also enter <strong>123456</strong>.
            </div>
          </div>\n`,
    replace: ``
  },
  {
    name: 'register.html: showRegOtpModal without auto-fill',
    search: `      function showRegOtpModal(phoneNum, receivedOtp) {
        if (regOtpPhoneDisplay) regOtpPhoneDisplay.textContent = '+91 ' + phoneNum;
        if (regOtpError) regOtpError.style.display = 'none';
        regOtpBoxes.forEach(b => b.value = '');

        const demoNotice = document.getElementById('reg-otp-demo-notice');
        let codeToShow = receivedOtp || '';
        if (!codeToShow) {
          try {
            const activeOtp = JSON.parse(localStorage.getItem('foodwala_mock_active_otp') || '{}');
            if (activeOtp && activeOtp.code) codeToShow = activeOtp.code;
          } catch (e) {}
        }
        if (!codeToShow) codeToShow = '123456';

        if (demoNotice) {
          demoNotice.className = 'alert alert-info py-2 px-3 small rounded-3 mb-3 text-start border-0 shadow-sm';
          demoNotice.innerHTML = \`
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div>
                <i class="bi bi-shield-check text-primary me-1"></i>
                <strong>Verification Code:</strong> 
                <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white">\${codeToShow}</span>
              </div>
              <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="auto-fill-reg-otp-btn">
                Auto-Fill
              </button>
            </div>
            <div class="text-muted" style="font-size: 0.77rem;">
              <i class="bi bi-info-circle me-1"></i> SMS Gateway is simulated in testing sandbox. Code <strong>\${codeToShow}</strong> is auto-filled below. You can also enter <strong>123456</strong>.
            </div>
          \`;
          demoNotice.style.display = 'block';

          const btnAutoFill = demoNotice.querySelector('#auto-fill-reg-otp-btn');
          if (btnAutoFill) {
            btnAutoFill.addEventListener('click', () => {
              codeToShow.split('').forEach((d, i) => { if (regOtpBoxes[i]) regOtpBoxes[i].value = d; });
            });
          }
        }

        // Auto-fill code into the 6 boxes
        codeToShow.split('').forEach((d, i) => { if (regOtpBoxes[i]) regOtpBoxes[i].value = d; });

        if (regOtpModal) regOtpModal.show();
        if (regOtpBoxes[0]) setTimeout(() => regOtpBoxes[0].focus(), 300);
      }`,
    replace: `      function showRegOtpModal(phoneNum) {
        if (regOtpPhoneDisplay) regOtpPhoneDisplay.textContent = '+91 ' + phoneNum;
        if (regOtpError) regOtpError.style.display = 'none';
        regOtpBoxes.forEach(b => b.value = '');

        if (regOtpModal) regOtpModal.show();
        if (regOtpBoxes[0]) setTimeout(() => regOtpBoxes[0].focus(), 300);
      }`
  },
  {
    name: 'register.html: Forgot password OTP dispatch leave empty',
    search: `              const otpCode = res.code || res.otp || '123456';
              if (forgotSandboxBadge) forgotSandboxBadge.textContent = otpCode;
              if (forgotSandboxNotice) forgotSandboxNotice.style.display = 'block';

              const otpInput = document.getElementById('forgot-otp');
              if (otpInput) {
                otpInput.value = otpCode;
                setTimeout(() => otpInput.focus(), 200);
              }

              if (autofillForgotOtpBtn) {
                autofillForgotOtpBtn.onclick = () => {
                  if (otpInput) otpInput.value = otpCode;
                };
              }`,
    replace: `              const otpInput = document.getElementById('forgot-otp');
              if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 200);
              }`
  },
  {
    name: 'register.html: Forgot password resend OTP leave empty',
    search: `          if (res && res.success) {
            const newCode = res.code || res.otp || '123456';
            if (forgotSandboxBadge) forgotSandboxBadge.textContent = newCode;
            const otpInput = document.getElementById('forgot-otp');
            if (otpInput) otpInput.value = newCode;
            startForgotResendTimer(60);
            FoodWalaApp.showToast('New verification code sent to your email!', 'success');
          }`,
    replace: `          if (res && res.success) {
            const otpInput = document.getElementById('forgot-otp');
            if (otpInput) {
              otpInput.value = '';
              otpInput.focus();
            }
            startForgotResendTimer(60);
            FoodWalaApp.showToast('New verification code sent to your email!', 'success');
          }`
  },
  {
    name: 'register.html: Remove forgot password sandbox notice HTML',
    search: `            <!-- Testing Sandbox Helper Notice -->
            <div id="forgot-otp-sandbox-notice" class="alert alert-info py-2 px-3 small rounded-3 mb-3 border-0 shadow-sm" style="display: none;">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <div>
                  <i class="bi bi-shield-check text-primary me-1"></i>
                  <strong>Verification Code:</strong> 
                  <span class="badge bg-primary fs-6 px-2 py-1 ms-1 text-white" id="forgot-sandbox-otp-badge">123456</span>
                </div>
                <button type="button" class="btn btn-xs btn-outline-primary rounded-pill px-2 py-0 fw-bold" id="autofill-forgot-otp-btn">
                  Auto-Fill
                </button>
              </div>
              <div class="text-muted" style="font-size: 0.77rem;">
                <i class="bi bi-info-circle me-1"></i> For testing sandbox convenience, code is shown above. You can also enter <strong>123456</strong>.
              </div>
            </div>\n\n`,
    replace: ``
  }
]);

console.log('[ALL DONE] OTP auto-fill removed cleanly from login.html and register.html');
