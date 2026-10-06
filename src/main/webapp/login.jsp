<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="com.tap.model.Cart" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
    String redirectParam = request.getParameter("redirect");
    if (redirectParam == null) redirectParam = "";
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .tab-switcher {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 30px;
            margin-bottom: 24px;
            border: 1px solid var(--border-color);
        }
        .tab-btn {
            flex: 1;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: 700;
            border: none;
            background: transparent;
            color: var(--text-muted);
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .tab-btn.active {
            background: #ffffff;
            color: var(--primary);
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .otp-inputs-wrap {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 16px 0;
        }
        .otp-box {
            width: 46px;
            height: 52px;
            font-size: 22px;
            font-weight: 800;
            text-align: center;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: #fff;
            transition: border-color 0.2s;
        }
        .otp-box:focus {
            border-color: var(--primary);
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 82, 0, 0.15);
        }
        .phone-input-group {
            display: flex;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            overflow: hidden;
            background: #fff;
        }
        .phone-prefix {
            background: #f8fafc;
            padding: 12px 14px;
            font-weight: 700;
            color: var(--text-main);
            border-right: 1px solid var(--border-color);
            font-size: 15px;
            display: flex;
            align-items: center;
        }
        .phone-input-group input {
            flex: 1;
            border: none;
            padding: 12px 14px;
            font-size: 15px;
            font-weight: 600;
            outline: none;
        }
        .quick-demo-btn {
            padding: 8px 12px;
            font-size: 12px;
            border: 1px solid var(--border-color);
            background: #fff;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
            text-align: left;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.2s;
        }
        .quick-demo-btn:hover {
            border-color: var(--primary);
            background: var(--primary-light);
            color: var(--primary);
        }
    </style>
</head>
<body>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala
            </a>
            <nav class="nav-links">
                <a href="<%=request.getContextPath()%>/restaurants" class="nav-link">Restaurants</a>
                <a href="<%=request.getContextPath()%>/cart" class="nav-link">
                    🛒 Cart <% if(cartCount > 0) { %><span class="nav-badge"><%=cartCount%></span><% } %>
                </a>
                <a href="<%=request.getContextPath()%>/login" class="nav-link" style="color: var(--primary);">Login</a>
                <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <div class="form-card" style="max-width: 440px; margin: 40px auto;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 42px; margin-bottom: 8px;">🔐</div>
                <h1 style="font-size: 26px; font-weight: 800; color: var(--dark);">Welcome Back</h1>
                <p style="font-size: 14px; color: var(--text-muted);">Sign in to access your orders and saved addresses</p>
            </div>

            <!-- TAB SWITCHER: EMAIL VS MOBILE OTP -->
            <div class="tab-switcher">
                <button type="button" class="tab-btn active" id="tab-btn-email" onclick="switchLoginMode('email')">
                    ✉️ Email Login
                </button>
                <button type="button" class="tab-btn" id="tab-btn-otp" onclick="switchLoginMode('otp')">
                    📱 Mobile OTP
                </button>
            </div>

            <% if (request.getParameter("registered") != null) { %>
                <div class="alert alert-success">
                    ✅ Account created successfully! Please login below.
                </div>
            <% } %>

            <% if (request.getAttribute("error") != null) { %>
                <div class="alert alert-error" id="server-error-box">
                    ⚠️ <%=request.getAttribute("error")%>
                </div>
            <% } %>

            <!-- Dynamic JS Alert Box for OTP -->
            <div id="otp-alert-box" class="alert" style="display: none; margin-bottom: 16px;"></div>

            <!-- ================= SECTION 1: EMAIL LOGIN ================= -->
            <div id="section-email-login">
                <!-- 1-Click Fast Demo Logins -->
                <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; text-align: center;">
                        ⚡ 1-Click Demo Accounts
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <button type="button" class="quick-demo-btn" onclick="fillDemoLogin('rahul@gmail.com', '123456')">
                            <span>👤 <strong>Customer:</strong> Rahul Sharma</span>
                            <span style="font-size: 10px; color: var(--text-muted);">Auto-fill</span>
                        </button>
                        <button type="button" class="quick-demo-btn" onclick="fillDemoLogin('vidyarthi@gmail.com', '123456')">
                            <span>🏪 <strong>Restaurant:</strong> Vidyarthi Bhavan</span>
                            <span style="font-size: 10px; color: var(--text-muted);">Auto-fill</span>
                        </button>
                        <button type="button" class="quick-demo-btn" onclick="fillDemoLogin('ramesh@gmail.com', '123456')">
                            <span>🚴 <strong>Partner:</strong> Ramesh Kumar</span>
                            <span style="font-size: 10px; color: var(--text-muted);">Auto-fill</span>
                        </button>
                    </div>
                </div>

                <form action="<%=request.getContextPath()%>/login" method="post" id="email-login-form">
                    <% if (!redirectParam.isBlank()) { %>
                        <input type="hidden" name="redirect" value="<%=redirectParam%>">
                    <% } %>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" name="email" id="email-input" class="form-control" placeholder="you@example.com" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" name="password" id="password-input" class="form-control" placeholder="••••••••" required>
                    </div>

                    <div style="margin: 24px 0 16px;">
                        <button type="submit" class="btn btn-block" style="padding: 13px; font-size: 16px;">
                            Sign In →
                        </button>
                    </div>
                </form>
            </div>

            <!-- ================= SECTION 2: MOBILE OTP LOGIN ================= -->
            <div id="section-otp-login" style="display: none;">
                <!-- Step 1: Request Phone -->
                <div id="otp-step-phone">
                    <form id="otp-request-form" onsubmit="handleSendOtp(event)">
                        <div class="form-group">
                            <label class="form-label">Mobile Phone Number</label>
                            <div class="phone-input-group">
                                <span class="phone-prefix">+91</span>
                                <input type="tel" id="otp-phone-input" placeholder="10-digit mobile number" maxlength="14" required>
                            </div>
                            <small style="color: var(--text-muted); font-size: 12px; margin-top: 4px; display: block;">
                                We'll send a 6-digit verification code to this number.
                            </small>
                        </div>

                        <div style="margin: 20px 0 16px;">
                            <button type="submit" id="send-otp-btn" class="btn btn-block" style="padding: 13px; font-size: 16px;">
                                Send OTP →
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Step 2: Verify 6-digit OTP -->
                <div id="otp-step-verify" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 13px; color: var(--text-muted);">
                            Code sent to <strong id="display-masked-phone" style="color: var(--dark);">+91 XXXXX XXXXX</strong>
                        </span>
                        <a href="javascript:void(0)" onclick="resetToPhoneStep()" style="font-size: 12px; color: var(--primary); font-weight: 700; text-decoration: none;">
                            Change
                        </a>
                    </div>

                    <form id="otp-verify-form" onsubmit="handleVerifyOtp(event)">
                        <div class="form-group" style="text-align: center;">
                            <label class="form-label">Enter 6-Digit Verification Code</label>
                            <div class="otp-inputs-wrap" id="otp-boxes-container">
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-1" required>
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-2" required>
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-3" required>
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-4" required>
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-5" required>
                                <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" id="otp-b-6" required>
                            </div>
                        </div>

                        <div style="margin: 20px 0 12px;">
                            <button type="submit" id="verify-otp-btn" class="btn btn-block" style="padding: 13px; font-size: 16px;">
                                Verify & Sign In 🔐
                            </button>
                        </div>

                        <div style="text-align: center; font-size: 13px; margin-top: 14px;">
                            <span style="color: var(--text-muted);">Didn't receive OTP?</span>
                            <div id="resend-countdown-wrap" style="color: var(--text-muted); margin-top: 4px;">
                                Resend available in <strong id="resend-seconds" style="color: var(--primary);">30</strong>s
                            </div>
                            <button type="button" id="resend-btn" onclick="handleResendOtp()" style="display: none; background: none; border: none; color: var(--primary); font-weight: 700; cursor: pointer; font-size: 13px; margin-top: 4px;">
                                🔄 Resend OTP
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-muted);">
                Don't have an account? <a href="<%=request.getContextPath()%>/register" style="color: var(--primary); font-weight: 700; text-decoration: none;">Create one here</a>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <!-- CLIENT SCRIPT FOR DUAL LOGIN & REAL JAVA OTP -->
    <script>
        const CONTEXT_PATH = '<%=request.getContextPath()%>';
        const REDIRECT_TARGET = '<%=redirectParam%>';
        let currentPhone = '';
        let resendTimer = null;

        function switchLoginMode(mode) {
            const btnEmail = document.getElementById('tab-btn-email');
            const btnOtp = document.getElementById('tab-btn-otp');
            const secEmail = document.getElementById('section-email-login');
            const secOtp = document.getElementById('section-otp-login');
            const alertBox = document.getElementById('otp-alert-box');

            if (alertBox) alertBox.style.display = 'none';

            if (mode === 'otp') {
                btnEmail.classList.remove('active');
                btnOtp.classList.add('active');
                secEmail.style.display = 'none';
                secOtp.style.display = 'block';
            } else {
                btnOtp.classList.remove('active');
                btnEmail.classList.add('active');
                secOtp.style.display = 'none';
                secEmail.style.display = 'block';
            }
        }

        function fillDemoLogin(email, password) {
            document.getElementById('email-input').value = email;
            document.getElementById('password-input').value = password;
            document.getElementById('email-login-form').submit();
        }

        function showOtpAlert(msg, isSuccess = false) {
            const box = document.getElementById('otp-alert-box');
            box.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-error');
            box.innerHTML = (isSuccess ? '✅ ' : '⚠️ ') + msg;
            box.style.display = 'block';
        }

        function resetToPhoneStep() {
            document.getElementById('otp-step-verify').style.display = 'none';
            document.getElementById('otp-step-phone').style.display = 'block';
            if (resendTimer) clearInterval(resendTimer);
        }

        // 1. Send OTP Request
        async function handleSendOtp(e) {
            e.preventDefault();
            const phoneInput = document.getElementById('otp-phone-input').value.trim();
            const sendBtn = document.getElementById('send-otp-btn');

            if (!phoneInput) {
                showOtpAlert('Please enter your mobile number.');
                return;
            }

            sendBtn.disabled = true;
            sendBtn.innerHTML = 'Sending OTP...';

            try {
                const response = await fetch(CONTEXT_PATH + '/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phoneInput })
                });

                const data = await response.json();
                sendBtn.disabled = false;
                sendBtn.innerHTML = 'Send OTP →';

                if (response.ok && data.success) {
                    currentPhone = data.phone || phoneInput;
                    document.getElementById('display-masked-phone').textContent = currentPhone;
                    document.getElementById('otp-step-phone').style.display = 'none';
                    document.getElementById('otp-step-verify').style.display = 'block';
                    if (data.isDevMode) {
                        showOtpAlert('💡 Development OTP mode active: Code printed to your Tomcat server console.', true);
                    } else {
                        showOtpAlert('✅ OTP sent successfully via SMS to your mobile phone!', true);
                    }
                    clearOtpBoxes();
                    startCountdown(30);
                } else {
                    showOtpAlert(data.message || 'Unable to send OTP. Please check SMS provider settings.');
                }
            } catch (err) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = 'Send OTP →';
                console.error('[FoodWala OTP Error]', err);
                showOtpAlert('Error communicating with Java backend.');
            }
        }

        // 2. Verify OTP Request
        async function handleVerifyOtp(e) {
            e.preventDefault();
            let otp = '';
            for (let i = 1; i <= 6; i++) {
                otp += document.getElementById('otp-b-' + i).value.trim();
            }

            if (otp.length !== 6) {
                showOtpAlert('Please enter the complete 6-digit OTP.');
                return;
            }

            const verifyBtn = document.getElementById('verify-otp-btn');
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = 'Verifying...';

            try {
                const response = await fetch(CONTEXT_PATH + '/api/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: currentPhone, otp: otp })
                });

                const data = await response.json();
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Verify & Sign In 🔐';

                if (response.ok && data.success) {
                    showOtpAlert('Verified successfully! Redirecting...', true);
                    setTimeout(() => {
                        if (REDIRECT_TARGET && REDIRECT_TARGET.trim().length > 0) {
                            window.location.href = CONTEXT_PATH + (REDIRECT_TARGET.startsWith('/') ? REDIRECT_TARGET : '/' + REDIRECT_TARGET);
                        } else {
                            window.location.href = CONTEXT_PATH + '/home';
                        }
                    }, 500);
                } else {
                    showOtpAlert(data.message || 'Invalid OTP code.');
                }
            } catch (err) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Verify & Sign In 🔐';
                console.error('[FoodWala OTP Verify Error]', err);
                showOtpAlert('Error verifying OTP with Java server.');
            }
        }

        // 3. Resend OTP
        async function handleResendOtp() {
            const resendBtn = document.getElementById('resend-btn');
            resendBtn.disabled = true;
            resendBtn.innerHTML = 'Resending...';

            try {
                const response = await fetch(CONTEXT_PATH + '/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: currentPhone })
                });
                const data = await response.json();
                resendBtn.disabled = false;
                resendBtn.innerHTML = '🔄 Resend OTP';

                if (response.ok && data.success) {
                    clearOtpBoxes();
                    showOtpAlert('New OTP sent successfully!', true);
                    startCountdown(30);
                } else {
                    showOtpAlert(data.message || 'Unable to resend OTP.');
                }
            } catch (err) {
                resendBtn.disabled = false;
                resendBtn.innerHTML = '🔄 Resend OTP';
                showOtpAlert('Failed to connect to OTP service.');
            }
        }

        // Countdown Timer
        function startCountdown(sec = 30) {
            if (resendTimer) clearInterval(resendTimer);
            let remaining = sec;
            const wrap = document.getElementById('resend-countdown-wrap');
            const btn = document.getElementById('resend-btn');
            const secSpan = document.getElementById('resend-seconds');

            wrap.style.display = 'block';
            btn.style.display = 'none';
            secSpan.textContent = remaining;

            resendTimer = setInterval(() => {
                remaining -= 1;
                secSpan.textContent = remaining;
                if (remaining <= 0) {
                    clearInterval(resendTimer);
                    wrap.style.display = 'none';
                    btn.style.display = 'inline-block';
                }
            }, 1000);
        }

        // OTP Box Auto-Advance, Backspace & Paste
        function clearOtpBoxes() {
            for (let i = 1; i <= 6; i++) {
                const b = document.getElementById('otp-b-' + i);
                if (b) b.value = '';
            }
            const first = document.getElementById('otp-b-1');
            if (first) first.focus();
        }

        document.addEventListener('DOMContentLoaded', () => {
            for (let i = 1; i <= 6; i++) {
                const box = document.getElementById('otp-b-' + i);
                if (!box) continue;

                box.addEventListener('input', (e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    e.target.value = val ? val.slice(-1) : '';
                    if (val && i < 6) {
                        const next = document.getElementById('otp-b-' + (i + 1));
                        if (next) next.focus();
                    }
                });

                box.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !box.value && i > 1) {
                        const prev = document.getElementById('otp-b-' + (i - 1));
                        if (prev) prev.focus();
                    }
                });

                box.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                    if (text) {
                        text.split('').forEach((digit, idx) => {
                            const b = document.getElementById('otp-b-' + (idx + 1));
                            if (b) b.value = digit;
                        });
                        const last = document.getElementById('otp-b-' + Math.min(text.length, 6));
                        if (last) last.focus();
                    }
                });
            }
        });
    </script>
</body>
</html>
