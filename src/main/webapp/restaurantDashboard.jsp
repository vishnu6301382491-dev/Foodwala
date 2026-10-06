<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Map" %>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.OrderItem" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.User" %>
<%
    Restaurant restaurant = (Restaurant) request.getAttribute("restaurant");
    List<Order> orders = (List<Order>) request.getAttribute("orders");
    Map<Integer, List<OrderItem>> orderItemsMap = (Map<Integer, List<OrderItem>>) request.getAttribute("orderItemsMap");
    User loggedInUser = (User) session.getAttribute("loggedInUser");

    int totalOrders = (orders != null) ? orders.size() : 0;
    int activeOrders = 0;
    int deliveredOrders = 0;
    double totalRevenue = 0.0;

    if (orders != null) {
        for (Order o : orders) {
            String s = o.getStatus();
            if ("DELIVERED".equalsIgnoreCase(s)) {
                deliveredOrders++;
                totalRevenue += o.getTotalAmount();
            } else if (!"CANCELLED".equalsIgnoreCase(s)) {
                activeOrders++;
            }
        }
    }
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurant Portal - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
</head>
<body>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala <span style="font-size: 14px; font-weight: 600; color: #d97706; margin-left: 6px;">Staff Portal</span>
            </a>
            <nav class="nav-links">
                <a href="<%=request.getContextPath()%>/restaurants" class="nav-link">Main Site</a>
                <span class="user-pill" style="background:#fef3c7; color:#b45309;">👨‍🍳 <%=loggedInUser != null ? loggedInUser.getUsername() : "Staff"%></span>
                <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <!-- RESTAURANT BANNER -->
        <div class="restaurant-banner" style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a;">
            <div>
                <span style="background: #f59e0b; color: white; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">
                    Official Restaurant Dashboard
                </span>
                <h1 style="font-size: 26px; font-weight: 800; color: #78350f; margin-top: 6px;">
                    <%=restaurant != null ? restaurant.getName() : "Vidyarthi Bhavan Basavanagudi"%>
                </h1>
                <p style="color: #92400e; font-size: 14px;">
                    📍 <%=restaurant != null ? restaurant.getAddress() : "Basavanagudi, Bengaluru"%> • 📞 <%=restaurant != null ? restaurant.getPhone() : "+91 80 2667 7588"%>
                </p>
            </div>
            <div>
                <a href="<%=request.getContextPath()%>/menu?restaurantId=<%=restaurant != null ? restaurant.getRestaurantId() : 2%>" class="btn btn-secondary" target="_blank">
                    Preview Public Menu ↗
                </a>
            </div>
        </div>

        <!-- STATS CARDS -->
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-label">Active Orders</div>
                <div class="stat-val" style="color: var(--primary);"><%=activeOrders%></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Delivered Orders</div>
                <div class="stat-val" style="color: #10b981;"><%=deliveredOrders%></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Orders</div>
                <div class="stat-val"><%=totalOrders%></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-val" style="color: #2563eb;">₹<%=String.format("%.2f", totalRevenue)%></div>
            </div>
        </div>

        <!-- ORDERS INCOMING & PROCESSING -->
        <div class="page-header" style="margin-top: 10px;">
            <h2 class="page-title" style="font-size: 22px;">Incoming Kitchen Orders</h2>
            <p class="page-subtitle">Accept, prepare, and notify delivery riders when orders are ready for pickup</p>
        </div>

        <% if (orders == null || orders.isEmpty()) { %>
            <div class="empty-state">
                <div class="empty-icon">🍳</div>
                <h3 class="empty-title">No Orders Received Yet</h3>
                <p class="empty-subtitle">New customer orders placed for this restaurant will appear here in real-time.</p>
            </div>
        <% } else { %>
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <% for (Order o : orders) { 
                    String st = o.getStatus() != null ? o.getStatus() : "PLACED";
                    List<OrderItem> items = (orderItemsMap != null) ? orderItemsMap.get(o.getOrderId()) : null;
                %>
                    <div class="cart-panel" style="border-left: 5px solid <%= "DELIVERED".equalsIgnoreCase(st) ? "#10b981" : "var(--primary)" %>;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 18px; font-weight: 800; color: var(--dark);">
                                        Order #FW-<%=o.getOrderId()%>
                                    </span>
                                    <span class="status-pill status-<%=st.toLowerCase()%>"><%=st%></span>
                                </div>
                                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                                    📅 <%=o.getOrderDate() != null ? o.getOrderDate().toString().substring(0, 16) : "Recent"%> • 
                                    Customer: <strong><%=o.getCustomerName() != null ? o.getCustomerName() : "Guest"%></strong> (📞 <%=o.getCustomerPhone()%>)
                                </div>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                                    📍 Deliver to: <%=o.getDeliveryAddress()%>
                                </div>
                            </div>

                            <div style="text-align: right;">
                                <div style="font-size: 20px; font-weight: 800; color: var(--dark);">
                                    ₹<%=String.format("%.2f", o.getTotalAmount())%>
                                </div>
                                <span style="font-size: 12px; color: var(--text-muted);">
                                    Mode: <strong><%=o.getPaymentMode()%></strong> (<%=o.getPaymentStatus()%>)
                                </span>
                            </div>
                        </div>

                        <!-- ITEMS ORDERED -->
                        <div style="background: var(--bg-main); padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                                Dish Items:
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                <% if (items != null && !items.isEmpty()) { 
                                    for (OrderItem it : items) { %>
                                    <div style="display: flex; justify-content: space-between; font-size: 14px;">
                                        <span>
                                            <strong><%=it.getQuantity()%> ×</strong> <%=it.getItemName() != null ? it.getItemName() : "Item #" + it.getMenuId()%>
                                        </span>
                                        <span style="color: var(--text-muted);">
                                            ₹<%=String.format("%.2f", it.getTotalPrice())%>
                                        </span>
                                    </div>
                                <% } } else { %>
                                    <div style="font-size: 13px; color: var(--text-muted);">Order items registered in system</div>
                                <% } %>
                            </div>
                        </div>

                        <!-- RESTAURANT STATUS CONTROLS -->
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
                            <div style="font-size: 13px; color: var(--text-muted);">
                                <% if (o.getDeliveryPartnerId() != null) { %>
                                    🛵 Assigned to Delivery Partner #<%=o.getDeliveryPartnerId()%>
                                <% } else { %>
                                    ⌛ Waiting for delivery partner claim
                                <% } %>
                            </div>

                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <% if ("PLACED".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/restaurant/order-status" method="post" style="display: inline;">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="CONFIRMED">
                                        <input type="hidden" name="remarks" value="Order accepted by restaurant kitchen">
                                        <button type="submit" class="btn btn-sm" style="background:#2563eb;">
                                            ✓ Accept Order
                                        </button>
                                    </form>
                                <% } %>

                                <% if ("CONFIRMED".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/restaurant/order-status" method="post" style="display: inline;">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="PREPARING">
                                        <input type="hidden" name="remarks" value="Food is being freshly prepared in kitchen">
                                        <button type="submit" class="btn btn-sm" style="background:#d97706;">
                                            🍳 Start Preparing
                                        </button>
                                    </form>
                                <% } %>

                                <% if ("PREPARING".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/restaurant/order-status" method="post" style="display: inline;">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="READY_FOR_PICKUP">
                                        <input type="hidden" name="remarks" value="Order packed and ready for delivery partner pickup">
                                        <button type="submit" class="btn btn-sm" style="background:#10b981;">
                                            📦 Mark Ready for Pickup
                                        </button>
                                    </form>
                                <% } %>

                                <% if ("READY_FOR_PICKUP".equalsIgnoreCase(st)) { %>
                                    <span style="font-size: 13px; font-weight: 700; color: #0891b2; background: #cffafe; padding: 6px 12px; border-radius: 6px;">
                                        📦 Awaiting Rider Pickup
                                    </span>
                                <% } %>

                                <% if ("PICKED_UP".equalsIgnoreCase(st) || "OUT_FOR_DELIVERY".equalsIgnoreCase(st)) { %>
                                    <span style="font-size: 13px; font-weight: 700; color: #ea580c; background: #ffedd5; padding: 6px 12px; border-radius: 6px;">
                                        🛵 Rider On Road to Customer
                                    </span>
                                <% } %>

                                <% if ("DELIVERED".equalsIgnoreCase(st)) { %>
                                    <span style="font-size: 13px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px;">
                                        ✓ Completed &amp; Delivered
                                    </span>
                                <% } %>

                                <% if (!"DELIVERED".equalsIgnoreCase(st) && !"CANCELLED".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/restaurant/order-status" method="post" style="display: inline;" onsubmit="return confirm('Reject / Cancel this order?');">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="CANCELLED">
                                        <input type="hidden" name="remarks" value="Order cancelled by restaurant">
                                        <button type="submit" class="btn btn-danger btn-sm" style="background:#dc2626;">
                                            Cancel
                                        </button>
                                    </form>
                                <% } %>

                                <a href="<%=request.getContextPath()%>/order-track?orderId=<%=o.getOrderId()%>" class="btn btn-secondary btn-sm" target="_blank">
                                    Track 📍
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
