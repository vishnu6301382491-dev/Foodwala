<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.OrderItem" %>
<%@ page import="com.tap.model.OrderStatusHistory" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.DeliveryPartner" %>
<%@ page import="com.tap.model.Payment" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.Cart" %>
<%
    Order order = (Order) request.getAttribute("order");
    Restaurant restaurant = (Restaurant) request.getAttribute("restaurant");
    List<OrderItem> items = (List<OrderItem>) request.getAttribute("orderItems");
    List<OrderStatusHistory> history = (List<OrderStatusHistory>) request.getAttribute("history");
    DeliveryPartner partner = (DeliveryPartner) request.getAttribute("partner");
    Payment payment = (Payment) request.getAttribute("payment");

    User loggedInUser = (User) session.getAttribute("loggedInUser");
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;

    String status = (order != null && order.getStatus() != null) ? order.getStatus() : "PLACED";
    boolean isDelivered = "DELIVERED".equalsIgnoreCase(status);
    String errorTitle = (String) request.getAttribute("errorTitle");
    String errorMessage = (String) request.getAttribute("errorMessage");
    String titleText = (order != null) ? ("Order Details #FW-" + order.getOrderId()) : (errorTitle != null ? errorTitle : "Order Not Found");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%=titleText%> - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 24px;
        }
        @media (max-width: 860px) {
            .details-grid {
                grid-template-columns: 1fr;
            }
        }
        .history-timeline {
            border-left: 2px solid var(--border-color);
            margin-left: 14px;
            padding-left: 20px;
            position: relative;
        }
        .history-node {
            position: relative;
            margin-bottom: 20px;
        }
        .history-node::before {
            content: '';
            position: absolute;
            left: -27px;
            top: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
            border: 2px solid white;
            box-shadow: 0 0 0 2px var(--primary);
        }
        .error-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 40px 30px;
            text-align: center;
            max-width: 600px;
            margin: 40px auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.06);
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
        <% if (order == null) { %>
            <!-- GRACEFUL ERROR CARD (NOT A RAW TOMCAT ERROR) -->
            <div class="error-card">
                <div style="font-size: 54px; margin-bottom: 16px;">🔍</div>
                <h1 style="font-size: 24px; font-weight: 800; color: var(--dark); margin-bottom: 10px;">
                    <%= errorTitle != null ? errorTitle : "Order Not Found" %>
                </h1>
                <p style="font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px;">
                    <%= errorMessage != null ? errorMessage : "The requested order does not exist or you do not have permission to view it." %>
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <a href="<%=request.getContextPath()%>/home" class="btn" style="padding: 10px 20px;">
                        🏠 Return to Home
                    </a>
                    <% if (loggedInUser != null) { %>
                        <a href="<%=request.getContextPath()%>/orders" class="btn btn-secondary" style="padding: 10px 20px;">
                            📦 View My Orders
                        </a>
                    <% } else { %>
                        <a href="<%=request.getContextPath()%>/login" class="btn btn-secondary" style="padding: 10px 20px;">
                            🔑 Login to Account
                        </a>
                    <% } %>
                    <a href="<%=request.getContextPath()%>/restaurants" class="btn btn-secondary" style="padding: 10px 20px;">
                        🍽️ Browse Restaurants
                    </a>
                </div>
            </div>
        <% } else { %>
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                        <h1 class="page-title" style="margin-bottom: 0;">Order #FW-<%=order.getOrderId()%></h1>
                        <span class="status-pill status-<%=status.toLowerCase()%>"><%=status%></span>
                    </div>
                    <p class="page-subtitle">
                        Placed on <%=order.getOrderDate() != null ? order.getOrderDate().toString().substring(0, 16) : "Recently"%>
                    </p>
                </div>

                <div style="display: flex; gap: 10px;">
                    <% if (!isDelivered && !"CANCELLED".equalsIgnoreCase(status) && !"FAILED".equalsIgnoreCase(order.getPaymentStatus())) { %>
                        <a href="<%=request.getContextPath()%>/order-track?orderId=<%=order.getOrderId()%>" class="btn" style="background: #10b981;">
                            📍 Live Delivery Tracking →
                        </a>
                    <% } %>
                    <a href="<%=request.getContextPath()%>/restaurants" class="btn btn-secondary">
                        Browse Restaurants
                    </a>
                </div>
            </div>

            <div class="details-grid">
            <!-- LEFT COLUMN: ITEMS & SNAPSHOTS -->
            <div>
                <!-- RESTAURANT & DELIVERY DETAILS -->
                <div class="cart-panel" style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <h3 style="font-size: 14px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                                🏪 Ordered From
                            </h3>
                            <% if (restaurant != null) { %>
                                <div style="font-weight: 800; font-size: 16px; color: var(--dark);"><%=restaurant.getName()%></div>
                                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;"><%=restaurant.getAddress()%></div>
                                <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">📞 <%=restaurant.getPhone()%></div>
                                <div style="margin-top: 8px;">
                                    <a href="<%=request.getContextPath()%>/menu?restaurantId=<%=restaurant.getRestaurantId()%>" style="font-size: 12px; font-weight: 700; color: var(--primary);">
                                        View Restaurant Menu ↗
                                    </a>
                                </div>
                            <% } else { %>
                                <div style="font-weight: 700;">Restaurant #<%=order.getRestaurantId()%></div>
                            <% } %>
                        </div>

                        <div>
                            <h3 style="font-size: 14px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
                                📍 Delivery Destination
                            </h3>
                            <div style="font-weight: 800; font-size: 16px; color: var(--dark); display: flex; align-items: center; gap: 8px;">
                                <span>👤 <%= (order.getCustomerName() != null && !order.getCustomerName().isBlank()) ? order.getCustomerName() : "Valued Customer" %></span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                                📞 <%= (order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()) ? order.getCustomerPhone() : "Contact phone unavailable" %>
                                <% if (order.getCustomerEmail() != null && !order.getCustomerEmail().isBlank()) { %>
                                    • ✉️ <%=order.getCustomerEmail()%>
                                <% } %>
                            </div>

                            <!-- STRUCTURED ADDRESS SNAPSHOT -->
                            <div style="margin-top: 10px; font-size: 13px; color: var(--dark); background: var(--bg-main); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); line-height: 1.5;">
                                <% if (order.getHouseNumber() != null && !order.getHouseNumber().isBlank()) { %>
                                    <div><strong>Flat/House:</strong> <%=order.getHouseNumber()%></div>
                                    <div><strong>Street:</strong> <%=order.getStreet()%></div>
                                    <div><strong>Area:</strong> <%=order.getArea()%></div>
                                    <div><strong>City &amp; State:</strong> <%=order.getCity()%>, <%=order.getState()%> - <strong><%=order.getPincode()%></strong></div>
                                    <% if (order.getLandmark() != null && !order.getLandmark().isBlank()) { %>
                                        <div style="color: #64748b;"><strong>Landmark:</strong> <%=order.getLandmark()%></div>
                                    <% } %>
                                    <% if (order.getDeliveryInstructions() != null && !order.getDeliveryInstructions().isBlank()) { %>
                                        <div style="margin-top: 4px; color: #b45309; font-weight: 600;"><strong>Instructions:</strong> <%=order.getDeliveryInstructions()%></div>
                                    <% } %>
                                <% } else if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().isBlank()) { %>
                                    <div><%=order.getDeliveryAddress()%></div>
                                <% } else { %>
                                    <div style="color: var(--text-muted); font-style: italic;">Delivery information unavailable</div>
                                <% } %>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ORDER ITEMS SNAPSHOT TABLE -->
                <div class="cart-panel" style="margin-bottom: 20px;">
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--dark); margin-bottom: 16px;">
                        🍽️ Order Items (Price Snapshot at Order Time)
                    </h3>

                    <table class="receipt-table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <% if (items != null) { 
                                for (OrderItem it : items) { %>
                                <tr>
                                    <td style="font-weight: 700; color: var(--dark);">
                                        <%= (it.getItemName() != null && !it.getItemName().isBlank()) ? it.getItemName() : "Item #" + it.getMenuId() %>
                                    </td>
                                    <td style="text-align: center; color: var(--text-muted); font-weight: 600;">
                                        <%=it.getQuantity()%>
                                    </td>
                                    <td style="text-align: right; color: var(--text-muted);">
                                        ₹<%=String.format("%.2f", it.getPriceAtOrder())%>
                                    </td>
                                    <td style="text-align: right; font-weight: 700; color: var(--dark);">
                                        ₹<%=String.format("%.2f", it.getTotalPrice())%>
                                    </td>
                                </tr>
                            <% } } %>
                        </tbody>
                    </table>
                </div>

                <!-- STATUS LIFECYCLE TIMELINE -->
                <div class="cart-panel">
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--dark); margin-bottom: 20px;">
                        📜 Order Status History
                    </h3>

                    <div class="history-timeline">
                        <% if (history != null && !history.isEmpty()) { 
                            for (OrderStatusHistory h : history) { %>
                            <div class="history-node">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <span style="font-weight: 800; color: var(--dark); font-size: 14px;">
                                        <%=h.getStatus()%>
                                    </span>
                                    <span style="font-size: 12px; color: var(--text-muted);">
                                        <%=h.getTimestamp() != null ? h.getTimestamp().toString().substring(0, 16) : ""%>
                                    </span>
                                </div>
                                <div style="font-size: 13px; color: var(--text-muted);">
                                    <%=h.getRemarks()%> <% if (h.getChangedBy() != null) { %><small style="color:var(--primary);">(by <%=h.getChangedBy()%>)</small><% } %>
                                </div>
                            </div>
                        <% } } else { %>
                            <div class="history-node">
                                <span style="font-weight: 800; color: var(--dark);"><%=order.getStatus()%></span>
                                <div style="font-size: 13px; color: var(--text-muted);">Order placed successfully</div>
                            </div>
                        <% } %>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: BILL & PAYMENT DETAILS -->
            <div>
                <!-- BILL BREAKDOWN -->
                <div class="summary-card" style="position: static; margin-bottom: 20px;">
                    <h3 class="summary-title">Financial Breakdown</h3>

                    <div class="summary-row">
                        <span>Items Subtotal</span>
                        <span>₹<%=String.format("%.2f", order.getItemTotal() > 0 ? order.getItemTotal() : (order.getTotalAmount() - order.getDeliveryFee() - order.getTaxes()))%></span>
                    </div>

                    <div class="summary-row">
                        <span>Delivery Fee</span>
                        <% if (order.getDeliveryFee() == 0.0) { %>
                            <span class="text-green">FREE</span>
                        <% } else { %>
                            <span>₹<%=String.format("%.2f", order.getDeliveryFee())%></span>
                        <% } %>
                    </div>

                    <div class="summary-row">
                        <span>Taxes &amp; Packaging</span>
                        <span>₹<%=String.format("%.2f", order.getTaxes())%></span>
                    </div>

                    <% if (order.getDiscount() > 0.0) { %>
                        <div class="summary-row">
                            <span class="text-green">Discount Applied</span>
                            <span class="text-green">-₹<%=String.format("%.2f", order.getDiscount())%></span>
                        </div>
                    <% } %>

                    <div class="summary-row total">
                        <span><%= "SUCCESS".equalsIgnoreCase(order.getPaymentStatus()) ? "Total Paid" : "Total Due" %></span>
                        <span style="color: var(--primary);">₹<%=String.format("%.2f", order.getTotalAmount())%></span>
                    </div>
                </div>

                <!-- PAYMENT RECORD CARD -->
                <div class="cart-panel" style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: var(--dark); margin: 0;">
                            💳 Payment &amp; Order Status
                        </h3>
                        <span style="background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">
                            SANDBOX GATEWAY
                        </span>
                    </div>

                    <div style="font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-muted);">Order Status:</span>
                        <span class="status-pill status-<%=order.getStatus().toLowerCase()%>" style="padding: 2px 8px; font-size: 11px; font-weight: 800;">
                            <%=order.getStatus()%>
                        </span>
                    </div>

                    <div style="font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-muted);">Payment Status:</span>
                        <span class="status-pill status-<%=order.getPaymentStatus().toLowerCase()%>" style="padding: 2px 8px; font-size: 11px; font-weight: 800; background: <%= "SUCCESS".equalsIgnoreCase(order.getPaymentStatus()) ? "#dcfce7" : ("PENDING".equalsIgnoreCase(order.getPaymentStatus()) ? "#fef3c7" : "#fee2e2") %>; color: <%= "SUCCESS".equalsIgnoreCase(order.getPaymentStatus()) ? "#166534" : ("PENDING".equalsIgnoreCase(order.getPaymentStatus()) ? "#92400e" : "#991b1b") %>;">
                            <%=order.getPaymentStatus()%>
                        </span>
                    </div>

                    <div style="font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Payment Method:</span>
                        <strong style="color: var(--dark);"><%=order.getPaymentMode()%></strong>
                    </div>

                    <% if (payment != null) { %>
                        <div style="font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">Transaction Ref:</span>
                            <code style="font-size: 11px; background:#f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;"><%=payment.getTransactionId()%></code>
                        </div>

                        <% if (payment.getMaskedAccount() != null && !payment.getMaskedAccount().isBlank()) { %>
                            <div style="font-size: 13px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted);">Account Reference:</span>
                                <strong style="color: var(--dark);"><%=payment.getMaskedAccount()%></strong>
                            </div>
                        <% } %>
                    <% } %>

                    <div style="margin-top: 12px; font-size: 11px; color: #475569; background: var(--bg-main); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); line-height: 1.4;">
                        🔒 <strong>Payment Security:</strong> Processed in FoodWala Sandbox Gateway. Bank credentials, passwords, and OTPs are never stored.
                    </div>
                </div>

                <!-- DELIVERY PARTNER CARD -->
                <% if (partner != null) { 
                    String pName = partner.getName() != null ? partner.getName() : "Rahul Kumar";
                    String pPhone = partner.getPhone() != null ? partner.getPhone() : "+91 98765-XXXXX";
                    String pVehicle = partner.getVehicleNumber() != null ? partner.getVehicleNumber() : "KA-04-EK-2024";
                    String vType = partner.getVehicleType() != null ? partner.getVehicleType() : "Honda Activa";
                    double rating = partner.getRating() > 0 ? partner.getRating() : 4.8;
                %>
                    <div class="cart-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h3 style="font-size: 16px; font-weight: 800; color: var(--dark); margin: 0;">
                                🛵 Delivery Partner
                            </h3>
                            <span style="background: #fef08a; color: #854d0e; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">
                                ⭐ <%=String.format("%.1f", rating)%> / 5.0
                            </span>
                        </div>

                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 14px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 2px solid #bae6fd; flex-shrink: 0;">
                                🛵
                            </div>
                            <div>
                                <div style="font-weight: 800; font-size: 15px; color: var(--dark);"><%=pName%></div>
                                <div style="font-size: 12px; color: var(--text-muted);"><%=vType%> • <%=pVehicle%></div>
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">📞 <%=pPhone%></div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px;">
                            <a href="tel:<%=pPhone%>" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center;">
                                📞 Call Partner
                            </a>
                            <% if (!isDelivered) { %>
                                <a href="<%=request.getContextPath()%>/order-track?orderId=<%=order.getOrderId()%>" class="btn btn-sm" style="flex: 1; text-align: center; background: #10b981;">
                                    📍 Live Track →
                                </a>
                            <% } %>
                        </div>
                    </div>
                <% } %>
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
