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
                <div class="alert alert-error">
                    ⚠️ <%=request.getAttribute("error")%>
                </div>
            <% } %>

            <form action="<%=request.getContextPath()%>/register" method="post">
                <div class="form-group">
                    <label class="form-label">Full Name / Username *</label>
                    <input type="text" name="username" class="form-control" placeholder="e.g. Vishnu Vardhan" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" name="email" class="form-control" placeholder="you@example.com" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Password *</label>
                    <input type="password" name="password" class="form-control" placeholder="Create a strong password" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Mobile Number</label>
                    <input type="tel" name="phone" class="form-control" placeholder="10-digit mobile number">
                </div>

                <div class="form-group">
                    <label class="form-label">Delivery Address</label>
                    <textarea name="address" class="form-control" rows="2" placeholder="Street name, Area, City"></textarea>
                </div>

                <div style="margin: 24px 0 16px;">
                    <button type="submit" class="btn btn-block" style="padding: 13px; font-size: 16px;">
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

</body>
</html>
