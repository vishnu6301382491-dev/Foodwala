<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.Collection" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.CartItem" %>
<%@ page import="com.tap.model.User" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
    Integer cartRestId = (Integer) session.getAttribute("cartRestaurantId");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Cart - FoodWala</title>
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
                <a href="<%=request.getContextPath()%>/cart" class="nav-link" style="color: var(--primary);">
                    🛒 Cart <% if(cartCount > 0) { %><span class="nav-badge"><%=cartCount%></span><% } %>
                </a>
                <% if(loggedInUser != null) { %>
                    <span class="user-pill">👤 <%=loggedInUser.getUsername()%></span>
                    <a href="<%=request.getContextPath()%>/profile" class="nav-link">My Profile</a>
                    <a href="<%=request.getContextPath()%>/orders" class="nav-link">My Orders</a>
                    <% if(loggedInUser.isRestaurant() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/restaurant/dashboard" class="nav-link" style="color:#d97706; font-weight:700;">🍽️ Rest. Portal</a>
                    <% } %>
                    <% if(loggedInUser.isDeliveryPartner() || loggedInUser.isAdmin()) { %>
                        <a href="<%=request.getContextPath()%>/delivery/dashboard" class="nav-link" style="color:#2563eb; font-weight:700;">🛵 Delivery Portal</a>
                    <% } %>
                    <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
                <% } else { %>
                    <a href="<%=request.getContextPath()%>/login" class="nav-link">Login</a>
                    <a href="<%=request.getContextPath()%>/register" class="btn btn-sm">Register</a>
                <% } %>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <div class="page-header">
            <h1 class="page-title">Shopping Cart</h1>
            <p class="page-subtitle">Review your selected items and proceed to delivery</p>
        </div>

        <% if (cart == null || cart.isEmpty()) { %>
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <h2 class="empty-title">Your Cart is Empty!</h2>
                <p class="empty-subtitle">Good food is always cooking! Add delicious dishes from our top restaurants to satisfy your hunger.</p>
                <a href="<%=request.getContextPath()%>/restaurants" class="btn">Explore Restaurants</a>
            </div>
        <% } else { 
            double itemTotal = cart.getTotalAmount();
            double deliveryFee = (itemTotal >= 500.0) ? 0.0 : 40.0;
            double taxes = itemTotal * 0.05; // 5% GST
            double grandTotal = itemTotal + deliveryFee + taxes;
            Collection<CartItem> items = cart.getCartItems();
        %>
            <div class="cart-layout">
                <!-- ITEMS LIST -->
                <div class="cart-panel">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="font-size: 20px; font-weight: 700; color: var(--dark);">Items in Your Order (<%=cartCount%>)</h2>
                        <form action="<%=request.getContextPath()%>/cart" method="post" style="display:inline;" onsubmit="return confirm('Clear all items from your cart?');">
                            <input type="hidden" name="action" value="clear">
                            <button type="submit" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: #fca5a5;">Clear Cart</button>
                        </form>
                    </div>

                    <table class="cart-items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Price</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <% for (CartItem item : items) { %>
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="veg-tag"></span>
                                            <div>
                                                <div class="cart-item-name"><%=item.getName()%></div>
                                                <div class="cart-item-price">₹<%=String.format("%.2f", item.getPrice())%> each</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align: center; font-weight: 600;">
                                        ₹<%=String.format("%.2f", item.getPrice())%>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="qty-counter">
                                            <!-- Decrease Button -->
                                            <form action="<%=request.getContextPath()%>/cart" method="post" style="display:inline;">
                                                <input type="hidden" name="action" value="update">
                                                <input type="hidden" name="itemId" value="<%=item.getItemId()%>">
                                                <input type="hidden" name="quantity" value="<%=item.getQuantity() - 1%>">
                                                <button type="submit" class="qty-btn" title="Decrease quantity">−</button>
                                            </form>
                                            
                                            <span class="qty-val"><%=item.getQuantity()%></span>
                                            
                                            <!-- Increase Button -->
                                            <form action="<%=request.getContextPath()%>/cart" method="post" style="display:inline;">
                                                <input type="hidden" name="action" value="update">
                                                <input type="hidden" name="itemId" value="<%=item.getItemId()%>">
                                                <input type="hidden" name="quantity" value="<%=item.getQuantity() + 1%>">
                                                <button type="submit" class="qty-btn" title="Increase quantity">+</button>
                                            </form>
                                        </div>
                                    </td>
                                    <td style="text-align: right; font-weight: 700; font-size: 16px; color: var(--dark);">
                                        ₹<%=String.format("%.2f", item.getTotalPrice())%>
                                    </td>
                                    <td style="text-align: right;">
                                        <!-- Remove Item -->
                                        <form action="<%=request.getContextPath()%>/cart" method="post" style="display:inline;">
                                            <input type="hidden" name="action" value="remove">
                                            <input type="hidden" name="itemId" value="<%=item.getItemId()%>">
                                            <button type="submit" class="remove-btn" title="Remove item">🗑️</button>
                                        </form>
                                    </td>
                                </tr>
                            <% } %>
                        </tbody>
                    </table>

                    <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <% if(cartRestId != null) { %>
                            <a href="<%=request.getContextPath()%>/menu?restaurantId=<%=cartRestId%>" class="btn btn-secondary">
                                ← Add More Dishes from Restaurant
                            </a>
                        <% } else { %>
                            <a href="<%=request.getContextPath()%>/restaurants" class="btn btn-secondary">
                                ← Add More Dishes
                            </a>
                        <% } %>
                    </div>
                </div>

                <!-- BILL DETAILS CARD -->
                <div class="summary-card">
                    <h3 class="summary-title">Bill Details</h3>
                    <div class="summary-row">
                        <span>Item Total</span>
                        <span>₹<%=String.format("%.2f", itemTotal)%></span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery Partner Fee</span>
                        <% if (deliveryFee == 0.0) { %>
                            <span class="text-green">FREE</span>
                        <% } else { %>
                            <span>₹<%=String.format("%.2f", deliveryFee)%></span>
                        <% } %>
                    </div>
                    <% if (itemTotal < 500.0) { %>
                        <div style="font-size: 12px; color: var(--primary); margin-bottom: 12px; background: var(--primary-light); padding: 6px 10px; border-radius: 6px;">
                            💡 Add ₹<%=String.format("%.2f", 500.0 - itemTotal)%> more to get <strong>FREE delivery</strong>!
                        </div>
                    <% } %>
                    <div class="summary-row">
                        <span>Govt Taxes &amp; Charges (5%)</span>
                        <span>₹<%=String.format("%.2f", taxes)%></span>
                    </div>
                    <div class="summary-row total">
                        <span>To Pay</span>
                        <span style="color: var(--primary);">₹<%=String.format("%.2f", grandTotal)%></span>
                    </div>

                    <div style="margin-top: 20px;">
                        <a href="<%=request.getContextPath()%>/checkout" class="btn btn-block" style="padding: 14px; font-size: 16px;">
                            Proceed to Checkout →
                        </a>
                    </div>

                    <div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        🔒 Safe &amp; Secure 256-bit Encrypted Checkout
                    </div>
                </div>
            </div>
        <% } %>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

</body>
</html>