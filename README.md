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

1. **Authentication & User Security**:
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

🛠️ Tech Stack
Frontend: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, JavaScript ES6+, Responsive Web Design
Backend: Java 17+, Spring Boot, Spring MVC, Spring REST APIs, Spring Security, Spring Data JPA, Hibernate, Jakarta Validation, Maven
Database: MySQL 8.0, SQL, JPA/Hibernate ORM
Security: Spring Security, BCrypt Password Hashing, Authentication and Authorization, Role-Based Access Control (RBAC), Session/JWT Authentication Architecture, Input Validation, CORS Configuration
Integrations: Razorpay Payment Gateway, JavaMail / SMTP, OTP Verification Architecture, PDF Invoice Generation
Development Tools: IntelliJ IDEA, Eclipse, Visual Studio Code, MySQL Workbench, Postman, Git and GitHub

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
