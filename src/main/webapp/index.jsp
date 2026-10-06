<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.User" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FoodWala - Delicious Food Delivered Fast</title>
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
                <% if(loggedInUser != null) { %>
                    <span class="user-pill">👤 <%=loggedInUser.getUsername()%></span>
                    <a href="<%=request.getContextPath()%>/orders" class="nav-link">My Orders</a>
                    <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
                <% } else { %>
                    <a href="<%=request.getContextPath()%>/login" class="nav-link">Login</a>
                    <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
                <% } %>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <!-- HERO CARD -->
        <section class="hero-card">
            <span class="hero-tag">🚀 Fast &amp; Fresh Delivery</span>
            <h1 class="hero-title">Delicious Food Delivered<br>Straight to Your Doorstep</h1>
            <p class="hero-desc">
                From crispy Benne Dosas at CTR to aromatic Hyderabadi Biryani and decadent DBC Sundaes, discover the finest culinary gems of Bengaluru.
            </p>
            <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
                <a href="<%=request.getContextPath()%>/restaurants" class="btn" style="padding: 14px 28px; font-size: 16px;">
                    Explore Top Restaurants →
                </a>
                <% if (loggedInUser == null) { %>
                    <a href="<%=request.getContextPath()%>/login" class="btn btn-secondary" style="padding: 14px 24px; font-size: 16px;">
                        Customer Login
                    </a>
                <% } else { %>
                    <a href="<%=request.getContextPath()%>/orders" class="btn btn-secondary" style="padding: 14px 24px; font-size: 16px;">
                        Track Past Orders
                    </a>
                <% } %>
            </div>

            <div class="hero-features">
                <div class="hero-feature-item">⚡ 30-Min Fast Delivery</div>
                <div class="hero-feature-item">⭐ 4.5+ Star Iconic Eateries</div>
                <div class="hero-feature-item">🔒 100% Contactless Delivery</div>
                <div class="hero-feature-item">💵 Cash On Delivery &amp; UPI</div>
            </div>
        </section>

        <!-- POPULAR HIGHLIGHTS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 20px;">
            <div style="background: white; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🥞</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--dark); margin-bottom: 6px;">Authentic South Indian</h3>
                <p style="font-size: 14px; color: var(--text-muted);">Crispy Masala Dosas, steaming Idlis &amp; aromatic filter coffees.</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🍗</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--dark); margin-bottom: 6px;">Rich Dum Biryanis</h3>
                <p style="font-size: 14px; color: var(--text-muted);">Flavorful slow-cooked Donne &amp; Hyderabadi spiced rice dishes.</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color); text-align: center;">
                <div style="font-size: 36px; margin-bottom: 10px;">🍨</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--dark); margin-bottom: 6px;">Heavenly Desserts</h3>
                <p style="font-size: 14px; color: var(--text-muted);">Iconic sundaes, shakes, fresh baked pastries, and ice creams.</p>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

</body>
</html>
