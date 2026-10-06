# 🍲 FoodWala — Bengaluru Food Discovery & Delivery Platform

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?logo=github)](https://vishnu6301382491-dev.github.io/Foodwala/)
[![Java](https://img.shields.io/badge/Java-17%2B-orange?logo=java)](https://www.oracle.com/java/)
[![Jakarta EE](https://img.shields.io/badge/Jakarta%20EE-10-blue)](https://jakarta.ee/)
[![Apache Tomcat](https://img.shields.io/badge/Apache%20Tomcat-11.0.4-yellow?logo=apache-tomcat)](https://tomcat.apache.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue?logo=mysql)](https://www.mysql.com/)

**FoodWala** is a full-featured Bengaluru Food Discovery & Delivery Web Application originally built using Java Servlets, JSP, JDBC, and MySQL running on Apache Tomcat 11 / Jakarta EE.

This repository provides:
1. 🌐 **Live GitHub Pages Interactive Demo**: [https://vishnu6301382491-dev.github.io/Foodwala/](https://vishnu6301382491-dev.github.io/Foodwala/) — An interactive frontend simulation featuring the complete Bengaluru restaurant catalog, categorized menus, client-side Jaro-Winkler fuzzy smart search, cart, checkout simulation, and live delivery timeline.
2. ☕ **Full Java/Jakarta EE Backend**: Complete Java Servlet, DAO, Model, and MySQL database layer (`sql/fudwala.sql`) ready to run locally in Eclipse IDE with Apache Tomcat 11.

---

## 🌟 Key Features

### 1. 🏙️ Complete Bengaluru Restaurant Catalog & Menus
- Curated dining institutions across 12 Bengaluru zones: Koramangala, Indiranagar, Whitefield, MG Road, HSR Layout, Malleshwaram, Jayanagar, Electronic City, JP Nagar, Bellandur, Marathahalli, and Hebbal.
- Multi-category menus (Starters, Biryani, Main Course, Dosa & Tiffins, Desserts, Beverages) with real-time pricing and veg/non-veg badges.
- Individual restaurant menus lazily loaded via structured `data/menus/<restaurantId>.json` endpoints for maximum frontend speed.

### 2. 🔍 Smart Typo-Tolerant Food Search Engine
- Tolerates typos, phonetic transliterations, and compound words (`biriyani` ↔ `biryani`, `dumbiriyani` ↔ `dum biryani`, `dhosa` ↔ `dosa`, `panner` ↔ `paneer`, `chikn` ↔ `chicken`).
- Simultaneous searching across Restaurant names, Cuisines, Menu items, and Food categories.
- Real-time debounced autocomplete suggestions with food icons.
- "Did you mean?" intelligent recommendation banner.
- Matched dish pill tags rendered directly inside restaurant cards.

### 3. 🎯 Multi-Filter & Geolocation Discovery
- Filter by Bengaluru localities and cuisine types.
- GPS / Haversine distance calculation and proximity sorting.
- Quick filter chips: Pure Veg, 4.0+ Rated, Under 30 Mins, Open Now, Within 5 km, Within 10 km.

### 4. 🛒 Complete Shopping Cart & Simulated Checkout Flow
- Add / remove items, update quantities with live bill calculation.
- Coupon engine supporting codes like `FOODWALA50` and `WELCOME`.
- Delivery address selection with custom address management.
- Multi-payment support: UPI Instant, Credit/Debit Card, Net Banking, and Cash on Delivery.

### 5. 🚴 Real-Time Order Tracking & History
- Visual 5-step delivery timeline (Order Placed → Accepted → Food Prepared → Rider Out → Delivered).
- Delivery partner contact card with rider photo, bike details, and verification OTP.
- Past and active orders management with instant reorder support.

### 6. 👤 User Authentication & Roles
- 1-Click Fast Demo Login for quick testing:
  - 👤 **Customer**: Rahul Sharma (`customer@foodwala.com`)
  - 🏪 **Restaurant Manager**: Vidyarthi Bhavan (`vidyarthi@foodwala.com`)
  - 🛵 **Delivery Partner**: Ramesh Kumar (`partner@foodwala.com`)
- Saved addresses manager and user profile settings.

---

## 🚀 Live Demo on GitHub Pages

The static frontend demo is deployed at:
👉 **[https://vishnu6301382491-dev.github.io/Foodwala/](https://vishnu6301382491-dev.github.io/Foodwala/)**

### Static Data Architecture
- `data/restaurants.json`: Complete restaurant metadata and locations.
- `data/menu-items.json`: Complete catalog of menu items with pricing and categories.
- `data/categories.json`: Complete list of dining categories.
- `data/menus/<id>.json`: Individual lazy-loaded restaurant menu datasets.

---

## 🛠️ Local Java / Tomcat / Eclipse Setup

To run the complete full-stack Java Servlet / JSP / MySQL application locally:

### 1. Prerequisites
- **JDK 17+** (Adoptium / Eclipse Temurin recommended)
- **Apache Tomcat 11.0.x**
- **MySQL Server 8.0+**
- **Eclipse IDE for Enterprise Java and Web Developers** (WTP)

### 2. Database Initialization
1. Open MySQL Workbench or MySQL CLI.
2. Execute the schema & seed script:
   ```sql
   SOURCE sql/fudwala.sql;
   ```
3. Update `src/main/java/com/tap/util/DBConnection.java` with your MySQL credentials (default: `localhost:3306`, user: `root`, pass: `root`).

### 3. Eclipse Import & Run
1. Open Eclipse IDE.
2. Click **File -> Import -> General -> Existing Projects into Workspace**.
3. Select this folder as the root directory and click **Finish**.
4. Right-click the project -> **Run As -> Run on Server** -> Select **Apache Tomcat v11.0**.
5. Visit `http://localhost:8080/FoodWala/` in your browser.

---

## 📁 Repository Structure

```
FoodWala/
├── index.html                  # Live Demo Landing Page
├── restaurants.html            # Restaurant Discovery & Smart Search
├── restaurant-details.html     # Restaurant Details & Lazy Menu Loading
├── menu.html                   # Menu URL alias
├── cart.html                   # Shopping Cart & Bill Breakdown
├── checkout.html               # Secure Checkout & Payment Simulation
├── order-track.html            # Live Visual Delivery Timeline
├── orders.html                 # My Orders History
├── login.html                  # Sign In with 1-Click Demo Accounts
├── register.html               # New User Registration
├── profile.html                # User Profile & Saved Addresses
├── css/
│   └── style.css               # Modern Responsive FoodWala Styling
├── data/
│   ├── restaurants.json        # Complete Restaurant Dataset
│   ├── menu-items.json         # Complete Menu Items Dataset
│   ├── categories.json         # Menu Categories
│   └── menus/                  # 105 Individual Lazy-Loaded Menu JSONs
│       ├── 1.json
│       ├── 2.json
│       └── ...
├── js/
│   ├── foodwala-data.js        # Bundled Offline Dataset Fallback
│   ├── smart-search.js         # Jaro-Winkler Client Fuzzy Search Engine
│   └── app.js                  # Dynamic Data Loader, Cart & State Manager
├── src/main/java/com/tap/      # Java Servlets, DAOs, Models & Backend
│   ├── controller/             # Jakarta Servlet Controllers
│   ├── dao/ & daoimpl/         # JDBC DAO Layer
│   ├── model/                  # POJO Entity Models
│   ├── search/                 # Java Fuzzy Search & Alias Engine
│   └── util/                   # DBConnection & Utilities
├── src/main/webapp/            # JSP Web Application Files
└── sql/
    └── fudwala.sql             # Complete MySQL Database Dump
```

---

## 📄 License
Released under the MIT License.
