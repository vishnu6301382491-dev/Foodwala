<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.OrderItem" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.Menu" %>
<%@ page import="com.tap.daoimpl.OrderDAOImpl" %>
<%@ page import="com.tap.daoimpl.OrderItemDAOImpl" %>
<%@ page import="com.tap.daoimpl.MenuDAOImpl" %>
<%
    Order order = (Order) request.getAttribute("order");
    List<OrderItem> items = (List<OrderItem>) request.getAttribute("orderItems");

    // Fallback: If accessed directly with ?orderId=X
    if (order == null) {
        String idParam = request.getParameter("orderId");
        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                int oId = Integer.parseInt(idParam.trim());
                order = new OrderDAOImpl().getOrder(oId);
                items = new OrderItemDAOImpl().getOrderItemsByOrderId(oId);
            } catch (Exception ignored) {}
        }
    }

    Cart cart = (Cart) session.getAttribute("cart");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
    MenuDAOImpl menuDAO = new MenuDAOImpl();
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed - FoodWala</title>
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
        <% if (order == null) { %>
            <div class="empty-state">
                <div class="empty-icon">❓</div>
                <h2 class="empty-title">Order Not Found</h2>
                <p class="empty-subtitle">We couldn't retrieve the details for this order.</p>
                <a href="<%=request.getContextPath()%>/restaurants" class="btn">Explore Restaurants</a>
            </div>
        <% } else { %>
            <div class="confirmation-card">
                <div class="success-icon-wrap">
                    ✓
                </div>

                <h1 style="font-size: 28px; font-weight: 800; color: var(--dark); margin-bottom: 6px;">
                    Order Placed Successfully!
                </h1>
                <p style="color: var(--text-muted); font-size: 15px; margin-bottom: 24px;">
                    Your food is being prepared with love and will arrive in approx <strong>30 minutes</strong>.
                </p>

                <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; justify-content: space-around; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Order ID</div>
                        <div style="font-size: 16px; font-weight: 800; color: var(--primary);">#FW-<%=order.getOrderId()%></div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status</div>
                        <div><span class="status-pill status-placed"><%=order.getStatus()%></span></div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Payment Mode</div>
                        <div style="font-size: 15px; font-weight: 700; color: var(--dark);"><%=order.getPaymentMode()%></div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Paid / Due</div>
                        <div style="font-size: 16px; font-weight: 800; color: #047857;">₹<%=String.format("%.2f", order.getTotalAmount())%></div>
                    </div>
                </div>

                <!-- ORDER ITEMS BREAKDOWN -->
                <% if (items != null && !items.isEmpty()) { %>
                    <h3 style="text-align: left; font-size: 16px; font-weight: 700; margin-bottom: 10px; color: var(--dark);">
                        Items Ordered (<%=items.size()%>)
                    </h3>
                    <table class="receipt-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% for (OrderItem oi : items) { 
                                Menu m = menuDAO.getMenu(oi.getMenuId());
                                String itemName = (m != null) ? m.getItemName() : ("Dish #" + oi.getMenuId());
                            %>
                                <tr>
                                    <td>
                                        <span class="veg-tag" style="margin-right: 6px;"></span>
                                        <strong><%=itemName%></strong>
                                    </td>
                                    <td style="text-align: center;"><%=oi.getQuantity()%></td>
                                    <td style="text-align: right; font-weight: 700;">₹<%=String.format("%.2f", oi.getTotalPrice())%></td>
                                </tr>
                            <% } %>
                        </tbody>
                    </table>
                <% } %>

                <div style="display: flex; justify-content: center; gap: 14px; margin-top: 26px; flex-wrap: wrap;">
                    <a href="<%=request.getContextPath()%>/orders" class="btn">
                        View All My Orders
                    </a>
                    <a href="<%=request.getContextPath()%>/restaurants" class="btn btn-secondary">
                        Order More Food
                    </a>
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
