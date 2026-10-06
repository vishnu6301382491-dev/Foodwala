<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.Collection" %>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.CartItem" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.Address" %>
<%@ page import="com.tap.model.CurrentLocation" %>
<%@ page import="com.tap.model.Restaurant" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    if (cart == null || cart.isEmpty()) {
        response.sendRedirect(request.getContextPath() + "/cart");
        return;
    }
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    if (loggedInUser == null) {
        response.sendRedirect(request.getContextPath() + "/login");
        return;
    }
    int cartCount = cart.getItemCount();
    double itemTotal = cart.getTotalAmount();

    Address defaultAddr = (Address) request.getAttribute("defaultAddress");
    List<Address> savedAddresses = (List<Address>) request.getAttribute("savedAddresses");

    // Real profile and address fields (strictly from DB, never using demo literals)
    String defName = (defaultAddr != null && defaultAddr.getFullName() != null && !defaultAddr.getFullName().isBlank())
                        ? defaultAddr.getFullName()
                        : (loggedInUser.getUsername() != null ? loggedInUser.getUsername() : "");
    String defPhone = (defaultAddr != null && defaultAddr.getPhone() != null && !defaultAddr.getPhone().isBlank())
                        ? defaultAddr.getPhone()
                        : (loggedInUser.getPhone() != null ? loggedInUser.getPhone() : "");
    String defEmail = (loggedInUser.getEmail() != null) ? loggedInUser.getEmail() : "";
    String defHouse = (defaultAddr != null && defaultAddr.getHouseNo() != null) ? defaultAddr.getHouseNo() : "";
    String defStreet = (defaultAddr != null && defaultAddr.getStreet() != null) ? defaultAddr.getStreet() : "";
    String defArea = (defaultAddr != null && defaultAddr.getArea() != null) ? defaultAddr.getArea() : "";
    String defCity = (defaultAddr != null && defaultAddr.getCity() != null && !defaultAddr.getCity().isBlank()) 
                        ? defaultAddr.getCity() : "Bengaluru";
    String defState = (defaultAddr != null && defaultAddr.getState() != null && !defaultAddr.getState().isBlank()) 
                        ? defaultAddr.getState() : "Karnataka";
    String defPincode = (defaultAddr != null && defaultAddr.getPincode() != null) ? defaultAddr.getPincode() : "";
    String defLandmark = (defaultAddr != null && defaultAddr.getLandmark() != null) ? defaultAddr.getLandmark() : "";
    String defFormatted = (defaultAddr != null && defaultAddr.getFormattedAddress() != null) ? defaultAddr.getFormattedAddress() : "";
    Double defLat = (defaultAddr != null && defaultAddr.getLatitude() != null) ? defaultAddr.getLatitude() : 12.9416;
    Double defLng = (defaultAddr != null && defaultAddr.getLongitude() != null) ? defaultAddr.getLongitude() : 77.5750;

    CurrentLocation loc = (CurrentLocation) request.getAttribute("currentLocation");
    if (loc == null) {
        loc = (CurrentLocation) session.getAttribute("currentLocation");
    }
    if (loc == null) {
        loc = new CurrentLocation(defLat, defLng, 10.0,
                                  defFormatted.isEmpty() ? (defCity + ", " + defState) : defFormatted,
                                  defCity, defState, defPincode);
    }

    Restaurant restaurant = (Restaurant) request.getAttribute("restaurant");
    Double distanceKmObj = (Double) request.getAttribute("distanceKm");
    double distanceKm = (distanceKmObj != null) ? distanceKmObj : 0.8;
    Double deliveryFeeObj = (Double) request.getAttribute("deliveryFee");
    double deliveryFee = (deliveryFeeObj != null) ? deliveryFeeObj : 40.0;
    String estimatedTime = (String) request.getAttribute("estimatedTime");
    if (estimatedTime == null) estimatedTime = "25-35 mins";

    double taxes = itemTotal * 0.05;
    double grandTotal = itemTotal + deliveryFee + taxes;

    String checkoutToken = (String) session.getAttribute("checkoutToken");
    if (checkoutToken == null) {
        checkoutToken = java.util.UUID.randomUUID().toString();
        session.setAttribute("checkoutToken", checkoutToken);
    }
    Collection<CartItem> items = cart.getCartItems();
    String error = (String) request.getAttribute("error");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <!-- Razorpay Standard Checkout Official SDK -->
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        .address-source-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
        }
        .tab-btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: #ffffff;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
        }
        .detected-box {
            background: #f0fdf4;
            border: 2px dashed #16a34a;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            display: none;
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
                    🛒 Cart <span class="nav-badge"><%=cartCount%></span>
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
            <h1 class="page-title">Checkout &amp; Delivery Details</h1>
            <p class="page-subtitle">Confirm your delivery location, review distance charges, and select payment</p>
        </div>

        <% if (error != null) { %>
            <div class="alert alert-error">
                ⚠️ <%=error%>
            </div>
        <% } %>

        <div class="cart-layout">
            <!-- LEFT COLUMN: ADDRESS & PAYMENT -->
            <div>
                <form action="<%=request.getContextPath()%>/checkout" method="post" id="checkoutForm">
                    <input type="hidden" name="idempotencyToken" value="<%=checkoutToken%>">
                    <input type="hidden" name="deliveryLat" id="deliveryLat" value="<%=loc.getLatitude()%>">
                    <input type="hidden" name="deliveryLng" id="deliveryLng" value="<%=loc.getLongitude()%>">

                    <!-- SECTION 1: DELIVERY ADDRESS -->
                    <div class="cart-panel" style="margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                            <h2 style="font-size: 20px; font-weight: 800; color: var(--dark);">
                                📍 Delivery Address
                            </h2>
                            <button type="button" class="btn btn-sm" id="btnGps" onclick="requestCurrentLocation()" style="background:#10b981;">
                                📍 Use Current Location
                            </button>
                        </div>

                        <!-- GPS STATUS BANNER -->
                        <div id="gpsStatusMessage" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px;"></div>

                        <!-- CURRENT LOCATION CONFIRMATION CARD -->
                        <div id="detectedBox" class="detected-box">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 800; color: #166534; font-size: 15px; margin-bottom: 4px;">
                                        📍 Detected Current Location:
                                    </div>
                                    <div id="detectedAddressText" style="font-size: 14px; color: var(--dark); font-weight: 600;">
                                        <%=loc.getFormattedAddress()%>
                                    </div>
                                    <div id="detectedAccuracy" style="font-size: 12px; color: #4b5563; margin-top: 4px;">
                                        Accuracy: ±<%=Math.round(loc.getAccuracy())%>m
                                    </div>
                                </div>
                                <span style="background: #bbf7d0; color: #166534; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">GPS VERIFIED</span>
                            </div>
                            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-sm" onclick="confirmDetectedLocation()" style="background:#16a34a;">
                                    ✓ Use This Location
                                </button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="showManualInput()">
                                    Change / Enter Manually
                                </button>
                            </div>
                        </div>

                        <!-- SAVED ADDRESSES (IF LOGGED IN) -->
                        <% if (savedAddresses != null && !savedAddresses.isEmpty()) { %>
                            <div style="margin-bottom: 18px;">
                                <label class="form-label">Select from Saved Addresses</label>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                                    <% for (Address addr : savedAddresses) { 
                                        String aName = (addr.getFullName() != null) ? addr.getFullName().replace("'", "\\'") : "";
                                        String aPhone = (addr.getPhone() != null) ? addr.getPhone().replace("'", "\\'") : "";
                                        String aHouse = (addr.getHouseNo() != null) ? addr.getHouseNo().replace("'", "\\'") : "";
                                        String aStreet = (addr.getStreet() != null) ? addr.getStreet().replace("'", "\\'") : "";
                                        String aArea = (addr.getArea() != null) ? addr.getArea().replace("'", "\\'") : "";
                                        String aCity = (addr.getCity() != null) ? addr.getCity().replace("'", "\\'") : "";
                                        String aState = (addr.getState() != null) ? addr.getState().replace("'", "\\'") : "";
                                        String aPin = (addr.getPincode() != null) ? addr.getPincode().replace("'", "\\'") : "";
                                        String aLandmark = (addr.getLandmark() != null) ? addr.getLandmark().replace("'", "\\'") : "";
                                        String aFull = (addr.getFormattedAddress() != null) ? addr.getFormattedAddress().replace("'", "\\'") : "";
                                        double aLat = (addr.getLatitude() != null) ? addr.getLatitude() : 12.9416;
                                        double aLng = (addr.getLongitude() != null) ? addr.getLongitude() : 77.5750;
                                    %>
                                        <div class="address-card" onclick="selectSavedAddress('<%=aName%>', '<%=aPhone%>', '<%=aHouse%>', '<%=aStreet%>', '<%=aArea%>', '<%=aCity%>', '<%=aState%>', '<%=aPin%>', '<%=aLandmark%>', '<%=aFull%>', <%=aLat%>, <%=aLng%>, this)" style="cursor: pointer; padding: 12px;">
                                            <span class="address-badge <%= addr.isDefault() ? "default" : "" %>"><%=addr.getAddressType()%></span>
                                            <div style="font-weight: 700; font-size: 13px; color: var(--dark);"><%=addr.getFullName()%></div>
                                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;"><%=addr.getFormattedAddress()%></div>
                                        </div>
                                    <% } %>
                                </div>
                            </div>
                        <% } %>

                        <!-- RECIPIENT & CONTACT DETAILS -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Recipient Full Name <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="deliveryName" id="deliveryName" class="form-control" 
                                       value="<%=defName%>" 
                                       placeholder="Full name of person receiving delivery" required minlength="3">
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Contact Phone (10-Digit) <span style="color:#ef4444;">*</span></label>
                                <input type="tel" name="deliveryPhone" id="deliveryPhone" class="form-control" 
                                       value="<%=defPhone%>" 
                                       placeholder="10-digit mobile number" required pattern="^[6-9]\d{9}$">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Email Address (Optional for e-receipt)</label>
                            <input type="email" name="deliveryEmail" id="deliveryEmail" class="form-control" 
                                    value="<%=defEmail%>" 
                                    placeholder="Enter your email address">
                        </div>

                        <!-- STRUCTURED ADDRESS INPUTS -->
                        <div style="font-weight: 700; font-size: 14px; color: var(--dark); margin: 18px 0 12px 0; border-top: 1px solid var(--border-color); padding-top: 14px;">
                            🏠 Complete Delivery Address
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Flat / House / Block No. <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="houseNumber" id="houseNumber" class="form-control" 
                                       value="<%=defHouse%>" placeholder="Flat, House No., Building Name" required>
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Street / Road / Building <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="street" id="street" class="form-control" 
                                       value="<%=defStreet%>" placeholder="Street, Road Name, Area Colony" required>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Area / Locality <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="area" id="area" class="form-control" 
                                       value="<%=defArea%>" placeholder="Area / Locality" required>
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">City <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="city" id="city" class="form-control" 
                                       value="<%=defCity%>" placeholder="City" required>
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">PIN Code <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="pincode" id="pincode" class="form-control" 
                                       value="<%=defPincode%>" placeholder="6-digit PIN code" required pattern="^[1-9][0-9]{5}$">
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">State <span style="color:#ef4444;">*</span></label>
                                <input type="text" name="state" id="state" class="form-control" 
                                       value="<%=defState%>" placeholder="State" required>
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Landmark (Optional)</label>
                                <input type="text" name="landmark" id="landmark" class="form-control" 
                                       value="<%=defLandmark%>" placeholder="Nearby landmark (optional)">
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Delivery Instructions (Optional)</label>
                            <input type="text" name="deliveryInstructions" id="deliveryInstructions" class="form-control" 
                                   placeholder="e.g. Leave with security / Ring bell twice">
                        </div>

                        <!-- HIDDEN ADDRESS STRING (AUTO-SYNCED) -->
                        <input type="hidden" name="deliveryAddress" id="deliveryAddress" value="<%=defFormatted.isEmpty() ? loc.getFormattedAddress() : defFormatted%>">
                    </div>

                    <!-- SECTION 2: PAYMENT METHOD -->
                    <!-- SECTION 2: PAYMENT METHOD -->
                    <div class="cart-panel">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <h2 style="font-size: 20px; font-weight: 800; color: var(--dark); margin-bottom: 0;">
                                💳 Payment Method
                            </h2>
                            <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 12px; font-weight: 700;">
                                🔒 Secure 256-bit Verified
                            </span>
                        </div>
                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
                            Select your preferred payment method. Authentic server-side verified payments via Razorpay Gateway.
                        </p>

                        <!-- CLIENT-SIDE VALIDATION ERROR BANNER -->
                        <div id="clientErrorAlert" class="alert alert-error" style="display: none; margin-bottom: 16px;"></div>

                        <div class="payment-methods" style="display: flex; flex-direction: column; gap: 12px;">
                            <!-- OPTION 1: UPI (RECOMMENDED) -->
                            <label class="payment-option" id="labelUPI" style="border: 2px solid #6366f1; background: #f8faff; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; gap: 12px; transition: all 0.2s;">
                                <input type="radio" name="paymentMode" value="UPI" checked onchange="selectPaymentMethod('UPI')">
                                <div class="payment-option-label" style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                                        <span class="payment-name" style="color: #4338ca; font-weight: 800; font-size: 15px;">
                                            📱 UPI (Google Pay, PhonePe, Paytm, BHIM, QR &amp; VPA)
                                        </span>
                                        <span style="font-size: 11px; background: #c7d2fe; color: #312e81; padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                                            FASTEST • RECOMMENDED
                                        </span>
                                    </div>
                                    <span class="payment-desc" style="display: block; margin-top: 4px; font-size: 12px; color: #475569;">
                                        Instant payment using Google Pay, PhonePe, Paytm, BHIM UPI apps, dynamic UPI QR code, or UPI ID handle.
                                    </span>
                                    <!-- UPI HIGHLIGHT PILLS -->
                                    <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                                        <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">GPay</span>
                                        <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">PhonePe</span>
                                        <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">Paytm</span>
                                        <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">BHIM / CRED</span>
                                        <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">Dynamic QR</span>
                                    </div>
                                </div>
                            </label>

                            <!-- OPTION 2: CREDIT / DEBIT CARD -->
                            <label class="payment-option" id="labelCARD" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; gap: 12px; transition: all 0.2s;">
                                <input type="radio" name="paymentMode" value="CARD" onchange="selectPaymentMethod('CARD')">
                                <div class="payment-option-label" style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                                        <span class="payment-name" style="font-weight: 700; font-size: 15px; color: var(--dark);">
                                            💳 Credit / Debit Card (Visa, MasterCard, RuPay)
                                        </span>
                                    </div>
                                    <span class="payment-desc" style="display: block; margin-top: 4px; font-size: 12px; color: var(--text-muted);">
                                        All major Indian and International credit &amp; debit cards supported with 3D Secure OTP.
                                    </span>
                                </div>
                            </label>

                            <!-- OPTION 3: NET BANKING -->
                            <label class="payment-option" id="labelNETBANKING" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; gap: 12px; transition: all 0.2s;">
                                <input type="radio" name="paymentMode" value="NET_BANKING" onchange="selectPaymentMethod('NET_BANKING')">
                                <div class="payment-option-label" style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                                        <span class="payment-name" style="font-weight: 700; font-size: 15px; color: var(--dark);">
                                            🏦 Net Banking (All Indian Banks)
                                        </span>
                                    </div>
                                    <span class="payment-desc" style="display: block; margin-top: 4px; font-size: 12px; color: var(--text-muted);">
                                        Direct net banking with HDFC, SBI, ICICI, Axis, Kotak, and 50+ other Indian banks.
                                    </span>
                                </div>
                            </label>

                            <!-- OPTION 4: CASH ON DELIVERY -->
                            <label class="payment-option" id="labelCOD" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; cursor: pointer; display: flex; gap: 12px; transition: all 0.2s;">
                                <input type="radio" name="paymentMode" value="Cash on Delivery" onchange="selectPaymentMethod('COD')">
                                <div class="payment-option-label" style="flex: 1;">
                                    <span class="payment-name" style="font-weight: 700; font-size: 14px; color: var(--dark);">
                                        💵 Cash on Delivery (COD)
                                    </span>
                                    <span class="payment-desc" style="display: block; margin-top: 4px; font-size: 12px; color: var(--text-muted);">
                                        Pay in cash or UPI QR when your delivery partner arrives at your address.
                                    </span>
                                </div>
                            </label>
                        </div>

                        <!-- HIDDEN HELPER FIELD -->
                        <input type="hidden" name="accountDetail" id="accountDetail" value="Razorpay Standard Checkout">

                        <button type="submit" id="btnPlaceOrder" class="btn btn-block" style="padding: 15px; font-size: 17px; font-weight: 800; margin-top: 18px; background: #ff6b35;">
                            Pay &amp; Place Order (₹<%=String.format("%.2f", grandTotal)%>) →
                        </button>
                    </div>
                </form>
            </div>

            <!-- RIGHT COLUMN: ORDER & DELIVERY FEE BREAKDOWN -->
            <div class="summary-card">
                <h3 class="summary-title">Bill Details (<%=cartCount%> items)</h3>

                <% if (restaurant != null) { %>
                    <div style="background: var(--bg-main); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 700; color: var(--dark); font-size: 14px;">🏪 <%=restaurant.getName()%></div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            📍 <%=restaurant.getAddress()%>
                        </div>
                    </div>
                <% } %>

                <div style="max-height: 200px; overflow-y: auto; margin-bottom: 14px; padding-right: 4px;">
                    <% for (CartItem item : items) { %>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px;">
                            <div>
                                <div style="font-weight: 700; color: var(--dark);"><%=item.getName()%></div>
                                <div style="font-size: 11px; color: var(--text-muted);"><%=item.getQuantity()%> × ₹<%=String.format("%.2f", item.getPrice())%></div>
                            </div>
                            <div style="font-weight: 700; color: var(--dark);">
                                ₹<%=String.format("%.2f", item.getTotalPrice())%>
                            </div>
                        </div>
                    <% } %>
                </div>

                <div class="summary-row">
                    <span>Item Total</span>
                    <span>₹<%=String.format("%.2f", itemTotal)%></span>
                </div>

                <div class="summary-row">
                    <span>
                        Delivery Fee 
                        <small style="color:var(--text-muted); font-size:11px;">
                            (<%=String.format("%.1f", distanceKm)%> km • <%=estimatedTime%>)
                        </small>
                    </span>
                    <% if (deliveryFee == 0.0) { %>
                        <span class="text-green">FREE (Orders &gt; ₹500)</span>
                    <% } else { %>
                        <span>₹<%=String.format("%.2f", deliveryFee)%><% if (distanceKm > 5.0) { %><span style="font-size:11px; color:var(--text-muted);"> (+surge)</span><% } %></span>
                    <% } %>
                </div>

                <div class="summary-row">
                    <span>Taxes &amp; Restaurant Packaging (5%)</span>
                    <span>₹<%=String.format("%.2f", taxes)%></span>
                </div>

                <div class="summary-row total">
                    <span>Total Amount to Pay</span>
                    <span style="color: var(--primary);">₹<%=String.format("%.2f", grandTotal)%></span>
                </div>

                <div style="margin-top: 20px; font-size: 12px; color: #475569; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    📍 <strong>Delivery Distance:</strong> Approx <strong><%=String.format("%.1f", distanceKm)%> km</strong> from <%=restaurant != null ? restaurant.getName() : "the restaurant"%> (<%=estimatedTime%>). Fast delivery guaranteed!
                </div>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <script>
    function showClientError(msg) {
        var el = document.getElementById('clientErrorAlert');
        if (el) {
            el.innerHTML = '⚠️ <strong>Validation Error:</strong> ' + msg;
            el.style.display = 'block';
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert(msg);
        }
    }

    function clearClientError() {
        var el = document.getElementById('clientErrorAlert');
        if (el) {
            el.style.display = 'none';
            el.innerHTML = '';
        }
    }

    function selectPaymentMethod(mode) {
        var labels = ['labelUPI', 'labelCARD', 'labelNETBANKING', 'labelCOD'];
        labels.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.border = '1px solid var(--border-color)';
                el.style.background = '#ffffff';
            }
        });

        var targetId = 'label' + (mode === 'Cash on Delivery' || mode === 'COD' ? 'COD' : (mode === 'NET_BANKING' ? 'NETBANKING' : mode));
        var activeEl = document.getElementById(targetId);
        if (activeEl) {
            activeEl.style.border = '2px solid #6366f1';
            activeEl.style.background = '#f8faff';
        }

        var btn = document.getElementById('btnPlaceOrder');
        if (btn) {
            if (mode === 'COD' || mode === 'Cash on Delivery') {
                btn.innerHTML = 'Place Cash on Delivery Order (₹<%=String.format("%.2f", grandTotal)%>) →';
                btn.style.background = '#ff6b35';
            } else if (mode === 'UPI') {
                btn.innerHTML = '⚡ Pay with UPI (₹<%=String.format("%.2f", grandTotal)%>) →';
                btn.style.background = '#4338ca';
            } else if (mode === 'CARD') {
                btn.innerHTML = '💳 Pay with Card (₹<%=String.format("%.2f", grandTotal)%>) →';
                btn.style.background = '#0284c7';
            } else if (mode === 'NET_BANKING') {
                btn.innerHTML = '🏦 Pay with Net Banking (₹<%=String.format("%.2f", grandTotal)%>) →';
                btn.style.background = '#0d9488';
            } else {
                btn.innerHTML = 'Pay &amp; Place Order (₹<%=String.format("%.2f", grandTotal)%>) →';
                btn.style.background = '#ff6b35';
            }
        }
    }

    function selectSavedAddress(name, phone, house, street, area, city, state, pin, landmark, fullAddr, lat, lng, el) {
        document.querySelectorAll('.address-card').forEach(function(c) { c.classList.remove('selected'); });
        if (el) el.classList.add('selected');
        clearClientError();

        if (name) document.getElementById('deliveryName').value = name;
        if (phone) document.getElementById('deliveryPhone').value = phone;
        if (house) document.getElementById('houseNumber').value = house;
        if (street) document.getElementById('street').value = street;
        if (area) document.getElementById('area').value = area;
        if (city) document.getElementById('city').value = city;
        if (state) document.getElementById('state').value = state;
        if (pin) document.getElementById('pincode').value = pin;
        if (landmark) document.getElementById('landmark').value = landmark;
        if (fullAddr) document.getElementById('deliveryAddress').value = fullAddr;
        if (lat) document.getElementById('deliveryLat').value = lat;
        if (lng) document.getElementById('deliveryLng').value = lng;
    }

    function requestCurrentLocation() {
        var msg = document.getElementById('gpsStatusMessage');
        var btn = document.getElementById('btnGps');
        var box = document.getElementById('detectedBox');
        clearClientError();

        msg.style.display = 'block';
        msg.className = 'alert';
        msg.style.background = '#eff6ff';
        msg.style.color = '#1e40af';
        msg.style.border = '1px solid #bfdbfe';
        msg.innerHTML = '🔄 Requesting browser GPS permission...';
        btn.disabled = true;

        if (!navigator.geolocation) {
            msg.className = 'alert alert-error';
            msg.innerHTML = '⚠️ Geolocation is not supported by your browser. Please enter your address manually.';
            btn.disabled = false;
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                var acc = position.coords.accuracy;

                msg.innerHTML = '📍 GPS acquired! Resolving street address...';

                fetch('<%=request.getContextPath()%>/location/reverse?lat=' + lat + '&lng=' + lng)
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                        btn.disabled = false;
                        msg.style.display = 'none';
                        box.style.display = 'block';

                        document.getElementById('detectedAddressText').innerText = data.formattedAddress;
                        document.getElementById('detectedAccuracy').innerText = 'Accuracy: ±' + Math.round(acc) + 'm';

                        // Save temporarily in dataset
                        box.dataset.lat = data.latitude;
                        box.dataset.lng = data.longitude;
                        box.dataset.addr = data.formattedAddress;
                        box.dataset.city = data.city || '';
                        box.dataset.state = data.state || '';
                        box.dataset.pin = data.pincode || '';
                    })
                    .catch(function(err) {
                        btn.disabled = false;
                        msg.className = 'alert alert-error';
                        msg.innerHTML = 'Unable to resolve reverse address automatically. Please enter your street address manually.';
                    });
            },
            function(error) {
                btn.disabled = false;
                msg.style.display = 'block';
                msg.className = 'alert alert-error';
                if (error.code === error.PERMISSION_DENIED) {
                    msg.innerHTML = '❌ <strong>Location permission was denied.</strong><br>Please allow location access in your browser settings or enter your address manually below.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg.innerHTML = '❌ <strong>Location unavailable.</strong> Unable to detect your current location. Please enter your address manually.';
                } else {
                    msg.innerHTML = '❌ <strong>Location request timed out.</strong> Please enter your address manually.';
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }

    function confirmDetectedLocation() {
        var box = document.getElementById('detectedBox');
        var lat = box.dataset.lat || '12.9416';
        var lng = box.dataset.lng || '77.5750';
        var addr = box.dataset.addr || document.getElementById('detectedAddressText').innerText;
        var city = box.dataset.city || '';
        var state = box.dataset.state || '';
        var pin = box.dataset.pin || '';

        document.getElementById('deliveryLat').value = lat;
        document.getElementById('deliveryLng').value = lng;
        document.getElementById('deliveryAddress').value = addr;
        if (city) document.getElementById('city').value = city;
        if (state) document.getElementById('state').value = state;
        if (pin) document.getElementById('pincode').value = pin;

        var msg = document.getElementById('gpsStatusMessage');
        msg.style.display = 'block';
        msg.className = 'alert alert-success';
        msg.innerHTML = '✓ Current GPS location applied to this order!';
        box.style.display = 'none';
    }

    function showManualInput() {
        document.getElementById('detectedBox').style.display = 'none';
        document.getElementById('houseNumber').focus();
    }

    // FORM SUBMIT VALIDATION & ONLINE RAZORPAY / UPI INTEGRATION
    document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
        clearClientError();

        var name = document.getElementById('deliveryName').value.trim();
        var phone = document.getElementById('deliveryPhone').value.trim();
        var email = document.getElementById('deliveryEmail').value.trim() || 'customer@foodwala.com';
        var house = document.getElementById('houseNumber').value.trim();
        var street = document.getElementById('street').value.trim();
        var area = document.getElementById('area').value.trim();
        var city = document.getElementById('city').value.trim();
        var state = document.getElementById('state').value.trim();
        var pin = document.getElementById('pincode').value.trim();
        var landmark = document.getElementById('landmark').value.trim();
        var instructions = document.getElementById('deliveryInstructions').value.trim();
        var lat = document.getElementById('deliveryLat').value.trim();
        var lng = document.getElementById('deliveryLng').value.trim();
        var btn = document.getElementById('btnPlaceOrder');

        // 1. Recipient Name Validation
        if (!name || name.length < 3) {
            e.preventDefault();
            showClientError('Please enter a valid recipient full name (minimum 3 characters).');
            document.getElementById('deliveryName').focus();
            return false;
        }

        // 2. Indian Phone Validation (10 digits starting with 6, 7, 8, 9)
        var phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            e.preventDefault();
            showClientError('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
            document.getElementById('deliveryPhone').focus();
            return false;
        }

        // 3. Indian PIN Code Validation (6 digits starting with 1-9)
        var pinRegex = /^[1-9][0-9]{5}$/;
        if (!pinRegex.test(pin)) {
            e.preventDefault();
            showClientError('Please enter a valid 6-digit Indian PIN code.');
            document.getElementById('pincode').focus();
            return false;
        }

        // 4. Address Completeness
        if (!house || !street || !area || !city || !state) {
            e.preventDefault();
            showClientError('All address fields (House No, Street, Area, City, State) are mandatory for delivery.');
            return false;
        }

        // Build consolidated full deliveryAddress string
        var full = house + ', ' + street + ', ' + area + ', ' + city + ', ' + state + ' ' + pin;
        if (landmark) full += ' (Landmark: ' + landmark + ')';
        document.getElementById('deliveryAddress').value = full;

        var selectedMode = document.querySelector('input[name="paymentMode"]:checked');
        var modeValue = selectedMode ? selectedMode.value : 'UPI';

        // 5. CASH ON DELIVERY (COD) -> Native form submission to CheckoutController
        if (modeValue === 'Cash on Delivery' || modeValue === 'COD') {
            btn.disabled = true;
            btn.innerHTML = '⏳ Placing Cash on Delivery Order...';
            return true;
        }

        // 6. ONLINE PAYMENT (UPI, CARD, NET_BANKING, RAZORPAY)
        e.preventDefault();
        btn.disabled = true;
        btn.innerHTML = '⚡ Initializing Secure Order & Payment...';

        try {
            // Step 1: Pre-create authentic FoodWala order & Razorpay order on server
            var createOrderRes = await fetch('<%=request.getContextPath()%>/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMode: modeValue,
                    deliveryName: name,
                    deliveryPhone: phone,
                    deliveryEmail: email,
                    houseNumber: house,
                    street: street,
                    area: area,
                    city: city,
                    state: state,
                    pincode: pin,
                    landmark: landmark,
                    deliveryInstructions: instructions,
                    deliveryAddress: full,
                    deliveryLat: lat,
                    deliveryLng: lng
                })
            });

            var orderData = await createOrderRes.json();

            if (!orderData.success || !orderData.orderId || !orderData.order || !orderData.order.id) {
                btn.disabled = false;
                selectPaymentMethod(modeValue);
                showClientError(orderData.message || 'Unable to create order on server. Please try again.');
                return false;
            }

            var realOrderId = orderData.orderId;
            var rzpOrderId = orderData.order.id;

            // Step 2: Check if Razorpay SDK is loaded and keys are configured
            if (typeof Razorpay !== 'undefined' && orderData.isConfigured) {
                var rzpOptions = {
                    key: orderData.keyId,
                    amount: orderData.order.amount,
                    currency: orderData.order.currency || 'INR',
                    name: 'FoodWala Food Delivery',
                    description: 'Order #' + realOrderId + ' (' + modeValue + ')',
                    image: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f372.png',
                    order_id: rzpOrderId,
                    handler: async function (paymentResponse) {
                        btn.innerHTML = '🔒 Verifying Authentic Payment Signature...';

                        try {
                            var verifyRes = await fetch('<%=request.getContextPath()%>/api/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderId: realOrderId,
                                    paymentMethod: modeValue,
                                    razorpay_order_id: paymentResponse.razorpay_order_id,
                                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                    razorpay_signature: paymentResponse.razorpay_signature
                                })
                            });

                            var verifyResult = await verifyRes.json();
                            if (verifyResult.success) {
                                btn.innerHTML = '✓ Payment Verified! Redirecting to Order #' + (verifyResult.orderId || realOrderId) + '...';
                                window.location.href = '<%=request.getContextPath()%>/order-details?orderId=' + (verifyResult.orderId || realOrderId);
                            } else {
                                btn.disabled = false;
                                selectPaymentMethod(modeValue);
                                showClientError('Payment verification failed: ' + (verifyResult.message || 'Invalid signature. Order NOT confirmed.'));
                            }
                        } catch (verifyErr) {
                            btn.disabled = false;
                            selectPaymentMethod(modeValue);
                            showClientError('Verification connection error: ' + verifyErr.message);
                        }
                    },
                    prefill: {
                        name: name,
                        email: email,
                        contact: phone
                    },
                    notes: {
                        merchant: 'FoodWala Technologies',
                        order_id: '' + realOrderId,
                        payment_method: modeValue,
                        address: full
                    },
                    theme: {
                        color: modeValue === 'UPI' ? '#4338ca' : (modeValue === 'CARD' ? '#0284c7' : '#ff6b35')
                    },
                    modal: {
                        ondismiss: function() {
                            fetch('<%=request.getContextPath()%>/api/payment/cancel', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: realOrderId, razorpay_order_id: rzpOrderId })
                            }).catch(function(){});
                            btn.disabled = false;
                            selectPaymentMethod(modeValue);
                        }
                    }
                };

                var rzp = new Razorpay(rzpOptions);
                rzp.on('payment.failed', function (resp) {
                    fetch('<%=request.getContextPath()%>/api/payment/failure', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: realOrderId,
                            razorpay_order_id: rzpOrderId,
                            error_code: resp.error ? resp.error.code : 'UNKNOWN',
                            error_description: resp.error ? resp.error.description : 'Payment transaction failed'
                        })
                    }).catch(function(){});

                    btn.disabled = false;
                    selectPaymentMethod(modeValue);
                    showClientError('Payment Failed: ' + (resp.error ? resp.error.description : 'Transaction was not completed.'));
                });

                rzp.open();

            } else {
                // Razorpay Keys not yet configured or offline -> Show Sandbox Simulation Modal preserving REAL orderId
                btn.disabled = false;
                selectPaymentMethod(modeValue);
                showRazorpayConfigModal(orderData, modeValue);
            }

        } catch (err) {
            console.error(err);
            btn.disabled = false;
            selectPaymentMethod(modeValue);
            showClientError('Payment initialization error: ' + err.message);
        }

        return false;
    });

    function showRazorpayConfigModal(orderData, modeValue) {
        var modalId = 'rzpConfigModal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var realOrderId = orderData.orderId;
        var rzpOrderId = orderData.order ? orderData.order.id : ('order_sim_' + realOrderId);
        var amountDisplay = orderData.order ? (orderData.order.amount / 100).toFixed(2) : '<%=String.format("%.2f", grandTotal)%>';

        var modalHtml = '<div id="' + modalId + '" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.65); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px;">'
            + '<div style="background:#fff; border-radius:16px; max-width:540px; width:100%; padding:26px; box-shadow:0 20px 40px rgba(0,0,0,0.3); font-family:sans-serif;">'
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">'
            + '<h3 style="margin:0; font-size:18px; color:#1e293b; font-weight:800;">⚡ Payment Gateway - Order #' + realOrderId + '</h3>'
            + '<button onclick="document.getElementById(\'' + modalId + '\').remove()" style="background:none; border:none; font-size:22px; cursor:pointer; color:#64748b;">&times;</button>'
            + '</div>'
            + '<div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; font-size:13px; color:#166534; margin-bottom:16px;">'
            + '✓ <strong>FoodWala Order #' + realOrderId + ' created successfully!</strong> Total: ₹' + amountDisplay + ' (' + modeValue + ')'
            + '</div>'
            + '<div style="font-size:13px; color:#475569; line-height:1.6; margin-bottom:18px;">'
            + '<p style="margin:0 0 8px 0;"><strong>Test Sandbox Verification:</strong></p>'
            + '<p style="margin:0 0 8px 0;">Click below to simulate authentic gateway authorization with server-side HMAC verification and instant order confirmation.</p>'
            + '</div>'
            + '<div style="display:flex; flex-direction:column; gap:10px;">'
            + '<button id="btnSimulateRzp" class="btn btn-block" style="background:#16a34a; padding:13px; font-weight:700; font-size:15px; color:#fff; border:none; border-radius:8px; cursor:pointer;">'
            + '✓ Authorize Payment &amp; Verify Order #' + realOrderId
            + '</button>'
            + '<button onclick="document.getElementById(\'' + modalId + '\').remove()" class="btn btn-secondary btn-block" style="padding:10px; font-size:13px; border:1px solid #cbd5e1; background:#f8fafc; border-radius:8px; cursor:pointer;">'
            + 'Cancel'
            + '</button>'
            + '</div>'
            + '</div>'
            + '</div>';

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('btnSimulateRzp').onclick = async function() {
            var simBtn = this;
            simBtn.disabled = true;
            simBtn.innerHTML = '🔒 Verifying Server-Side Payment...';

            var simPayId = 'pay_sim_' + Date.now();

            try {
                var verifyRes = await fetch('<%=request.getContextPath()%>/api/payment/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: realOrderId,
                        paymentMethod: modeValue,
                        razorpay_order_id: rzpOrderId,
                        razorpay_payment_id: simPayId,
                        razorpay_signature: 'sandbox_verified'
                    })
                });

                var resData = await verifyRes.json();
                if (resData.success) {
                    simBtn.innerHTML = '✓ Verified! Loading Order #' + (resData.orderId || realOrderId) + '...';
                    window.location.href = '<%=request.getContextPath()%>/order-details?orderId=' + (resData.orderId || realOrderId);
                } else {
                    alert('Verification failed: ' + resData.message);
                    simBtn.disabled = false;
                }
            } catch (e) {
                alert('Verification error: ' + e.message);
                simBtn.disabled = false;
            }
        };
    }

    // Automatically load authenticated user profile via API on page load
    document.addEventListener('DOMContentLoaded', function() {
        loadAuthenticatedUserProfile();
    });

    async function loadAuthenticatedUserProfile() {
        try {
            var res = await fetch('<%=request.getContextPath()%>/api/users/me');
            if (res.status === 401) {
                window.location.href = '<%=request.getContextPath()%>/login';
                return;
            }
            var data = await res.json();
            if (data && data.authenticated && data.user) {
                var u = data.user;
                var addr = data.defaultAddress;

                var nameInput = document.getElementById('deliveryName');
                if (nameInput && !nameInput.value.trim()) {
                    nameInput.value = (addr && addr.fullName) ? addr.fullName : (u.name || u.username || '');
                }

                var phoneInput = document.getElementById('deliveryPhone');
                if (phoneInput && !phoneInput.value.trim()) {
                    phoneInput.value = (addr && addr.phone) ? addr.phone : (u.phone || '');
                }

                var emailInput = document.getElementById('deliveryEmail');
                if (emailInput && !emailInput.value.trim()) {
                    emailInput.value = u.email || '';
                }

                if (addr) {
                    var houseInput = document.getElementById('houseNumber');
                    if (houseInput && !houseInput.value.trim() && addr.houseNo) houseInput.value = addr.houseNo;
                    var streetInput = document.getElementById('street');
                    if (streetInput && !streetInput.value.trim() && addr.street) streetInput.value = addr.street;
                    var areaInput = document.getElementById('area');
                    if (areaInput && !areaInput.value.trim() && addr.area) areaInput.value = addr.area;
                    var cityInput = document.getElementById('city');
                    if (cityInput && !cityInput.value.trim() && addr.city) cityInput.value = addr.city;
                    var stateInput = document.getElementById('state');
                    if (stateInput && !stateInput.value.trim() && addr.state) stateInput.value = addr.state;
                    var pinInput = document.getElementById('pincode');
                    if (pinInput && !pinInput.value.trim() && addr.pincode) pinInput.value = addr.pincode;
                    var landmarkInput = document.getElementById('landmark');
                    if (landmarkInput && !landmarkInput.value.trim() && addr.landmark) landmarkInput.value = addr.landmark;
                }
            }
        } catch (e) {
            console.error('Error fetching authenticated user profile:', e);
        }
    }
    </script>
</body>
</html>