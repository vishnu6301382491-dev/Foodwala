<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="com.tap.model.Order" %>
<%@ page import="com.tap.model.Restaurant" %>
<%@ page import="com.tap.model.DeliveryPartner" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.Cart" %>
<%
    Order order = (Order) request.getAttribute("order");
    Restaurant restaurant = (Restaurant) request.getAttribute("restaurant");
    DeliveryPartner partner = (DeliveryPartner) request.getAttribute("partner");
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;

    String currentStatus = (order != null && order.getStatus() != null) ? order.getStatus() : "PLACED";

    // Restaurant coords
    double restLat = (restaurant != null && restaurant.getLatitude() > 0) ? restaurant.getLatitude() : 12.9438;
    double restLng = (restaurant != null && restaurant.getLongitude() > 0) ? restaurant.getLongitude() : 77.5738;
    String restName = (restaurant != null) ? restaurant.getName() : "Restaurant";

    // Customer coords
    double custLat = (order != null && order.getDeliveryLat() != null && order.getDeliveryLat() > 0) ? order.getDeliveryLat() : 12.9416;
    double custLng = (order != null && order.getDeliveryLng() != null && order.getDeliveryLng() > 0) ? order.getDeliveryLng() : 77.5750;
    String custAddr = (order != null && order.getDeliveryAddress() != null) ? order.getDeliveryAddress() : "Basavanagudi, Bengaluru";

    // Partner coords
    double partnerLat = (partner != null && partner.getCurrentLat() > 0) ? partner.getCurrentLat() : restLat;
    double partnerLng = (partner != null && partner.getCurrentLng() > 0) ? partner.getCurrentLng() : restLng;
    String partnerName = (partner != null) ? partner.getName() : "Assigning Partner...";
    String partnerPhone = (partner != null) ? partner.getPhone() : "";
    String partnerVehicle = (partner != null) ? partner.getVehicleNumber() : "";
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Order Tracking #FW-<%=order.getOrderId()%> - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <!-- Leaflet CSS for Maps -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <style>
        #liveMap {
            width: 100%;
            height: 420px;
            border-radius: 14px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-md);
            margin-bottom: 24px;
            z-index: 10;
        }
        .partner-card {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            box-shadow: var(--shadow-sm);
        }
        .pulse-live {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            margin-right: 6px;
            animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
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
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                    <span class="pulse-live"></span>
                    <h1 class="page-title" style="margin-bottom: 0;">Live Tracking: Order #FW-<%=order.getOrderId()%></h1>
                </div>
                <p class="page-subtitle" id="etaSubtitle">
                    ⚡ Estimated Delivery: <strong><%=order.getEstimatedDeliveryTime() != null ? order.getEstimatedDeliveryTime() : "25-35 mins"%></strong>
                </p>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
                <span id="liveStatusBadge" class="status-pill status-<%=currentStatus.toLowerCase()%>">
                    <%=currentStatus%>
                </span>
                <a href="<%=request.getContextPath()%>/order-details?orderId=<%=order.getOrderId()%>" class="btn btn-secondary btn-sm">
                    Receipt 🧾
                </a>
            </div>
        </div>

        <!-- PROGRESS STEPPER -->
        <div class="cart-panel" style="margin-bottom: 24px; padding: 20px 24px;">
            <div class="tracking-stepper" id="trackingStepper">
                <div class="tracking-step" id="step-PLACED">
                    <div class="step-circle">📝</div>
                    <div class="step-label">Placed</div>
                </div>
                <div class="tracking-step" id="step-CONFIRMED">
                    <div class="step-circle">✓</div>
                    <div class="step-label">Confirmed</div>
                </div>
                <div class="tracking-step" id="step-PREPARING">
                    <div class="step-circle">🍳</div>
                    <div class="step-label">Preparing</div>
                </div>
                <div class="tracking-step" id="step-READY_FOR_PICKUP">
                    <div class="step-circle">📦</div>
                    <div class="step-label">Ready</div>
                </div>
                <div class="tracking-step" id="step-OUT_FOR_DELIVERY">
                    <div class="step-circle">🛵</div>
                    <div class="step-label">On the Way</div>
                </div>
                <div class="tracking-step" id="step-DELIVERED">
                    <div class="step-circle">🎉</div>
                    <div class="step-label">Delivered</div>
                </div>
            </div>
        </div>

        <!-- LIVE MAP -->
        <div id="liveMap"></div>

        <!-- LIVE TELEMETRY DASHBOARD -->
        <div class="cart-panel" style="margin-bottom: 24px; padding: 16px 20px; background: #f8fafc; border: 1px solid var(--border-color);">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; text-align: center;">
                <div style="padding: 8px; border-right: 1px solid var(--border-color);">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Remaining Distance</div>
                    <div id="telemetryDistance" style="font-size: 20px; font-weight: 800; color: var(--primary); margin-top: 4px;">0.8 km</div>
                </div>
                <div style="padding: 8px; border-right: 1px solid var(--border-color);">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Estimated Arrival</div>
                    <div id="telemetryEta" style="font-size: 20px; font-weight: 800; color: #16a34a; margin-top: 4px;"><%=order.getEstimatedDeliveryTime() != null ? order.getEstimatedDeliveryTime() : "20-25 mins"%></div>
                </div>
                <div style="padding: 8px; border-right: 1px solid var(--border-color);">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Rider Movement Status</div>
                    <div id="telemetryStatus" style="font-size: 15px; font-weight: 800; color: #2563eb; margin-top: 6px;">🛵 On Route (26 km/h)</div>
                </div>
                <div style="padding: 8px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">Live GPS Position</div>
                    <div id="telemetryCoords" style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 8px; font-family: monospace;">
                        <%=String.format("%.4f", partnerLat)%>° N, <%=String.format("%.4f", partnerLng)%>° E
                    </div>
                </div>
            </div>
        </div>

        <!-- DELIVERY PARTNER & RESTAURANT INFO CARDS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <!-- RESTAURANT CARD -->
            <div class="cart-panel">
                <div style="font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">
                    🏪 Pickup Location (Restaurant)
                </div>
                <div style="font-weight: 800; font-size: 16px; color: var(--dark);"><%=restName%></div>
                <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                    📍 <%=restaurant != null ? restaurant.getAddress() : "Bengaluru"%>
                </div>
                <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                    📞 <%=(restaurant != null && restaurant.getPhone() != null && !restaurant.getPhone().isBlank()) ? restaurant.getPhone() : ""%>
                </div>
            </div>

            <!-- DELIVERY PARTNER CARD -->
            <div class="cart-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">
                        🛵 Assigned Delivery Partner
                    </span>
                    <span style="background: #fef08a; color: #854d0e; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">
                        ⭐ <%=partner != null && partner.getRating() > 0 ? String.format("%.1f", partner.getRating()) : "4.8"%> / 5.0
                    </span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 2px solid #bae6fd;">
                            🛵
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 16px; color: var(--dark);" id="partnerNameDisplay">
                                <%=partnerName%>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted);" id="partnerVehicleDisplay">
                                <%=partner != null && partner.getVehicleType() != null ? partner.getVehicleType() : "Honda Activa"%> • <%=partnerVehicle != null && !partnerVehicle.isEmpty() ? partnerVehicle : "KA-04-EK-2024"%>
                            </div>
                        </div>
                    </div>
                    <% if (partner != null && partner.getPhone() != null) { %>
                        <a href="tel:<%=partner.getPhone()%>" class="btn btn-sm btn-secondary" id="partnerPhoneBtn">
                            📞 <%=partner.getPhone()%>
                        </a>
                    <% } %>
                </div>
                <div style="margin-top: 12px; font-size: 12px; color: #10b981; font-weight: 700;" id="partnerMovingText">
                    🟢 Live GPS Active: Partner is navigating directly towards Basavanagudi
                </div>
            </div>
        </div>
    </div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <script>
    var currentStatus = "<%=currentStatus%>";
    var orderId = <%=order.getOrderId()%>;

    var restLat = <%=restLat%>;
    var restLng = <%=restLng%>;
    var custLat = <%=custLat%>;
    var custLng = <%=custLng%>;
    var partnerLat = <%=partnerLat%>;
    var partnerLng = <%=partnerLng%>;

    var stepsOrder = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    function updateStepper(status) {
        var currentIndex = stepsOrder.indexOf(status.toUpperCase());
        if (currentIndex === -1) {
            if (status.toUpperCase() === 'ASSIGNED') currentIndex = 0;
            else if (status.toUpperCase() === 'PICKED_UP' || status.toUpperCase() === 'ON_THE_WAY' || status.toUpperCase() === 'NEAR_DESTINATION') currentIndex = 4;
            else currentIndex = 0;
        }

        stepsOrder.forEach(function(s, idx) {
            var el = document.getElementById('step-' + s);
            if (!el) return;
            el.classList.remove('active', 'done');
            if (idx < currentIndex) {
                el.classList.add('done');
            } else if (idx === currentIndex) {
                el.classList.add('active');
            }
        });

        var badge = document.getElementById('liveStatusBadge');
        if (badge) {
            badge.className = 'status-pill status-' + status.toLowerCase();
            badge.innerText = status;
        }
    }

    updateStepper(currentStatus);

    // Initialize Map
    var map = L.map('liveMap').setView([ (restLat + custLat) / 2, (restLng + custLng) / 2 ], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors | FoodWala Live Tracking'
    }).addTo(map);

    // Custom Map Markers
    var restIcon = L.divIcon({
        className: 'custom-map-icon',
        html: '<div style="background:#ff5200; color:white; font-size:18px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(255,82,0,0.4); border:2px solid white;">🏪</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });

    var custIcon = L.divIcon({
        className: 'custom-map-icon',
        html: '<div style="background:#10b981; color:white; font-size:18px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(16,185,129,0.4); border:2px solid white;">🏠</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });

    var partnerIcon = L.divIcon({
        className: 'custom-map-icon',
        html: '<div style="background:#2563eb; color:white; font-size:22px; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(37,99,235,0.5); border:3px solid white; transition: all 0.3s ease;">🛵</div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
    });

    var restMarker = L.marker([restLat, restLng], {icon: restIcon}).addTo(map)
        .bindPopup('<strong><%=restName.replace("'", "\\'")%></strong><br>Restaurant / Preparation Hub');

    var custMarker = L.marker([custLat, custLng], {icon: custIcon}).addTo(map)
        .bindPopup('<strong>Destination</strong><br><%=custAddr.replace("'", "\\'")%>');

    var partnerMarker = L.marker([partnerLat, partnerLng], {icon: partnerIcon}).addTo(map)
        .bindPopup('<strong><%=partnerName.replace("'", "\\'")%></strong><br>Delivery Partner on Route');

    // Route polyline: Completed section vs Upcoming section
    var routeLine = L.polyline([
        [restLat, restLng],
        [partnerLat, partnerLng],
        [custLat, custLng]
    ], {color: '#ff5200', weight: 4, dashArray: '6, 8', opacity: 0.85}).addTo(map);

    var group = new L.featureGroup([restMarker, custMarker, partnerMarker]);
    map.fitBounds(group.getBounds().pad(0.2));

    // Haversine Distance helper
    function calculateDistance(lat1, lon1, lat2, lon2) {
        var R = 6371; // km
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // SIMULATED SMOOTH MOVEMENT ALONG ROUTE
    var isDeliveredInitial = ("DELIVERED" === currentStatus.toUpperCase());
    var progressRatio = isDeliveredInitial ? 1.0 : 0.05;

    function simulateMovementStep() {
        if (progressRatio >= 1.0) {
            // Reached Customer!
            partnerMarker.setLatLng([custLat, custLng]);
            routeLine.setLatLngs([[restLat, restLng], [custLat, custLng]]);
            document.getElementById('telemetryDistance').innerText = '0 m (Arrived)';
            document.getElementById('telemetryEta').innerText = 'Delivered 🎉';
            document.getElementById('telemetryStatus').innerHTML = '✅ Order Handed Over';
            document.getElementById('telemetryCoords').innerText = custLat.toFixed(4) + '° N, ' + custLng.toFixed(4) + '° E';
            document.getElementById('partnerMovingText').innerHTML = '🎉 Partner has arrived at your doorstep!';
            updateStepper('DELIVERED');
            return;
        }

        // Interpolate position between restaurant and customer
        progressRatio += 0.04;
        if (progressRatio > 1.0) progressRatio = 1.0;

        var curLat = restLat + (custLat - restLat) * progressRatio;
        var curLng = restLng + (custLng - restLng) * progressRatio;

        partnerMarker.setLatLng([curLat, curLng]);
        routeLine.setLatLngs([
            [restLat, restLng],
            [curLat, curLng],
            [custLat, custLng]
        ]);

        var distKm = calculateDistance(curLat, curLng, custLat, custLng);
        var distDisplay = (distKm < 1.0) ? Math.round(distKm * 1000) + ' m' : distKm.toFixed(1) + ' km';
        document.getElementById('telemetryDistance').innerText = distDisplay;
        document.getElementById('telemetryCoords').innerText = curLat.toFixed(4) + '° N, ' + curLng.toFixed(4) + '° E';

        var estMins = Math.max(1, Math.round(distKm * 3.5));
        document.getElementById('telemetryEta').innerText = (distKm < 0.1) ? 'Arriving now! 🛵' : estMins + ' mins';

        if (distKm < 0.15) {
            document.getElementById('telemetryStatus').innerHTML = '📍 Arriving at Doorstep';
            updateStepper('OUT_FOR_DELIVERY');
        } else if (progressRatio > 0.25) {
            document.getElementById('telemetryStatus').innerHTML = '🛵 On Route (28 km/h)';
            updateStepper('OUT_FOR_DELIVERY');
        } else {
            document.getElementById('telemetryStatus').innerHTML = '📦 Order Picked Up';
            updateStepper('READY_FOR_PICKUP');
        }
    }

    if (!isDeliveredInitial) {
        var movementInterval = setInterval(simulateMovementStep, 2500);
    } else {
        simulateMovementStep();
    }

    // Real-Time Polling for Status Sync from Server
    function pollOrderStatus() {
        fetch('<%=request.getContextPath()%>/order-status?orderId=' + orderId)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data && data.status) {
                    if (data.status === 'DELIVERED') {
                        progressRatio = 1.0;
                        simulateMovementStep();
                        if (typeof movementInterval !== 'undefined') clearInterval(movementInterval);
                        clearInterval(pollInterval);
                    }
                }
            })
            .catch(function(err) {
                console.warn('Status poll sync failed:', err);
            });
    }

    var pollInterval = setInterval(pollOrderStatus, 6000);
    </script>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

</body>
</html>
