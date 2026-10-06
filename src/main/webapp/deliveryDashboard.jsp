<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.DeliveryPartner" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.daoimpl.RestaurantDAOImpl" %>
<%@ page import="com.tap.model.Restaurant" %>
<%
    DeliveryPartner partner = (DeliveryPartner) request.getAttribute("partner");
    List<Order> assignedOrders = (List<Order>) request.getAttribute("assignedOrders");
    List<Order> availableOrders = (List<Order>) request.getAttribute("availableOrders");
    User loggedInUser = (User) session.getAttribute("loggedInUser");

    RestaurantDAOImpl restaurantDAO = new RestaurantDAOImpl();

    String successMsg = (String) session.getAttribute("successMessage");
    if (successMsg != null) session.removeAttribute("successMessage");

    String errorMsg = (String) session.getAttribute("errorMessage");
    if (errorMsg != null) session.removeAttribute("errorMessage");

    int activeCount = 0;
    int completedCount = 0;
    if (assignedOrders != null) {
        for (Order o : assignedOrders) {
            if ("DELIVERED".equalsIgnoreCase(o.getStatus())) {
                completedCount++;
            } else if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                activeCount++;
            }
        }
    }
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Partner Portal - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .partner-status-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
        }
        .partner-status-tag.online {
            background: #dcfce7;
            color: #166534;
        }
        .partner-status-tag.offline {
            background: #f1f5f9;
            color: #475569;
        }
    </style>
</head>
<body>

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala <span style="font-size: 14px; font-weight: 600; color: #2563eb; margin-left: 6px;">Rider Portal</span>
            </a>
            <nav class="nav-links">
                <a href="<%=request.getContextPath()%>/restaurants" class="nav-link">Main Site</a>
                <span class="user-pill" style="background:#dbeafe; color:#1d4ed8;">🛵 <%=partner != null ? partner.getName() : "Partner"%></span>
                <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <!-- ALERTS -->
        <% if (successMsg != null) { %>
            <div class="alert alert-success">
                ✓ <%=successMsg%>
            </div>
        <% } %>
        <% if (errorMsg != null) { %>
            <div class="alert alert-error">
                ⚠️ <%=errorMsg%>
            </div>
        <% } %>

        <!-- PARTNER PROFILE & LIVE STATUS BANNER -->
        <div class="restaurant-banner" style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe;">
            <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                    <span class="partner-status-tag <%= (partner != null && partner.isAvailable()) ? "online" : "offline" %>">
                        <%= (partner != null && partner.isAvailable()) ? "🟢 ONLINE / READY FOR ORDERS" : "⚪ OFFLINE" %>
                    </span>
                    <span style="font-size: 13px; color: var(--text-muted);">Vehicle: <strong><%=partner != null ? partner.getVehicleNumber() : "KA-05-EJ-1234"%></strong></span>
                </div>
                <h1 style="font-size: 26px; font-weight: 800; color: #1e3a8a;">
                    Delivery Partner: <%=partner != null ? partner.getName() : "Rider"%>
                </h1>
                <p style="color: #1d4ed8; font-size: 14px;">
                    📞 Contact: <%=partner != null ? partner.getPhone() : ""%> • Operational Zone: Basavanagudi &amp; South Bengaluru
                </p>

                <!-- LIVE GPS BROADCASTER STATUS -->
                <div id="gpsBroadcastStatus" style="margin-top: 10px; font-size: 13px; color: #059669; font-weight: 700; background: white; padding: 6px 12px; border-radius: 8px; display: inline-block;">
                    🔄 Initializing real-time GPS broadcaster...
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <form action="<%=request.getContextPath()%>/delivery/toggle-status" method="post">
                    <button type="submit" class="btn btn-secondary">
                        <%= (partner != null && partner.isAvailable()) ? "Go Offline ⏸️" : "Go Online ▶️" %>
                    </button>
                </form>
            </div>
        </div>

        <!-- STATS -->
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="stat-label">Active Assigned Deliveries</div>
                <div class="stat-val" style="color: var(--primary);"><%=activeCount%></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Completed Deliveries</div>
                <div class="stat-val" style="color: #10b981;"><%=completedCount%></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Available Orders in City</div>
                <div class="stat-val" style="color: #2563eb;"><%=availableOrders != null ? availableOrders.size() : 0%></div>
            </div>
        </div>

        <!-- SECTION 1: MY ACTIVE ASSIGNED DELIVERIES -->
        <div class="page-header" style="margin-top: 10px;">
            <h2 class="page-title" style="font-size: 22px;">My Active Deliveries</h2>
            <p class="page-subtitle">Pick up packaged food from restaurants and deliver promptly to customers</p>
        </div>

        <% if (assignedOrders == null || assignedOrders.isEmpty()) { %>
            <div class="empty-state" style="padding: 30px; margin-bottom: 30px;">
                <div class="empty-icon">🛵</div>
                <h3 class="empty-title">No Active Assigned Deliveries</h3>
                <p class="empty-subtitle">Check the available orders list below to accept new deliveries in Bengaluru.</p>
            </div>
        <% } else { %>
            <div style="display: flex; flex-direction: column; gap: 18px; margin-bottom: 36px;">
                <% for (Order o : assignedOrders) { 
                    String st = o.getStatus() != null ? o.getStatus() : "CONFIRMED";
                    Restaurant r = restaurantDAO.getRestaurantById(o.getRestaurantId());
                    boolean isDelivered = "DELIVERED".equalsIgnoreCase(st);
                %>
                    <div class="cart-panel" style="border-left: 5px solid <%= isDelivered ? "#10b981" : "#2563eb" %>;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 18px; font-weight: 800; color: var(--dark);">
                                        Order #FW-<%=o.getOrderId()%>
                                    </span>
                                    <span class="status-pill status-<%=st.toLowerCase()%>"><%=st%></span>
                                </div>
                                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                                    Customer: <strong><%=o.getCustomerName()%></strong> (📞 <a href="tel:<%=o.getCustomerPhone()%>"><%=o.getCustomerPhone()%></a>)
                                </div>
                            </div>

                            <div style="text-align: right;">
                                <div style="font-size: 18px; font-weight: 800; color: var(--dark);">
                                    ₹<%=String.format("%.2f", o.getTotalAmount())%>
                                </div>
                                <div style="font-size: 12px; color: var(--text-muted);">
                                    Payment: <strong><%=o.getPaymentMode()%></strong> (<%=o.getPaymentStatus()%>)
                                </div>
                            </div>
                        </div>

                        <!-- ROUTE INFO -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: var(--bg-main); padding: 12px 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                            <div>
                                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">1. Pickup From:</div>
                                <div style="font-weight: 700; font-size: 14px; color: var(--dark);"><%=r != null ? r.getName() : "Restaurant"%></div>
                                <div style="font-size: 12px; color: var(--text-muted);"><%=r != null ? r.getAddress() : ""%></div>
                            </div>
                            <div>
                                <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">2. Deliver To:</div>
                                <div style="font-weight: 700; font-size: 14px; color: var(--dark);"><%=o.getCustomerName()%></div>
                                <div style="font-size: 12px; color: var(--text-muted);"><%=o.getDeliveryAddress()%></div>
                            </div>
                        </div>

                        <!-- STATUS TRANSITION BUTTONS -->
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <a href="<%=request.getContextPath()%>/order-track?orderId=<%=o.getOrderId()%>" class="btn btn-secondary btn-sm" target="_blank">
                                🗺️ Open Live Route Map
                            </a>

                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <% if ("CONFIRMED".equalsIgnoreCase(st) || "PREPARING".equalsIgnoreCase(st) || "READY_FOR_PICKUP".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/delivery/status" method="post" style="display: inline;">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="PICKED_UP">
                                        <input type="hidden" name="remarks" value="Order picked up from restaurant by <%=partner != null ? partner.getName() : "Partner"%>">
                                        <button type="submit" class="btn btn-sm" style="background:#7c3aed;">
                                            📦 Picked Up from Restaurant
                                        </button>
                                    </form>
                                <% } %>

                                <% if ("PICKED_UP".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/delivery/status" method="post" style="display: inline;">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="OUT_FOR_DELIVERY">
                                        <input type="hidden" name="remarks" value="Partner is on the way to delivery address">
                                        <button type="submit" class="btn btn-sm" style="background:#ea580c;">
                                            🛵 Start Transit (Out for Delivery)
                                        </button>
                                    </form>
                                <% } %>

                                <% if ("OUT_FOR_DELIVERY".equalsIgnoreCase(st)) { %>
                                    <form action="<%=request.getContextPath()%>/delivery/status" method="post" style="display: inline;" onsubmit="return confirm('Confirm order delivered and collect payment if COD?');">
                                        <input type="hidden" name="orderId" value="<%=o.getOrderId()%>">
                                        <input type="hidden" name="status" value="DELIVERED">
                                        <input type="hidden" name="remarks" value="Order safely delivered to recipient">
                                        <button type="submit" class="btn btn-sm" style="background:#16a34a; font-weight:800;">
                                            🎉 Mark Delivered to Customer
                                        </button>
                                    </form>
                                <% } %>

                                <% if (isDelivered) { %>
                                    <span style="font-size: 13px; font-weight: 700; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 6px;">
                                        ✓ Completed Delivery
                                    </span>
                                <% } %>
                            </div>
                        </div>
                    </div>
                <% } %>
            </div>
        <% } %>

        <!-- SECTION 2: AVAILABLE ORDERS TO CLAIM -->
        <div class="page-header" style="margin-top: 20px;">
            <h2 class="page-title" style="font-size: 22px;">Available Orders to Accept</h2>
            <p class="page-subtitle">Claim nearby orders and start earning delivery fee</p>
        </div>

        <% if (availableOrders == null || availableOrders.isEmpty()) { %>
            <div class="empty-state" style="padding: 30px;">
                <div class="empty-icon">📦</div>
                <h3 class="empty-title">No Unclaimed Orders Right Now</h3>
                <p class="empty-subtitle">New orders placed by customers in Bengaluru will appear here ready to claim.</p>
            </div>
        <% } else { %>
            <div style="display: flex; flex-direction: column; gap: 14px;">
                <% for (Order av : availableOrders) { 
                    Restaurant r = restaurantDAO.getRestaurantById(av.getRestaurantId());
                %>
                    <div class="order-card">
                        <div>
                            <div class="order-id-badge">Order #FW-<%=av.getOrderId()%></div>
                            <div style="font-weight: 700; color: var(--dark); font-size: 15px;">
                                🏪 <%=r != null ? r.getName() : "Restaurant"%> 
                                <span style="font-size: 12px; color: var(--text-muted); font-weight: 400;">(<%=r != null ? r.getAddress() : ""%>)</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                                📍 Delivery to: <strong><%=av.getDeliveryAddress()%></strong>
                            </div>
                            <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 4px;">
                                💰 Delivery Fee: ₹<%=String.format("%.2f", av.getDeliveryFee())%> • Bill Amount: ₹<%=String.format("%.2f", av.getTotalAmount())%>
                            </div>
                        </div>

                        <div>
                            <form action="<%=request.getContextPath()%>/delivery/accept" method="post">
                                <input type="hidden" name="orderId" value="<%=av.getOrderId()%>">
                                <button type="submit" class="btn btn-sm" style="background:#2563eb; font-weight:800; padding: 10px 18px;">
                                    ⚡ Accept Delivery
                                </button>
                            </form>
                        </div>
                    </div>
                <% } %>
            </div>
        <% } %>
    </div>

    <!-- LIVE GPS WATCH POSITION BROADCASTER SCRIPT -->
    <script>
    (function initGpsBroadcaster() {
        var statusEl = document.getElementById('gpsBroadcastStatus');
        if (!navigator.geolocation) {
            statusEl.innerHTML = '<span style="color:orange;">⚠️ GPS Broadcaster: Browser does not support Geolocation API.</span>';
            return;
        }

        var watchId = navigator.geolocation.watchPosition(
            function(pos) {
                var lat = pos.coords.latitude;
                var lng = pos.coords.longitude;
                var acc = pos.coords.accuracy;

                // Send live coordinates to /delivery/location
                var formData = new URLSearchParams();
                formData.append('latitude', lat);
                formData.append('longitude', lng);
                formData.append('accuracy', acc);

                fetch('<%=request.getContextPath()%>/delivery/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    statusEl.innerHTML = '🟢 Live GPS Broadcasting: ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ' (±' + Math.round(acc) + 'm)';
                })
                .catch(function(err) {
                    statusEl.innerHTML = '🟡 Broadcasting coords locally: ' + lat.toFixed(4) + ', ' + lng.toFixed(4);
                });
            },
            function(err) {
                statusEl.innerHTML = '<span style="color:#64748b;">📍 GPS Location: Simulated Basavanagudi (12.9416, 77.5750)</span>';
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    })();
    </script>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

</body>
</html>
