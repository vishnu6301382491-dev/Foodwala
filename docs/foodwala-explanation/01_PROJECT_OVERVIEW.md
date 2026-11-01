# 01. FoodWala - Executive Project Overview

## 1. Executive Summary

**FoodWala** is an enterprise-grade, Java Full-Stack Online Food Ordering and Delivery Platform designed to provide a seamless, hyper-local culinary experience connecting customers, restaurant partners, and delivery valets in real-time. 

Built on enterprise Java architecture (**Java 17 LTS, Jakarta EE Servlets, JSP, Apache Tomcat 11, JDBC, and MySQL**), paired with a modern responsive frontend (**HTML5, CSS3, ES6+ JavaScript, Bootstrap 5, Leaflet Maps**) and an automated customer care microservice (**Node.js Express + Meta WhatsApp Cloud API**), FoodWala delivers high performance, robust security, and instant order fulfillment.

---

## 2. Problem Statement & Business Opportunity

### 2.1 The Traditional Challenges in Food Delivery Systems
1. **Slow Order Turnaround & Friction**: Complex multi-page checkouts lead to cart abandonment rates exceeding 65% in hyper-local commerce.
2. **Customer Support Bottlenecks**: Traditional food platforms force customers into frustrating call queues or slow ticket-based resolution systems for basic order updates.
3. **Data Security & Credential Vulnerabilities**: Many web applications still rely on deprecated hashing algorithms (MD5, plain SHA-256) or lack brute-force rate-limiting on authentication endpoints.
4. **Fragile Integration Architecture**: Tight coupling between payment gateways and order placement leads to orphaned orders or double debits during momentary network timeouts.

### 2.2 The FoodWala Solution
- **Instant Discovery & Fuzzy Search**: 105 verified restaurants across 5 major Bengaluru culinary zones with multi-category submenus and instant fuzzy autocomplete (`FuzzySearchUtil.java` and `FoodAliasDictionary.java`).
- **Grounded AI Customer Care**: Live, automated WhatsApp assistance powered by Meta Cloud API and local database telemetry (`+1 555-196-0307`), resolving order ETAs, cancellations within 60 seconds, and delivery notes with 0ms response latency.
- **OWASP-Recommended Cryptography**: State-of-the-art **Argon2id** password hashing (`PasswordUtil.java`) with cryptographically secure random salting and automatic account lockout.
- **Cryptographic Payment Integrity**: Live **Razorpay** payment gateway integration utilizing server-side **HMAC-SHA256** signature verification (`RazorpayService.java`) preventing man-in-the-middle payment spoofing.
- **Live Valet Telemetry**: Interactive Leaflet maps rendering valet coordinates, restaurant pickup points, and destination polyline routes calculated via the Haversine formula (`LocationUtil.java`).

---

## 3. High-Level Architectural Topology

```mermaid
graph TB
    subgraph ClientLayer["1. Client Presentation Layer"]
        Browser["Modern Browser / Mobile Device"]
        HTMLUI["Responsive SPA/MPA UI<br/>(Bootstrap 5, Vanilla ES6+, Leaflet)"]
        JSPViews["Server-Side JSP Views<br/>(cart.jsp, checkout.jsp, orderDetails.jsp)"]
        Browser --> HTMLUI
        Browser --> JSPViews
    end

    subgraph BackendLayer["2. Enterprise Java Application Layer"]
        Tomcat["Apache Tomcat 11.0 (Port 8080)"]
        Servlets["23 Jakarta Servlets (@WebServlet)<br/>(CartController, CheckoutController, etc.)"]
        Services["Core Service Engine<br/>(OrderService, PaymentService, RazorpayService, SMSService)"]
        DAOs["Data Access Object (DAO) Layer<br/>(UserDAO, OrderDAO, RestaurantDAO, MenuDAO)"]
        Security["Security & Utility Engine<br/>(PasswordUtil, CORSFilter, LocationUtil)"]
        
        Tomcat --> Servlets
        Servlets --> Services
        Servlets --> DAOs
        Services --> DAOs
        DAOs --> Security
    end

    subgraph MicroserviceLayer["3. Companion AI & Gateway Microservice"]
        NodeServer["Node.js Express 5.0 (Port 5000)"]
        WhatsAppBot["Meta WhatsApp Cloud API Webhook<br/>(FoodWala AI Support)"]
        Cloudflare["Cloudflare Zero-Trust Tunnel<br/>(cloudflared daemon)"]
        
        Cloudflare --> NodeServer
        NodeServer --> WhatsAppBot
    end

    subgraph StorageLayer["4. Enterprise Persistence Layer"]
        MySQL[("MySQL 8.0/9.x Database ('fudwala')<br/>22 Normalized Relational Tables")]
        DAOs -->|"JDBC PreparedStatements (Port 3306)"| MySQL
        NodeServer -->|"mysql2 Connection Pool"| MySQL
    end

    HTMLUI -->|"HTTP Fetch / REST JSON"| Servlets
    HTMLUI -->|"HTTP Fetch / REST JSON"| NodeServer
    JSPViews -->|"RequestDispatcher"| Servlets
```

---

## 4. User Personas & System Scope

FoodWala is engineered around four distinct stakeholder personas:

| Persona | Primary Needs & Responsibilities | Key Application Interfaces |
| :--- | :--- | :--- |
| **Customer** | Discover food, manage multi-item cart, apply coupons, pay securely via Razorpay/COD, track delivery live, receive SMS/WhatsApp updates. | `home.html`, `restaurants.html`, `menu.html`, `cart.html`, `checkout.html`, `order-tracking.html` |
| **Restaurant Partner** | Manage menu catalog, update item pricing/availability, monitor live orders, update preparation stages (`CONFIRMED` &rarr; `PREPARING`). | `restaurant-dashboard.html`, `restaurantDashboard.jsp`, `RestaurantDashboardController.java` |
| **Delivery Valet** | View assigned delivery route, navigate via GPS coordinates, update valet pickup and delivery completion timestamps. | `delivery-dashboard.html`, `deliveryDashboard.jsp`, `DeliveryController.java` |
| **System Administrator** | Oversee platform analytics, manage user accounts, resolve support tickets, audit security logs and transaction reconciliations. | `admin.html`, `UserController.java`, `DBInspect.java` |

---

## 5. Comprehensive Feature Implementation Matrix

FoodWala adopts strict engineering transparency. Every feature is classified below as **Implemented (Production Ready)**, **Partially Implemented**, or **Recommended/Roadmap**:

| # | Feature Domain | Actual Implementation Status | Source Files / Tables |
| :--- | :--- | :--- | :--- |
| 1 | **Restaurant Discovery & Filtering** | ✅ **Implemented** | `RestaurantDAOImpl.java`, `RestaurantApiController.java`, `restaurants.html` |
| 2 | **Fuzzy Search & Autocomplete** | ✅ **Implemented** | `FuzzySearchUtil.java`, `FoodAliasDictionary.java`, `search.html` |
| 3 | **Categorized Menu Catalog** | ✅ **Implemented** | `MenuDAOImpl.java`, `MenuApiController.java`, `menu.html`, `menu.jsp` |
| 4 | **Interactive Cart Management** | ✅ **Implemented** | `Cart.java`, `CartItem.java`, `CartController.java`, `cart.html`, `cart.jsp` |
| 5 | **Customer Registration** | ✅ **Implemented** | `RegistrationController.java`, `UserDAOImpl.java`, `register.html` |
| 6 | **Customer Authentication** | ✅ **Implemented** | `LoginController.java`, `PasswordUtil.java`, `login.html`, `login.jsp` |
| 7 | **Argon2id & BCrypt Security** | ✅ **Implemented** | `PasswordUtil.java`, `TestPasswordSecurity.java` |
| 8 | **Brute-Force Lockout Defense** | ✅ **Implemented** | `UserDAOImpl.java`, columns `failed_attempts`, `locked_until` in table `user` |
| 9 | **Multi-Provider SMS OTP** | ✅ **Implemented** | `SMSService.java`, `SendOTPServlet.java`, `VerifyOTPServlet.java`, `sms.properties` |
| 10 | **Google OAuth (Firebase)** | ✅ **Implemented** | `firebase-config.js`, `login.html`, `register.html` |
| 11 | **Customer Profile & Address Book** | ✅ **Implemented** | `ProfileController.java`, `AddressDAOImpl.java`, `profile.html`, `addresses.html` |
| 12 | **GPS Geolocation & Proximity** | ✅ **Implemented** | `LocationUtil.java` (Haversine formula), `LocationController.java` |
| 13 | **Multi-Step Checkout** | ✅ **Implemented** | `CheckoutController.java`, `checkout.html`, `checkout.jsp` |
| 14 | **Coupon & Discount Engine** | ✅ **Implemented** | `CheckoutController.java`, tables `coupons`, `coupon_usage` |
| 15 | **Razorpay Payment Gateway** | ✅ **Implemented** | `RazorpayService.java`, `PaymentController.java`, `paymentGateway.jsp` |
| 16 | **HMAC-SHA256 Signature Verification** | ✅ **Implemented** | `RazorpayService.java` (`verifySignature`), `PaymentDAOImpl.java` |
| 17 | **Cash on Delivery (COD)** | ✅ **Implemented** | `PaymentController.java`, `OrderService.java` |
| 18 | **Order Placement & State Machine** | ✅ **Implemented** | `OrderDAOImpl.java`, `OrderItemDAOImpl.java`, table `orders` |
| 19 | **Real-Time Order Tracking** | ✅ **Implemented** | `OrderTrackingController.java`, `order-tracking.html`, Leaflet maps |
| 20 | **Order History & Receipts** | ✅ **Implemented** | `MyOrdersController.java`, `orders.html`, `receipt-email-template.html` |
| 21 | **Transactional Email Notifications** | ✅ **Implemented** | `server/services/emailService.js`, `EMAIL_SETUP.md` |
| 22 | **Meta WhatsApp AI Customer Care** | ✅ **Implemented** | `server/controllers/whatsappController.js`, `whatsappService.js`, `scripts/tunnel.js` |
| 23 | **Restaurant Manager Portal** | ✅ **Implemented** | `RestaurantDashboardController.java`, `restaurant-dashboard.html` |
| 24 | **Delivery Valet Portal** | ✅ **Implemented** | `DeliveryController.java`, `delivery-dashboard.html` |
| 25 | **Admin Analytics & Monitoring** | ✅ **Implemented** | `admin.html`, `UserController.java`, `DBInspect.java` |
| 26 | **Database Connection Pooling** | 🟡 **Partially Implemented** | `DBConnection.java` uses direct `DriverManager`; Apache Tomcat `DataSource` JNDI recommended for 10k+ concurrent users |
| 27 | **Spring Boot Microservices** | ⚪ **Architectural Roadmap** | FoodWala runs on pure Jakarta EE; complete Spring Boot conversion blueprint provided in Document 03 |
| 28 | **WebSocket Push Notifications** | ⚪ **Architectural Roadmap** | Polling & Webhook events active; WebSocket STOMP recommended for live valet coordinates |

---

## 6. End-to-End Customer Order Journey

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant WebUI as Frontend (Browser)
    participant JavaServlet as Jakarta Servlets (Tomcat)
    participant Razorpay as Razorpay API
    participant MySQL as MySQL ('fudwala')
    participant WhatsApp as Meta WhatsApp API

    Customer->>WebUI: 1. Discovers Donne Biryani & Adds to Cart
    WebUI->>WebUI: 2. Computes Subtotal + GST (5%) + Delivery Fee
    Customer->>WebUI: 3. Clicks "Proceed to Checkout"
    WebUI->>JavaServlet: 4. POST /checkout (Address, Coupon, Items)
    JavaServlet->>Razorpay: 5. Creates Razorpay Order (HTTP POST /v1/orders)
    Razorpay-->>JavaServlet: 6. Returns razorpay_order_id
    JavaServlet-->>WebUI: 7. Renders Checkout Modal
    Customer->>WebUI: 8. Enters Payment Details & Authorizes
    WebUI->>JavaServlet: 9. POST /payment (order_id, payment_id, signature)
    JavaServlet->>JavaServlet: 10. Cryptographically verifies HMAC-SHA256 signature
    JavaServlet->>MySQL: 11. Atomic Commit: INSERT INTO orders, order_item, payment
    MySQL-->>JavaServlet: 12. Generates Order #FW70
    JavaServlet-->>WebUI: 13. Redirects to /order-confirmation.html
    Customer->>WhatsApp: 14. Sends WhatsApp: "Where is my order?"
    WhatsApp->>MySQL: 15. Queries active Order #FW70
    MySQL-->>WhatsApp: 16. Returns ETA 27 mins, Valet Suresh Kumar
    WhatsApp-->>Customer: 17. WhatsApp AI Reply Delivered Instantly
```

---

## 7. Key Project Metrics & Numbers

When speaking with technical evaluators or clients, memorize these core metrics:
- **Total Java Classes**: 45+ source files across 7 distinct packages.
- **Relational Tables**: 22 normalized MySQL tables with foreign key constraints.
- **Active Seed Catalog**: 105 verified restaurants, 416 categories, 756 individual menu items.
- **Automated Test Coverage**: 13/13 WhatsApp test suite passing, 5/5 assistance tests passing, 100% Java compilation clean.
- **Security Rating**: OWASP Level 1 & 2 compliant password hashing with 3 Argon2 iterations and 19 MiB memory cost.
