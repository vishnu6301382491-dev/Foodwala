<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.tap.model.User" %>
<%@ page import="com.tap.model.Address" %>
<%@ page import="com.tap.model.Cart" %>
<%
    User user = (User) request.getAttribute("user");
    if (user == null) {
        user = (User) session.getAttribute("loggedInUser");
    }
    if (user == null) {
        response.sendRedirect(request.getContextPath() + "/login");
        return;
    }
    List<Address> addresses = (List<Address>) request.getAttribute("addresses");
    Cart cart = (Cart) session.getAttribute("cart");
    int cartCount = (cart != null) ? cart.getItemCount() : 0;
    String success = request.getParameter("success");
    String tab = request.getParameter("tab");
    if (tab == null) tab = "details";
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Profile &amp; Addresses - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .profile-tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 8px;
        }
        .profile-tab-btn {
            background: transparent;
            border: none;
            padding: 8px 18px;
            font-size: 15px;
            font-weight: 700;
            color: var(--text-muted);
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s;
        }
        .profile-tab-btn.active {
            background: var(--primary-light);
            color: var(--primary);
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
                <span class="user-pill">👤 <%=user.getUsername()%></span>
                <a href="<%=request.getContextPath()%>/profile" class="nav-link" style="color: var(--primary);">My Profile</a>
                <a href="<%=request.getContextPath()%>/orders" class="nav-link">My Orders</a>
                <% if(user.isRestaurant() || user.isAdmin()) { %>
                    <a href="<%=request.getContextPath()%>/restaurant/dashboard" class="nav-link" style="color:#d97706; font-weight:700;">🍽️ Rest. Portal</a>
                <% } %>
                <% if(user.isDeliveryPartner() || user.isAdmin()) { %>
                    <a href="<%=request.getContextPath()%>/delivery/dashboard" class="nav-link" style="color:#2563eb; font-weight:700;">🛵 Delivery Portal</a>
                <% } %>
                <a href="<%=request.getContextPath()%>/logout" class="nav-link">Logout</a>
            </nav>
        </div>
    </header>

    <div class="page-wrap">
        <div class="page-header">
            <h1 class="page-title">My Account</h1>
            <p class="page-subtitle">Manage personal profile settings and saved delivery addresses</p>
        </div>

        <% if ("1".equals(success)) { %>
            <div class="alert alert-success">
                ✓ Profile details successfully updated!
            </div>
        <% } %>

        <div class="profile-tabs">
            <button type="button" class="profile-tab-btn <%= "details".equals(tab) ? "active" : "" %>" onclick="switchTab('details')">
                👤 Personal Details
            </button>
            <button type="button" class="profile-tab-btn <%= "addresses".equals(tab) ? "active" : "" %>" onclick="switchTab('addresses')">
                📍 Saved Addresses (<%= addresses != null ? addresses.size() : 0 %>)
            </button>
        </div>

        <!-- TAB 1: PERSONAL DETAILS -->
        <div id="tabDetails" style="display: <%= "details".equals(tab) ? "block" : "none" %>;">
            <div class="cart-panel" style="max-width: 600px;">
                <h2 style="font-size: 18px; font-weight: 800; color: var(--dark); margin-bottom: 20px;">
                    Edit Profile Information
                </h2>

                <form action="<%=request.getContextPath()%>/profile" method="post">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" name="username" class="form-control" value="<%=user.getUsername()%>" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" name="email" class="form-control" value="<%=user.getEmail()%>" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Mobile Phone</label>
                        <input type="tel" name="phone" class="form-control" value="<%=user.getPhone() != null ? user.getPhone() : ""%>" placeholder="10-digit mobile number">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Account Role</label>
                        <input type="text" class="form-control" value="<%=user.getRole()%>" disabled style="background:#f1f5f9; cursor:not-allowed;">
                    </div>

                    <button type="submit" class="btn" style="margin-top: 10px;">
                        Save Changes ✓
                    </button>
                </form>
            </div>
        </div>

        <!-- TAB 2: SAVED ADDRESSES -->
        <div id="tabAddresses" style="display: <%= "addresses".equals(tab) ? "block" : "none" %>;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
                <h2 style="font-size: 20px; font-weight: 800; color: var(--dark);">
                    Saved Delivery Addresses
                </h2>
                <button type="button" class="btn btn-sm" onclick="openAddAddressModal()">
                    + Add New Address
                </button>
            </div>

            <% if (addresses == null || addresses.isEmpty()) { %>
                <div class="empty-state" style="padding: 40px 20px;">
                    <div class="empty-icon">📍</div>
                    <h3 class="empty-title">No Saved Addresses</h3>
                    <p class="empty-subtitle">Save your home, office, or frequently visited addresses for rapid one-click checkout.</p>
                    <button type="button" class="btn btn-sm" onclick="openAddAddressModal()">+ Add Address</button>
                </div>
            <% } else { %>
                <div class="address-grid">
                    <% for (Address a : addresses) { %>
                        <div class="address-card <%= a.isDefault() ? "selected" : "" %>">
                            <span class="address-badge <%= a.isDefault() ? "default" : "" %>">
                                <%=a.getAddressType()%> <%= a.isDefault() ? "• DEFAULT" : "" %>
                            </span>
                            <div style="font-weight: 800; font-size: 15px; color: var(--dark); margin-bottom: 4px;">
                                <%=a.getFullName()%>
                            </div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">
                                📞 <%=a.getPhone()%>
                            </div>
                            <div style="font-size: 13px; color: var(--text-main); margin-bottom: 14px; min-height: 40px;">
                                <%=a.getFormattedAddress()%>
                            </div>

                            <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 10px;">
                                <% if (!a.isDefault()) { %>
                                    <form action="<%=request.getContextPath()%>/address" method="post" style="display: inline;">
                                        <input type="hidden" name="action" value="setDefault">
                                        <input type="hidden" name="addressId" value="<%=a.getAddressId()%>">
                                        <button type="submit" class="btn btn-secondary btn-sm" style="font-size: 12px; padding: 4px 8px;">
                                            Set Default
                                        </button>
                                    </form>
                                <% } %>

                                <form action="<%=request.getContextPath()%>/address" method="post" style="display: inline;" onsubmit="return confirm('Delete this address?');">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="addressId" value="<%=a.getAddressId()%>">
                                    <button type="submit" class="btn btn-danger btn-sm" style="font-size: 12px; padding: 4px 8px;">
                                        Delete
                                    </button>
                                </form>
                            </div>
                        </div>
                    <% } %>
                </div>
            <% } %>
        </div>
    </div>

    <!-- MODAL: ADD ADDRESS -->
    <div id="addAddressModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 16px; padding: 28px; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                <h3 style="font-size: 20px; font-weight: 800; color: var(--dark);">📍 Add Delivery Address</h3>
                <button type="button" onclick="closeAddAddressModal()" style="border: none; background: transparent; font-size: 20px; cursor: pointer;">✕</button>
            </div>

            <!-- GPS AUTOFILL BUTTON -->
            <button type="button" class="btn btn-secondary btn-block btn-sm" onclick="autofillWithGps()" style="margin-bottom: 16px;">
                📍 Auto-fill with Current GPS Location
            </button>

            <form action="<%=request.getContextPath()%>/address" method="post">
                <input type="hidden" name="action" value="add">

                <div class="form-group">
                    <label class="form-label">Contact Name</label>
                    <input type="text" name="fullName" id="addrName" class="form-control" value="<%=user.getUsername()%>" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Contact Phone</label>
                    <input type="tel" name="phone" id="addrPhone" class="form-control" value="<%=user.getPhone() != null ? user.getPhone() : ""%>" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Flat / House No.</label>
                        <input type="text" name="houseNo" id="addrHouse" class="form-control" placeholder="e.g. 104, Rose Apts" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Street / Landmark</label>
                        <input type="text" name="street" id="addrStreet" class="form-control" placeholder="e.g. Gandhi Bazaar Main Rd" required>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Area / Locality</label>
                        <input type="text" name="area" id="addrArea" class="form-control" placeholder="Basavanagudi" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pincode</label>
                        <input type="text" name="pincode" id="addrPincode" class="form-control" placeholder="560004" required>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" name="city" id="addrCity" class="form-control" value="Bengaluru" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">State</label>
                        <input type="text" name="state" id="addrState" class="form-control" value="Karnataka" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Address Tag</label>
                    <select name="addressType" class="form-control">
                        <option value="Home">🏠 Home</option>
                        <option value="Work">🏢 Work / Office</option>
                        <option value="Other">📍 Other</option>
                    </select>
                </div>

                <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="isDefault" id="isDefault" value="true">
                    <label for="isDefault" style="font-size: 14px; font-weight: 600; cursor: pointer;">Set as default delivery address</label>
                </div>

                <button type="submit" class="btn btn-block" style="margin-top: 10px;">
                    Save Address
                </button>
            </form>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Food Delivery. Made with ❤️ for food lovers.</p>
    </footer>

    <script>
    function switchTab(t) {
        document.getElementById('tabDetails').style.display = (t === 'details') ? 'block' : 'none';
        document.getElementById('tabAddresses').style.display = (t === 'addresses') ? 'block' : 'none';
        document.querySelectorAll('.profile-tab-btn').forEach(function(b) { b.classList.remove('active'); });
        event.target.classList.add('active');
    }

    function openAddAddressModal() {
        document.getElementById('addAddressModal').style.display = 'flex';
    }
    function closeAddAddressModal() {
        document.getElementById('addAddressModal').style.display = 'none';
    }

    function autofillWithGps() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            fetch('<%=request.getContextPath()%>/location/reverse?lat=' + pos.coords.latitude + '&lng=' + pos.coords.longitude)
                .then(function(r) { return r.json(); })
                .then(function(d) {
                    if (d.city) document.getElementById('addrCity').value = d.city;
                    if (d.state) document.getElementById('addrState').value = d.state;
                    if (d.pincode) document.getElementById('addrPincode').value = d.pincode;
                    document.getElementById('addrArea').value = d.city || 'Basavanagudi';
                    document.getElementById('addrStreet').value = d.formattedAddress;
                });
        });
    }
    </script>
</body>
</html>
