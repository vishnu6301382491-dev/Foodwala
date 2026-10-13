<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="com.tap.model.Cart" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Account - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .input-password-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }
        .input-password-wrapper input {
            padding-right: 42px;
            width: 100%;
        }
        .toggle-password-btn {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: var(--text-muted);
            padding: 4px;
            line-height: 1;
        }
        .toggle-password-btn:hover {
            color: var(--primary);
        }
        .password-hint {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
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
                <a href="<%=request.getContextPath()%>/login" class="nav-link">Login</a>
                <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <div class="form-card">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 40px; margin-bottom: 8px;">✨</div>
                <h1 style="font-size: 26px; font-weight: 800; color: var(--dark);">Create Your Account</h1>
                <p style="font-size: 14px; color: var(--text-muted);">Join FoodWala for quick ordering and doorstep delivery</p>
            </div>

            <% if (request.getAttribute("error") != null) { %>
                <div class="alert alert-error" id="server-error-box">
                    ⚠️ <%=request.getAttribute("error")%>
                </div>
            <% } %>

            <div id="client-error-box" class="alert alert-error" style="display: none;"></div>

            <form action="<%=request.getContextPath()%>/register" method="post" id="register-form" onsubmit="return handleRegisterSubmit(event)">
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" name="username" id="reg-name" class="form-control" placeholder="e.g. Vishnu Vardhan" required autocomplete="name">
                </div>

                <div class="form-group">
                    <label class="form-label">Mobile Phone Number *</label>
                    <input type="tel" name="phone" id="reg-phone" class="form-control" placeholder="10-digit mobile number" maxlength="14" required autocomplete="tel">
                </div>

                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" name="email" id="reg-email" class="form-control" placeholder="you@example.com" required autocomplete="email">
                </div>

                <div class="form-group">
                    <label class="form-label">Password *</label>
                    <div class="input-password-wrapper">
                        <input type="password" name="password" id="reg-password" class="form-control" placeholder="At least 8 characters" required autocomplete="new-password">
                        <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility('reg-password', this)" title="Show/Hide Password" aria-label="Toggle password visibility">👁️</button>
                    </div>
                    <div class="password-hint">Must be 8–128 characters with at least one letter and one number.</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Confirm Password *</label>
                    <div class="input-password-wrapper">
                        <input type="password" name="confirmPassword" id="reg-confirm-password" class="form-control" placeholder="Re-enter your password" required autocomplete="new-password">
                        <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility('reg-confirm-password', this)" title="Show/Hide Password" aria-label="Toggle password visibility">👁️</button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Delivery Address (Optional)</label>
                    <textarea name="address" id="reg-address" class="form-control" rows="2" placeholder="Street name, Area, City" autocomplete="street-address"></textarea>
                </div>

                <div style="margin: 24px 0 16px;">
                    <button type="submit" id="submit-btn" class="btn btn-block" style="padding: 13px; font-size: 16px;">
                        Create Account →
                    </button>
                </div>
            </form>

            <div style="text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-muted);">
                Already registered? <a href="<%=request.getContextPath()%>/login" style="color: var(--primary); font-weight: 700; text-decoration: none;">Sign in here</a>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <script>
        function togglePasswordVisibility(inputId, btn) {
            const input = document.getElementById(inputId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        }

        function handleRegisterSubmit(e) {
            const errBox = document.getElementById('client-error-box');
            errBox.style.display = 'none';

            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm-password').value;

            if (password.length < 8) {
                errBox.textContent = '⚠️ Password must be at least 8 characters long.';
                errBox.style.display = 'block';
                return false;
            }

            if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
                errBox.textContent = '⚠️ Password must contain at least one letter and one number.';
                errBox.style.display = 'block';
                return false;
            }

            if (password !== confirm) {
                errBox.textContent = '⚠️ Passwords do not match. Please re-enter confirm password.';
                errBox.style.display = 'block';
                return false;
            }

            // Prevent duplicate submissions and show loading state
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.textContent = 'Creating Account...';
            return true;
        }
    </script>
</body>
</html>
