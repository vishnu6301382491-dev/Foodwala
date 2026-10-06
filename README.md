# 🍲 FoodWala - Food Delivery Web Application

FoodWala is a full-featured Bengaluru Food Delivery Web Application built with Java Servlets, JSP, JDBC, MySQL, HTML5/CSS3/JavaScript, running on Apache Tomcat 11 / Jakarta EE.

---

## 🌟 Key Features

1. **Iconic Bengaluru Restaurant Catalog**:
   - 100+ verified iconic eateries (Vidyarthi Bhavan, Meghana Foods, Mani's Dum Biryani, CTR, VV Puram Food Street, etc.).
   - Multi-category menu discovery with real-time pricing and veg/non-veg indicators.

2. **Smart Typo-Tolerant Food Search**:
   - Tolerates typos, phonetic transliterations, and compound words (`biriyani` ↔ `biryani`, `dumbiriyani` ↔ `dum biryani`, `dhosa` ↔ `dosa`, `panner` ↔ `paneer`, `chikn` ↔ `chicken`).
   - Searches across Restaurant names, Cuisines, Menu items, and Food categories simultaneously.
   - Interactive autocomplete suggestions with food icons and "Did you mean" recommendation banner.
   - Displays matched dishes directly on restaurant cards.

3. **Multi-Filter & Geolocation Discovery**:
   - Filter by Bengaluru localities (Basavanagudi, Indiranagar, Koramangala, Whitefield, HSR Layout, Malleshwaram, etc.).
   - GPS-assisted geolocation with Haversine distance calculation and proximity sorting.
   - Quick filters: Pure Veg, 4.0+ Rated, Under 30 Mins, Open Now, Within 5km / 10km.

4. **Cart & Dynamic Checkout Flow**:
   - Session-managed shopping cart with quantity modifications.
   - Auto-fills authenticated user information and default delivery addresses dynamically.
   - Razorpay payment gateway integration with callback verification and order generation.

5. **Role-Based Portals & Order Tracking**:
   - Customer Portal: Live order status tracking with visual timeline.
   - Restaurant Portal: Order management and preparation status updates.
   - Delivery Partner Portal: Accept/reject orders and route management.

---

## 🛠️ Technology Stack

- **Backend**: Java 17+, Jakarta Servlet 5.0/6.0, JDBC
- **Server**: Apache Tomcat 11.0
- **Database**: MySQL 8.0+
- **Frontend**: JSP, HTML5, CSS3, Modern ES6 JavaScript, Fetch API
- **IDE**: Eclipse IDE for Enterprise Java and Web Developers (WTP)

---

## 🚀 Setup & Installation Instructions

### 1. Prerequisites
- JDK 17 or later (Adoptium / Eclipse Temurin recommended)
- Apache Tomcat 11.0.x
- MySQL Server 8.0+
- Eclipse IDE for Enterprise Java and Web Developers

### 2. Database Setup
1. Open MySQL Workbench or MySQL CLI.
2. Run the database script:
   ```sql
   SOURCE sql/fudwala.sql;
   ```
3. Update `src/main/java/com/tap/util/DBConnection.java` with your MySQL credentials (default: `localhost:3306`, `root`/`root`).

### 3. Eclipse Import
1. Open Eclipse IDE.
2. Click **File -> Import -> General -> Existing Projects into Workspace**.
3. Select `FoodWala_Eclipse_Project` as the root directory and click **Finish**.
4. Right-click the project -> **Run As -> Run on Server** -> Select **Apache Tomcat v11.0**.

---

## 🌐 Application URLs

- **Home**: `http://localhost:8080/FoodWala/`
- **Restaurants & Smart Search**: `http://localhost:8080/FoodWala/restaurants`
- **Cart**: `http://localhost:8080/FoodWala/cart`
- **Checkout**: `http://localhost:8080/FoodWala/checkout`
- **My Orders**: `http://localhost:8080/FoodWala/orders`
- **Login / Register**: `http://localhost:8080/FoodWala/login`
- **Restaurant Portal**: `http://localhost:8080/FoodWala/restaurant/dashboard`
- **Delivery Partner Portal**: `http://localhost:8080/FoodWala/delivery/dashboard`

---

## 🧪 Testing & Verification

A full system automated verification suite is included:
```bash
java -cp "build/classes;WEB-INF/lib/*" com.tap.test.FoodWalaFullSystemVerification
```

---

## 📄 License
Open source under the MIT License.
