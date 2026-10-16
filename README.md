# 🍲 FoodWala — Bengaluru Food Discovery & Delivery Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?logo=github)](https://vishnu6301382491-dev.github.io/Foodwala/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%28fudwala%29-blue?logo=mysql)](https://www.mysql.com/)
[![Security](https://img.shields.io/badge/Auth-Argon2id%20%7C%20OWASP-red)](https://owasp.org/)
[![Payments](https://img.shields.io/badge/Payments-Razorpay%20Sandbox-blue?logo=razorpay)](https://razorpay.com/)

**FoodWala** is an enterprise-grade food discovery and delivery web application designed for Bengaluru, India. It combines a responsive frontend (hosted on GitHub Pages), a high-performance Node.js/Express backend, and a relational MySQL database (`fudwala`) acting as the single source of truth for all operational data with strictly parameterized prepared statements.

---

## 🌐 Live Application Links

- **Frontend (GitHub Pages)**: [https://vishnu6301382491-dev.github.io/Foodwala/](https://vishnu6301382491-dev.github.io/Foodwala/)
- **GitHub Repository**: [https://github.com/vishnu6301382491-dev/Foodwala](https://github.com/vishnu6301382491-dev/Foodwala)
- **Local Backend**: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health/db`)

---

## 🌟 Core Features

1. **Authentication & User Security**:🍲 FoodWala — Java Full-Stack Bengaluru Food Discovery & Delivery Platform

![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?logo=github) ![Java](https://img.shields.io/badge/Backend-Java%2017%2B-orange?logo=openjdk) ![Spring Boot](https://img.shields.io/badge/Framework-Spring%20Boot-green?logo=springboot) ![Database](https://img.shields.io/badge/Database-MySQL%208.0-blue?logo=mysql) ![Security](https://img.shields.io/badge/Security-Spring%20Security-red?logo=springsecurity) ![Payments](https://img.shields.io/badge/Payments-Razorpay%20Sandbox-blue) ![Build](https://img.shields.io/badge/Build-Maven-C71A36?logo=apachemaven)

FoodWala is a Bengaluru-focused food discovery and delivery platform documented using a Java Full-Stack architecture. It provides a convenient food ordering experience with restaurant discovery, menu browsing, smart search, authentication, cart management, delivery addresses, coupons, checkout, payments, order tracking, and invoice generation.

The recommended architecture uses Java, Spring Boot, Spring Security, Spring Data JPA, Hibernate, MySQL, REST APIs, HTML, CSS, Bootstrap, and JavaScript.

Documentation notice: This README describes the recommended Java Full-Stack architecture. It does not mean that the existing application has been converted to Java or Spring Boot. Only the README documentation is intended to change; existing source files and application functionality remain untouched.
🌐 Live Application Links
Frontend: https://vishnu6301382491-dev.github.io/Foodwala/
GitHub Repository: https://github.com/vishnu6301382491-dev/Foodwala
Recommended Backend: Java Spring Boot REST API
Recommended Database: MySQL 8.0 (fudwala)

GitHub Pages hosts static frontend files. A Java backend requiring server-side database operations must be deployed separately and connected through REST APIs.

🌟 Core Features
1. 🔐 Authentication and User Security

The recommended architecture supports:

Customer registration and login
Email or mobile number authentication
Indian 10-digit mobile number validation
Duplicate account detection
Secure password hashing using BCrypt
Session-based or JWT-based authentication
OTP verification architecture
Password recovery and reset
Account lockout after repeated failed login attempts
Login history and security audit records
Role-based authorization
2. 🍽️ Restaurant and Food Catalog
Restaurant listings and details
Restaurant categories and locations
Restaurant ratings and availability
Food menu browsing
Vegetarian and non-vegetarian classification
Food item prices, descriptions, and images
Bengaluru-focused restaurant discovery

Example restaurant categories include:

South Indian
North Indian
Biryani
Fast Food
Cafes
Desserts
Beverages
3. 🔎 Smart Food Search

The platform is designed to support searching for:

Restaurants
Food items
Food categories
Cuisines
Keywords

Typo-tolerant search can help customers discover relevant results even when food names are misspelled.

For example, searching for biriyani may suggest Biryani, Chicken Biryani, Mutton Biryani, or Donne Biryani.

4. 🛒 Cart Management
Add food items to the cart
Remove items
Increase or decrease quantities
Clear the cart
Calculate subtotal
Apply discounts
Calculate delivery charges
Calculate taxes
Calculate the final order amount

The recommended architecture includes Cart, CartItem, MenuItem, and User entities.

5. 📍 Delivery Address Management
Add delivery addresses
Edit and delete addresses
Set a default address
Select an address during checkout
Store recipient and contact details
Support location coordinates where implemented

Delivery addresses should be associated with the authenticated customer.

6. 🎟️ Coupons and Offers

Example promotional codes:

FOODWALA50
WELCOME
BENGALURU100
SUPER60

The recommended coupon service can validate:

Coupon existence and expiration
Minimum cart amount
Maximum discount
User eligibility
Redemption limits
Previous coupon usage
7. 💳 Checkout and Payment Integration

The recommended payment architecture supports Razorpay integration.

Payment order creation
Razorpay Checkout
Payment verification
Payment success and failure handling
Transaction ID management
Payment status tracking
Cash on Delivery, where enabled

Sensitive payment operations must be handled by the backend. Payment success should be verified server-side before an order is marked as paid.

8. 📦 Order Management and Tracking
Place orders
View order history
View order details
Track order status
View ordered items and totals
Check payment status
Access delivery information
Download invoices

Example order lifecycle:

Order Placed
     ↓
Order Confirmed
     ↓
Restaurant Preparing
     ↓
Food Ready
     ↓
Out for Delivery
     ↓
Delivered

9. 🧾 PDF Invoice Generation

The recommended Java backend can generate PDF invoices using a compatible Java PDF library.

Invoice details may include:

FoodWala branding
Order ID and date
Customer information
Restaurant information
Ordered items and quantities
Item prices
Discounts and taxes
Delivery charges
Final amount
Payment status
10. 🛡️ Administration

The recommended architecture includes protected administrator APIs for:

Viewing users and orders
Managing restaurants
Managing menu items
Updating order status
Monitoring payments
Reviewing login history
Monitoring security events
Viewing dashboard statistics

Administrative endpoints must be protected using role-based authorization.

🛠️ Technology Stack
Frontend
HTML5
CSS3
Bootstrap 5.3
Bootstrap Icons
JavaScript ES6+
Responsive Web Design
REST API integration
Backend
Java 17+
Spring Boot
Spring MVC
Spring REST APIs
Spring Security
Spring Data JPA
Hibernate ORM
Jakarta Validation
Maven
Database
MySQL 8.0
SQL
JPA/Hibernate ORM
Relational database design
Transaction management
Security
Spring Security
BCrypt password hashing
Authentication and authorization
Session/JWT authentication architecture
Role-Based Access Control (RBAC)
Server-side input validation
CORS configuration
Secure HTTP headers
Integrations
Razorpay Payment Gateway
JavaMail / SMTP
OTP verification architecture
PDF invoice generation
Development and Testing Tools
IntelliJ IDEA
Eclipse
Visual Studio Code
MySQL Workbench
Postman
Git
GitHub
JUnit
Mockito
🏗️ Recommended Application Architecture
┌────────────────────────────────────────┐
│              Frontend                  │
│     HTML / CSS / Bootstrap / JS        │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│         Spring Boot REST API           │
│          Spring MVC Controllers        │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│             Service Layer              │
│          Business Logic and Rules      │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│           Repository Layer             │
│            Spring Data JPA             │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│          Hibernate / JPA ORM           │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│               MySQL 8.0                │
│                fudwala                 │
└────────────────────────────────────────┘


This layered architecture separates presentation, request handling, business logic, data access, and database operations.

📂 Recommended Java Project Structure

The following structure illustrates a possible Java Full-Stack implementation. It is not a representation of files already present in the repository.

FoodWala/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/foodwala/
│   │   │       ├── FoodwalaApplication.java
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── entity/
│   │   │       ├── dto/
│   │   │       ├── security/
│   │   │       ├── config/
│   │   │       ├── exception/
│   │   │       └── util/
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       └── templates/
│   └── test/
├── database/
│   └── migrations.sql
├── frontend/
├── pom.xml
└── README.md

🧩 Recommended Backend Components
Controllers

Controllers handle HTTP requests, validate incoming data, and return API responses.

AuthController
UserController
RestaurantController
MenuController
CartController
AddressController
CouponController
OrderController
PaymentController
AdminController

Services

Services contain application business logic.

AuthService
UserService
RestaurantService
MenuService
CartService
AddressService
CouponService
OrderService
PaymentService
TrackingService
InvoiceService
NotificationService

Repositories

Spring Data JPA repositories provide database access.

UserRepository
RestaurantRepository
MenuItemRepository
CartRepository
CartItemRepository
AddressRepository
OrderRepository
OrderItemRepository
PaymentRepository
CouponRepository
LoginHistoryRepository

Recommended Entities
User
Role
Restaurant
RestaurantCategory
MenuCategory
MenuItem
Cart
CartItem
Address
Coupon
CouponUsage
Order
OrderItem
Payment
OrderStatusHistory
LoginHistory
OtpVerification
Notification
Review
AuditLog

🔌 Recommended REST API Design

The following endpoints describe a proposed Java backend API. They are not claims that these endpoints already exist in the current source code.

Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password

User Profile
GET /api/users/me
PUT /api/users/me

Restaurants
GET /api/restaurants
GET /api/restaurants/{id}
POST /api/restaurants
PUT /api/restaurants/{id}
DELETE /api/restaurants/{id}

Menu
GET /api/restaurants/{id}/menu
GET /api/menu/{id}
GET /api/menu/search
POST /api/menu
PUT /api/menu/{id}
DELETE /api/menu/{id}

Cart
GET /api/cart
POST /api/cart/items
PUT /api/cart/items/{id}
DELETE /api/cart/items/{id}
DELETE /api/cart

Addresses
GET /api/addresses
POST /api/addresses
PUT /api/addresses/{id}
DELETE /api/addresses/{id}
PUT /api/addresses/{id}/default

Coupons
POST /api/coupons/validate
GET /api/coupons

Orders
POST /api/orders
GET /api/orders
GET /api/orders/{id}
PUT /api/orders/{id}/status

Payments
POST /api/payments/create
POST /api/payments/verify
GET /api/payments/{id}

Tracking and Invoices
GET /api/orders/{id}/tracking
GET /api/orders/{id}/invoice

Administration
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/orders
GET /api/admin/restaurants
GET /api/admin/audit-logs

🗄️ Database Design

The recommended database name is fudwala.

Create the database in MySQL using:

CREATE DATABASE fudwala;


The proposed relational database may include:

user
role
restaurant
restaurant_category
menu_category
menu_item
cart
cart_item
address
coupons
coupon_usage
orders
order_item
payment
order_status_history
login_history
otp_verification
notification
review
audit_log


The exact schema, table names, and relationships must match the actual backend implementation.

Transactional Order Processing

A recommended transactional workflow is:

Validate Customer
       ↓
Validate Cart
       ↓
Validate Delivery Address
       ↓
Validate Coupon
       ↓
Create Order
       ↓
Create Order Items
       ↓
Record Payment Information
       ↓
Record Order Status
       ↓
Record Coupon Usage
       ↓
Commit Transaction


Spring's transaction management can help prevent partially saved order data when database operations fail. External payment processing requires separate failure handling and payment reconciliation.

⚙️ Recommended Setup

The following setup applies to a Java backend implementation. It does not describe how to run the existing application unless that backend has actually been created.

Prerequisites
JDK 17 or later
Maven 3.8+
MySQL 8.0+
MySQL Workbench
IntelliJ IDEA, Eclipse, or VS Code
Postman
Database Configuration

Example Spring Boot configuration:

spring.datasource.url=jdbc:mysql://localhost:3306/fudwala
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false


Configure the environment variables before starting the application. Do not commit real database credentials to GitHub.

Build and Run

For a Java backend project containing a valid pom.xml:

mvn clean install
mvn spring-boot:run


The default application URL is commonly:

http://localhost:8080


The port can be configured using:

server.port=8080


These commands apply only after the recommended Java backend has been implemented.

🔐 Security Best Practices
Never store passwords as plain text.
Use BCrypt or another suitable adaptive password-hashing algorithm.
Keep secrets and credentials outside source control.
Protect administrator endpoints with role-based authorization.
Validate requests on the server.
Ensure customers can access only their own profiles, addresses, carts, and orders.
Verify payment signatures and transaction status on the server.
Prevent duplicate payment processing through idempotency and appropriate transaction handling.
Configure CORS and secure HTTP headers appropriately.
Maintain security audit records without exposing sensitive information.

Never commit:

.env
Database passwords
JWT secrets
Razorpay secret keys
SMTP credentials
OTP secrets
Admin passwords

🧪 Testing Strategy

The recommended Java architecture can use JUnit, Mockito, Spring Boot Test, and Postman.

Authentication Tests
Invalid login
Duplicate registration
Password validation
Account lockout
OTP expiration
Unauthorized API access
Administrator authorization
Order and Payment Tests
Successful order creation
Invalid delivery address
Invalid coupon
Failed payment
Invalid payment signature
Duplicate payment requests
Payment/order mismatch
Customer access to another customer's order
☁️ Deployment Architecture

A possible deployment architecture is:

             Internet
                 |
                 v
       ┌───────────────────┐
       │ Static Frontend   │
       │   GitHub Pages    │
       └─────────┬─────────┘
                 |
                 v
       ┌───────────────────┐
       │ Spring Boot REST  │
       │ API Hosting       │
       └─────────┬─────────┘
                 |
                 v
       ┌───────────────────┐
       │ Managed MySQL     │
       │ Database          │
       └───────────────────┘


Possible backend hosting platforms include:

Render
Railway
AWS
Microsoft Azure
Google Cloud
Oracle Cloud

The frontend must be configured with the correct deployed backend URL when server-side API functionality is required. GitHub Pages itself does not run a Java backend or host a MySQL database.

🔮 Future Enhancements
AI-powered food recommendations
Advanced restaurant search
Real-time delivery tracking
Google Maps integration
Push notifications
SMS and WhatsApp notifications
Restaurant owner dashboard
Delivery partner application
Loyalty points and referrals
Wallet and subscription features
Multi-city expansion
Elasticsearch-based food search
AI chatbot for food discovery
Personalized promotional offers
🎯 Learning Outcomes

FoodWala's documented architecture covers concepts related to:

Java programming
Object-Oriented Programming
Full-Stack web development
Spring Boot application design
REST API development
Spring Security
MySQL and relational database design
JPA and Hibernate
Authentication and authorization
Transaction management
Payment gateway integration
PDF generation
Order and cart management
Software testing
Cloud deployment
📌 Project Scope and Documentation Notice

This README presents FoodWala as a Java Full-Stack application architecture for documentation, learning, and portfolio purposes.

The technology descriptions, proposed project structure, entity names, and REST endpoints do not establish that these components already exist in the repository.

Only README.md is intended to be updated.
Existing HTML, CSS, and JavaScript files must remain unchanged.
Existing database files and configuration must remain unchanged.
package.json must remain unchanged.
Existing backend source files must remain unchanged.
No files should be deleted or moved.
No Java migration or conversion of the actual application is being performed.

The existing live frontend remains available at:

https://vishnu6301382491-dev.github.io/Foodwala/

The actual implementation and deployed functionality should be verified independently of this architecture documentation.

📄 License

This project is intended for educational, academic, portfolio, and demonstration purposes.

© 2026 FoodWala. All rights reserved.
   - **Unique Phone Enforcement**: Indian 10-digit mobile normalization (`^[6-9]\d{9}$`). Real-time client-side blur validation and server-side duplicate check return HTTP 409 with an interactive modal (*"Go to Login"* / *"Use Different Number"*).
   - **Argon2id Password Hashing**: Passwords stored using state-of-the-art Argon2id (`$argon2id$v=19$m=19456,t=3,p=1$...`) with transparent automatic upgrades for legacy hashes.
   - **Account Lockout Protection**: 15-minute account lock automatically triggered after 5 consecutive failed login attempts.
   - **Audit Trail (`login_history`)**: Timestamped log of IP addresses, devices, and success/failure statuses.
   - **Self-Service Password Recovery & Reset**: Secure token/OTP-based password reset without administrative intervention.

2. **Catalog & Smart Discovery**:
   - Curated institutions across Bengaluru (CTR, Vidyarthi Bhavan, Meghana Foods, Truffles, Nagarjuna).
   - Live categorized menu items with veg/non-veg tags and pricing.
   - Typo-tolerant smart search engine.

3. **Cart & Address Management**:
   - Synced persistent cart stored in `fudwala.cart` and `fudwala.cart_item`.
   - Saved delivery addresses in `fudwala.address` with default designation.

4. **Coupons & Promo Codes**:
   - Server-validated promo engine (`FOODWALA50`, `WELCOME`, `BENGALURU100`, `SUPER60`) with minimum cart validation and per-user redemption tracking in `fudwala.coupon_usage`.

5. **ACID Transactional Orders**:
   - Single atomic transaction inserting into `orders`, `order_item`, `payment`, `order_status_history`, and `coupon_usage`, clearing the active cart on commit.
   - Server-side double-click idempotency locks preventing duplicate charges and multiple order creation.

6. **Payments & Delivery Receipts**:
   - **Razorpay Sandbox**: Integrated test-mode payment gateway (`rzp_test_TjiZvLxLbxKe38`).
   - **Dual EmailJS Delivery**: Automatically emails receipts to customer email and admin copy to `foodwalapp@gmail.com`.
   - **jsPDF Receipt Generator**: On-demand downloadable PDF invoices on every order card in My Orders.

7. **Admin Operations Portal (`admin.html`)**:
   - Real-time KPI summary cards (Total Users, Total Orders, Gross Revenue, Security Audits).
   - User table with spend history, lockout status, and role management.
   - Live order stream with status filtering and audit log.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Vanilla JavaScript (ES6+ Modules)
- **Backend**: Node.js, Express.js, Helmet (security headers), Express-Rate-Limit, CORS
- **Database**: MySQL 8.0 / MySQL 5.7 (`fudwala`), `mysql2/promise` connection pool
- **Hashing**: `@node-rs/argon2`
- **Integrations**: Razorpay Checkout SDK, EmailJS Browser SDK (`@emailjs/browser`), jsPDF (`jspdf.umd.min.js`)

---

## 📁 Repository Structure

```text
Foodwala/
├── index.html                   # Homepage & restaurant discovery
├── restaurants.html             # Categorized restaurant listing
├── cart.html                    # Shopping cart & bill breakdown
├── checkout.html                # Payment selection, address, & Razorpay modal
├── orders.html                  # Live order history & receipt download
├── order-tracking.html          # Real-time order progress timeline
├── profile.html                 # Profile management & password updates
├── login.html                   # Sign-in & password recovery
├── register.html                # Account registration with duplicate phone modal
├── admin.html                   # Administrator operational hub & audit logs
├── migrations.sql               # Clean database schema & sample catalog seed
├── README.md                    # Project documentation & deployment manual
├── js/
│   ├── api.js                   # Unified frontend API connector (prepared statements)
│   ├── app.js                   # Client-side application core & state
│   ├── emailService.js          # Dual customer/admin EmailJS receipt dispatcher
│   ├── receiptService.js        # Client-side jsPDF invoice generator
│   └── smart-search.js          # Typo-tolerant search engine
├── css/
│   └── style.css                # FoodWala branding & design system
└── server/                      # Node.js Express Backend
    ├── server.js                # Core API routes & prepared statements
    ├── db.js                    # MySQL connection pool with SSL support
    ├── package.json             # Backend dependencies & npm start script
    ├── .env.example             # Environment template (NO SECRETS)
    └── utils/
        └── password.js          # Argon2id hashing & legacy verification
```

---

## ⚙️ Local Development Setup

### 1. Database Setup
1. Open **MySQL Workbench** or your terminal.
2. Run [migrations.sql](file:///D:/FoodWala_Eclipse_Project/migrations.sql):
   ```bash
   mysql -u root -p < migrations.sql
   ```
   This creates the `fudwala` database and all required tables.

### 2. Configure Backend Environment
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your local MySQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=fudwala
   DB_SSL=false
   ADMIN_EMAIL=admin@foodwala.com
   ADMIN_PASSWORD=YourSecureAdminPassword123
   ADMIN_PHONE=9876543222
   JWT_SECRET=super_secret_jwt_key_2026
   OTP_HASH_SECRET=super_secret_otp_key_2026
   OTP_DEV_MODE=true
   SMS_PROVIDER=console
   ```

### 3. Run the Backend Server
```bash
cd server
npm install
npm start
```
Test that the server is alive:
`http://localhost:5000/api/health/db` $\rightarrow$ `{"status":"ok","database":"fudwala"}`.

### 4. Run the Frontend
Open `index.html` using VS Code Live Server (`http://127.0.0.1:5500/`) or your preferred local web server.

---

## ☁️ Cloud Deployment Guide (Live Site with MySQL)

GitHub Pages serves only static frontend files (HTML/CSS/JS). To enable live database operations for external visitors on your GitHub Pages site, deploy the backend and database using the free/starter tiers of **Render** (or **Railway**) and a cloud MySQL provider (**Railway MySQL** or **Aiven**).

### Step 1: Provision a Cloud MySQL Database (e.g. Railway or Aiven)
1. Sign up at [Railway.app](https://railway.app) or [Aiven.io](https://aiven.io).
2. Create a new **MySQL** database instance.
3. Obtain your database connection parameters:
   - `DB_HOST` (e.g., `mysql.railway.internal` or `*.aivencloud.com`)
   - `DB_PORT` (e.g., `3306` or assigned port)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME` (`fudwala` or default database name)
   - `DB_SSL=true`
4. Connect via MySQL Workbench using these credentials, open `migrations.sql`, and execute it to create the clean schema and seed catalog.

### Step 2: Deploy Backend to Render
1. Sign up at [Render.com](https://render.com).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your public GitHub repository: `https://github.com/vishnu6301382491-dev/Foodwala`.
4. Configure service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `FRONTEND_URL`: `https://vishnu6301382491-dev.github.io`
   - `DB_HOST`: *(Your cloud MySQL host)*
   - `DB_PORT`: *(Your cloud MySQL port)*
   - `DB_USER`: *(Your cloud MySQL user)*
   - `DB_PASSWORD`: *(Your cloud MySQL password)*
   - `DB_NAME`: *(Your cloud database name)*
   - `DB_SSL`: `true`
   - `ADMIN_EMAIL`: `admin@foodwala.com`
   - `ADMIN_PASSWORD`: *(Choose a strong admin password)*
   - `ADMIN_PHONE`: `9876543222`
   - `JWT_SECRET`: *(A long random 32+ character string)*
   - `OTP_HASH_SECRET`: *(A long random 32+ character string)*
   - `OTP_DEV_MODE`: `true`
6. Click **Deploy Web Service**. Render will assign a public HTTPS URL, for example:
   `https://foodwala-backend.onrender.com`

### Step 3: Connect Frontend to Hosted Backend
1. Open `js/api.js` in your repository.
2. Locate line ~20:
   ```javascript
   const HOSTED_BACKEND_URL = 'https://foodwala-backend.onrender.com';
   ```
3. Replace the placeholder with your actual Render/Railway URL.
4. Commit and push `js/api.js` to GitHub. GitHub Pages will automatically redeploy!

---

## 🌐 GitHub Pages Deployment Settings

To ensure GitHub Pages serves your site correctly:
1. Open your repository on GitHub: `https://github.com/vishnu6301382491-dev/Foodwala`.
2. Go to **Settings** $\rightarrow$ **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
4. Click **Save**.
5. Your live site will be accessible at:
   👉 **[https://vishnu6301382491-dev.github.io/Foodwala/](https://vishnu6301382491-dev.github.io/Foodwala/)**

---

## 🧪 Live Site Verification Checklist

| # | Action | Steps to Test | Expected Behavior |
|---|---|---|---|
| 1 | **Sign Up with Duplicate Phone** | Open `register.html`, enter name, password, and an existing phone number | Blur trigger / submit displays the duplicate modal (*"Go to Login"*) with HTTP 409 rejection. |
| 2 | **New Account Registration** | Enter a new 10-digit number, name, and email | Account is created in `fudwala.user` with an Argon2id hash; auto-logs in. |
| 3 | **Login & Lockout Protection** | Open `login.html`, enter wrong password 5 times | Account locks for 15 minutes with dynamic lockout countdown; audit recorded in `login_history`. |
| 4 | **Browse Catalog & Menu** | Open `index.html` or `restaurants.html` | Restaurants and live menu items load dynamically from MySQL. |
| 5 | **Apply Coupon** | In `cart.html`, apply `FOODWALA50` or `WELCOME` | Discounts calculate dynamically and validate against `fudwala.coupons`. |
| 6 | **Place Transactional Order** | In `checkout.html`, choose Razorpay Sandbox or COD | Order is committed atomically in `orders`, `order_item`, and `payment`. |
| 7 | **View Orders & Download Receipt** | Open `orders.html` | Order appears with live status; click **Download Receipt** for jsPDF invoice. |
| 8 | **Admin Portal** | Log in with admin credentials and open `admin.html` | Displays live KPI metrics, user directory, orders table, and security audit log. |

---

## 🔍 MySQL Workbench Verification Queries

Execute these queries in **MySQL Workbench** to audit your database:

```sql
USE fudwala;

-- 1. Inspect registered users & security status
SELECT user_id, username, email, phone, role, failed_attempts, locked_until, last_login 
FROM user 
ORDER BY user_id DESC;

-- 2. Confirm unique phone constraint is active
SHOW INDEX FROM user WHERE Key_name = 'uq_user_phone';

-- 3. Verify Argon2id password hash format
SELECT user_id, username, email, LEFT(password_hash, 30) AS hash_prefix 
FROM user;

-- 4. Review security audit log
SELECT lh.id, lh.login_time, u.username, u.phone, lh.ip_address, lh.status 
FROM login_history lh
JOIN user u ON lh.user_id = u.user_id
ORDER BY lh.id DESC LIMIT 15;

-- 5. Review transactional orders & restaurant links
SELECT 
    o.order_id,
    o.order_date,
    o.customer_name,
    o.customer_phone,
    r.name AS restaurant_name,
    o.total_amount,
    o.status AS order_status,
    o.payment_mode,
    o.payment_status,
    COUNT(oi.order_item_id) AS total_items
FROM orders o
LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
LEFT JOIN order_item oi ON o.order_id = oi.order_id
GROUP BY o.order_id
ORDER BY o.order_id DESC LIMIT 10;

-- 6. Audit payment transactions
SELECT payment_id, order_id, amount, payment_mode, payment_status, payment_date, transaction_id 
FROM payment 
ORDER BY payment_id DESC LIMIT 10;

-- 7. Audit coupons and redemption count
SELECT c.code, c.discount_type, c.discount_value, COUNT(cu.usage_id) AS times_used
FROM coupons c
LEFT JOIN coupon_usage cu ON c.coupon_id = cu.coupon_id
GROUP BY c.coupon_id;
```

---

## 🔒 Security Best Practices & Maintenance

- **Never Commit `.env`**: Always ensure `.env` remains in `.gitignore`.
- **Rotate Exposed Secrets**: If any third-party credentials (e.g. EmailJS private key or cloud DB passwords) were previously exposed in client-side files, rotate them in their respective provider consoles immediately.
- **Regular Backups**: Take regular database backups via MySQL Workbench (**Server** $\rightarrow$ **Data Export** $\rightarrow$ **Self-Contained File**).

---
© 2026 FoodWala Inc. All rights reserved.
