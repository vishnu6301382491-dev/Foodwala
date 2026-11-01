# 07. Complete 30-Feature Implementation Walkthrough

This document provides a comprehensive technical walkthrough for all 30 features implemented across the FoodWala platform. Each feature is traced through its **Frontend Trigger &rarr; Java Controller &rarr; Service &rarr; DAO &rarr; MySQL Database Tables**.

---

## Features 1 to 5: Discovery, Search & Menu

### Feature 1: Homepage & Banner Discovery
- **Purpose**: Welcomes visitors, highlights trending restaurants, and surfaces hyper-local culinary zones.
- **Frontend**: `home.html` / `index.html` &rarr; `renderBanners()`, `renderFeaturedRestaurants()` in `js/app.min.js`.
- **Java Controller**: `HomeController.java` (`@WebServlet("/home")`) & `RestaurantApiController.java`.
- **DAO & Model**: `RestaurantDAOImpl.java` (`getFeaturedRestaurants()`) & `Restaurant.java`.
- **DB Tables**: `restaurant`.
- **API**: `GET /FoodWala/api/restaurants`.

### Feature 2: Restaurant Listings & Geolocation Filtering
- **Purpose**: Displays 105 active restaurants filtered by delivery area and cuisine type.
- **Frontend**: `restaurants.html` &rarr; filters for South Indian, North Indian, Biryani, Desserts.
- **Java Controller**: `RestaurantApiController.java` (`handleGetRestaurants()`).
- **DAO & Model**: `RestaurantDAOImpl.java` (`getAllRestaurants()`) & `Restaurant.java`.
- **DB Tables**: `restaurant`.
- **Validation**: Verifies `is_active = 1` and `is_open = 1`.

### Feature 3: Restaurant Search & Autocomplete
- **Purpose**: Instant sub-second search matching restaurant names, dishes, or areas.
- **Frontend**: `search.html` & Search input in navigation bar &rarr; `fetchSuggestions(query)`.
- **Java Controller**: `RestaurantApiController.java` (`@WebServlet("/api/search/suggestions")`).
- **Algorithm**: `FuzzySearchUtil.java` (Levenshtein Distance) and `FoodAliasDictionary.java` (maps "biriyani", "briyani", "biryani" to canonical IDs).
- **DB Tables**: `restaurant`, `menu`.

### Feature 4: Categorized Food Menu
- **Purpose**: Displays food items grouped under logical menu categories (Starters, Main Course, Beverages).
- **Frontend**: `menu.html` / `menu.jsp` &rarr; `renderCategoryTabs()`, `renderMenuItems()`.
- **Java Controller**: `MenuApiController.java` (`@WebServlet("/api/menu")`).
- **DAO & Model**: `MenuDAOImpl.java` (`getMenuByRestaurant(id)`) & `Menu.java`, `MenuCategory.java`.
- **DB Tables**: `menu_category`, `menu`.

### Feature 5: Search & Multi-Parameter Filtering
- **Purpose**: Refine food items by Veg/Non-Veg, rating (4.0+), price tier (₹ to ₹₹₹), and delivery time.
- **Frontend**: Filter pills in `menu.html` & `restaurants.html`.
- **DAO & Query**: `RestaurantDAOImpl.java` dynamic SQL: `SELECT * FROM restaurant WHERE rating >= ? AND cuisine_type = ?`.

---

## Features 6 to 12: Cart, Checkout & Authentication

### Feature 6: Shopping Cart & Session Storage
- **Purpose**: Holds selected dishes with unit quantities and customization notes.
- **Frontend**: `cart.html` / `cart.jsp` &rarr; `localStorage.getItem('cart')`.
- **Java Controller**: `CartController.java` (`@WebServlet("/cart")`).
- **Model**: `Cart.java` (contains `Map<Integer, CartItem> items`).

### Feature 7: Dynamic Cart Quantity & Price Updates
- **Purpose**: Real-time calculation of subtotal, 5% GST, ₹20 packaging fee, and ₹30 delivery fee.
- **Frontend**: `updateQuantity(itemId, delta)` in `js/app.min.js`.
- **Validation**: Enforces item removal when quantity reaches 0. Rejects negative quantities.

### Feature 8: Customer Registration & Duplicate Checks
- **Purpose**: Registers new customer accounts while preventing duplicate emails or phone numbers.
- **Frontend**: `register.html` &rarr; form submission.
- **Java Controller**: `RegistrationController.java` (`@WebServlet("/register")`).
- **DAO**: `UserDAOImpl.java` (`addUser(User user)`).
- **DB Table**: `user` (`UNIQUE(email)`, `UNIQUE(phone)`).
- **Validation**: Enforces 8-character password policy with letter and digit.

### Feature 9: Customer Login & Password Verification
- **Purpose**: Authenticates customer via email or phone against cryptographic password hashes.
- **Frontend**: `login.html` &rarr; `handleLoginSubmit()`.
- **Java Controller**: `LoginController.java` (`@WebServlet("/login")`).
- **Security Engine**: `PasswordUtil.java` (`verifyPassword()` checking Argon2id and BCrypt).
- **Lockout Defense**: Rejects attempts if `locked_until > NOW()`; increments `failed_attempts`.

### Feature 10: Mobile Phone Authentication
- **Purpose**: Enables sign-in or registration directly using a 10-digit Indian phone number (`+91`).
- **Frontend**: Phone tab on `login.html`.
- **Java Controller**: `LoginController.java` & `UserDAOImpl.java` (`getUserByPhone(phone)`).

### Feature 11: Multi-Provider SMS OTP Verification
- **Purpose**: Verifies customer identity via a one-time 6-digit PIN dispatched to their phone.
- **Frontend**: OTP input modal in `login.html` / `checkout.html`.
- **Java Servlets**: `SendOTPServlet.java` and `VerifyOTPServlet.java`.
- **Service Engine**: `SMSService.java` (supports Fast2SMS, 2Factor, Twilio, MSG91, and Dev Console).

### Feature 12: Google OAuth Authentication
- **Purpose**: 1-click frictionless sign-in using Google credentials.
- **Frontend**: Google button on `login.html` calling Firebase Auth Compat SDK (`firebase-config.js`).
- **Backend Flow**: Token exchanged for FoodWala customer session.

---

## Features 13 to 20: Profile, Location & Orders

### Feature 13: Customer Profile Management
- **Purpose**: Allows customers to update their name, contact details, and dietary preferences.
- **Frontend**: `profile.html` / `profile.jsp`.
- **Java Controller**: `ProfileController.java` (`@WebServlet("/profile")`).
- **DAO**: `UserDAOImpl.java` (`updateUser(User user)`).

### Feature 14: Multi-Address Management
- **Purpose**: Saves delivery locations (Home, Work, Other) with complete street details.
- **Frontend**: `addresses.html`.
- **DAO & Model**: `AddressDAOImpl.java` & `Address.java`.
- **DB Table**: `address`.

### Feature 15: GPS Location & Proximity Sorting
- **Purpose**: Acquires customer coordinates and displays nearby restaurants within a 5 km radius.
- **Frontend**: Browser Geolocation API (`navigator.geolocation.getCurrentPosition`).
- **Utility**: `LocationUtil.java` calculating distance via the **Haversine Formula**:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

### Feature 16: Multi-Step Checkout Flow
- **Purpose**: Collects delivery address, applies discounts, confirms order summary, and initiates payment.
- **Frontend**: `checkout.html` / `checkout.jsp`.
- **Java Controller**: `CheckoutController.java` (`@WebServlet("/checkout")`).

### Feature 17: Coupon & Promotional Engine
- **Purpose**: Validates coupon codes (`WELCOME50`, `FOODWALA100`), checks expiry and minimum cart value.
- **DB Tables**: `coupons`, `coupon_usage`.
- **Validation**: Enforces 1-redemption-per-customer rule.

### Feature 18: Order Placement & State Machine
- **Purpose**: Atomically creates order records and sets initial status to `PLACED`.
- **Java Controller**: `CheckoutController.java` & `OrderService.java`.
- **DAO**: `OrderDAOImpl.java` and `OrderItemDAOImpl.java`.
- **DB Tables**: `orders`, `order_item`.

### Feature 19: Razorpay Payment Integration
- **Purpose**: Server-side order creation on Razorpay and client modal checkout.
- **Service**: `RazorpayService.java` (`createOrder(amount, currency, receipt)`).
- **API Endpoint**: `POST https://api.razorpay.com/v1/orders`.

### Feature 20: HMAC-SHA256 Payment Verification
- **Purpose**: Validates that payment was successfully captured on Razorpay without client tampering.
- **Algorithm**: `RazorpayService.verifySignature(orderId, paymentId, signature, secret)`:
  $$\text{Expected Signature} = \text{HMAC\_SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$

---

## Features 21 to 30: Tracking, Integrations & Administration

### Feature 21: Customer Order History
- **Purpose**: Displays past orders, item breakdowns, total amounts, and statuses.
- **Frontend**: `orders.html` / `orders.jsp`.
- **Java Controller**: `MyOrdersController.java` (`@WebServlet("/orders")`).
- **DAO**: `OrderDAOImpl.java` (`getOrdersByUser(userId)`).

### Feature 22: Live Order Tracking & Valet Telemetry
- **Purpose**: Visual Leaflet map showing live valet delivery route, restaurant location, and destination.
- **Frontend**: `order-tracking.html` / `orderTrack.jsp`.
- **Java Controller**: `OrderTrackingController.java` (`@WebServlet("/order-track")`).
- **Telemetry Query**: Multi-table join on `orders`, `restaurant`, and `delivery_partner`.

### Feature 23: Transactional Email Receipts
- **Purpose**: Dispatches HTML receipt with order breakdown and payment reference.
- **Engine**: `server/services/emailService.js` rendering `receipt-email-template.html`.

### Feature 24: Meta WhatsApp AI Customer Support
- **Purpose**: Live automated customer assistance on WhatsApp (`+1 555-196-0307`).
- **Engine**: `server/controllers/whatsappController.js` and `scripts/tunnel.js`.
- **Capabilities**: Resolves order status, ETA, cancellation policies, and customer inquiries with 0ms latency.

### Feature 25: System Administrator Dashboard
- **Purpose**: High-level platform analytics: total revenue, active orders, customer count, registered restaurants.
- **Frontend**: `admin.html`.
- **Security**: Restricted to `role = 'ADMIN'`.

### Feature 26: Customer Account Management
- **Purpose**: Administrator management to activate, deactivate, or review customer accounts.
- **DAO**: `UserDAOImpl.java` (`getAllUsers()`, `deleteUser()`).

### Feature 27: Restaurant Partner Catalog Management
- **Purpose**: Onboards new restaurants, updates operating hours, and modifies delivery boundaries.
- **Frontend**: `restaurant-dashboard.html`.
- **Java Controller**: `RestaurantDashboardController.java`.

### Feature 28: Food Menu Item Management
- **Purpose**: Enables restaurant owners to add dishes, adjust prices, or toggle out-of-stock items.
- **DAO**: `MenuDAOImpl.java` (`addMenu()`, `updateMenu()`, `deleteMenu()`).

### Feature 29: Live Order Status Management
- **Purpose**: Allows restaurant kitchens and valets to transition orders: `CONFIRMED` &rarr; `PREPARING` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED`.
- **DAO**: `OrderDAOImpl.java` (`updateOrderStatus()`) and `OrderStatusHistoryDAOImpl.java`.

### Feature 30: Secure Logout & Session Invalidation
- **Purpose**: Completely destroys customer session and clears authentication cookies.
- **Frontend**: Logout button in header &rarr; `logoutUser()`.
- **Java Controller**: `LogoutController.java` (`session.invalidate()`).
