<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.daoimpl.RestaurantDAOImpl" %>
<%
    List<Order> orders = (List<Order>) request.getAttribute("orders");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    if (orders == null && loggedInUser != null) {
        try {
            orders = new com.tap.daoimpl.OrderDAOImpl().getOrdersByUserId(loggedInUser.getUserId());
        } catch (Exception ignored) {}
    }
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
    RestaurantDAOImpl restaurantDAO = new RestaurantDAOImpl();
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Orders - FoodWala</title>
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
                    <a href="<%=request.getContextPath()%>/profile" class="nav-link">My Profile</a>
                    <a href="<%=request.getContextPath()%>/orders" class="nav-link" style="color: var(--primary);">My Orders</a>
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
            <h1 class="page-title">My Orders</h1>
            <p class="page-subtitle">Track live delivery status, inspect snapshotted receipts, and reorder favorites</p>
        </div>

        <% if (orders == null || orders.isEmpty()) { %>
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h2 class="empty-title">No Orders Yet!</h2>
                <p class="empty-subtitle">You have not placed any orders yet. Discover delicious food from our handpicked restaurants in Bengaluru.</p>
                <a href="<%=request.getContextPath()%>/restaurants" class="btn">Explore Restaurants</a>
            </div>
        <% } else { %>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <% for (Order o : orders) { 
                    Restaurant r = restaurantDAO.getRestaurantById(o.getRestaurantId());
                    String restName = (r != null) ? r.getName() : ("Restaurant #" + o.getRestaurantId());
                    String status = (o.getStatus() != null) ? o.getStatus() : "PLACED";
                    boolean isDelivered = "DELIVERED".equalsIgnoreCase(status);
                %>
                    <div class="order-card">
                        <div>
                            <div class="order-id-badge">Order #FW-<%=o.getOrderId()%></div>
                            <div style="font-weight: 800; color: var(--dark); font-size: 17px; margin-bottom: 4px;">
                                🏪 <%=restName%>
                            </div>
                            <div class="order-meta-text">
                                📅 <%=o.getOrderDate() != null ? o.getOrderDate().toString().substring(0, 16) : "Recent"%> • Payment: <strong><%=o.getPaymentMode()%></strong> (<%=o.getPaymentStatus()%>)
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                📍 <%=o.getDeliveryAddress()%>
                            </div>
                        </div>

                        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <div style="font-size: 18px; font-weight: 800; color: var(--primary);">
                                ₹<%=String.format("%.2f", o.getTotalAmount())%>
                            </div>
                            <div>
                                <span class="status-pill status-<%=status.toLowerCase()%>">
                                    <%=status%>
                                </span>
                            </div>
                            <div style="display: flex; gap: 6px; margin-top: 4px;">
                                <% if (!isDelivered && !"CANCELLED".equalsIgnoreCase(status)) { %>
                                    <a href="<%=request.getContextPath()%>/order-track?orderId=<%=o.getOrderId()%>" class="btn btn-sm" style="background: #10b981;">
                                        Track 📍
                                    </a>
                                <% } %>
                                <a href="<%=request.getContextPath()%>/order-details?orderId=<%=o.getOrderId()%>" class="btn btn-secondary btn-sm">
                                    Details &amp; Receipt 🧾
                                </a>
                            </div>
                        </div>
                    </div>
                <% } %>
            </div>
        <% } %>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

</body>
</html>
