-- =======================================================================
-- FoodWala Database Migrations (Schema & Sample Catalog)
-- Database: fudwala
-- 
-- Single Source of Truth for FoodWala Food-Delivery Platform
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / Cloud MySQL (Railway, Aiven, Render)
-- NOTE: Contains only schema definitions and sample catalog/coupons.
-- Real user credentials, phones, emails, and passwords are NOT stored here.
-- =======================================================================

CREATE DATABASE IF NOT EXISTS fudwala;
USE fudwala;

-- -----------------------------------------------------------------------
-- 1. USER TABLE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'customer',
  address TEXT NULL,
  password_hash VARCHAR(255) NOT NULL,
  last_login DATETIME NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  password_changed_at DATETIME NULL,
  reset_token VARCHAR(100) NULL,
  reset_token_expires DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_phone UNIQUE (phone),
  INDEX idx_user_email (email),
  INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 2. RESTAURANTS & MENUS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant (
  restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cuisine VARCHAR(100) NULL,
  delivery_time INT DEFAULT 30,
  address TEXT NULL,
  rating DECIMAL(2,1) DEFAULT 4.2,
  is_active TINYINT(1) DEFAULT 1,
  image_path VARCHAR(255) NULL,
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  admin_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu (
  menu_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.0,
  is_available TINYINT(1) DEFAULT 1,
  image_path VARCHAR(255) NULL,
  category_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_menu_restaurant (restaurant_id),
  CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 3. ORDERS & ITEMS (ACID Transactions)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  user_id INT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PLACED',
  payment_mode VARCHAR(50) DEFAULT 'RAZORPAY',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customer_name VARCHAR(100) NULL,
  customer_phone VARCHAR(20) NULL,
  customer_email VARCHAR(100) NULL,
  delivery_address TEXT NULL,
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_date (order_date),
  CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_item (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  item_total DECIMAL(10,2) NOT NULL,
  INDEX idx_item_order (order_id),
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 4. PAYMENTS & STATUS HISTORY
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_id VARCHAR(100) NULL,
  gateway_name VARCHAR(50) NULL,
  razorpay_order_id VARCHAR(100) NULL,
  razorpay_payment_id VARCHAR(100) NULL,
  razorpay_signature VARCHAR(255) NULL,
  INDEX idx_payment_order (order_id),
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_status_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  change_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(50) NULL,
  remarks TEXT NULL,
  INDEX idx_status_order (order_id),
  CONSTRAINT fk_status_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 5. ADDRESSES & DELIVERY PARTNERS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS address (
  address_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address_line TEXT NOT NULL,
  city VARCHAR(100) DEFAULT 'Bengaluru',
  pincode VARCHAR(20) NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_address_user (user_id),
  CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS delivery_partner (
  partner_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'AVAILABLE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 6. SECURITY LOGIN AUDIT (login_history)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL,
  INDEX idx_login_user (user_id),
  INDEX idx_login_time (login_time),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 7. CART & CART ITEMS
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  restaurant_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_item (
  cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  menu_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cart_item_cart (cart_id),
  CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_item_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 8. COUPONS & COUPON USAGE
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('PERCENTAGE', 'FLAT') NOT NULL DEFAULT 'PERCENTAGE',
  discount_value DOUBLE NOT NULL,
  min_order_amount DOUBLE NOT NULL DEFAULT 0,
  max_discount DOUBLE NULL,
  description VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS coupon_usage (
  usage_id INT AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT NOT NULL,
  user_id INT NOT NULL,
  order_id INT NULL,
  discount_amount DOUBLE NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usage_user (user_id),
  CONSTRAINT fk_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE,
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 9. FAVORITES, REVIEWS, NOTIFICATIONS & ACTIVITY LOG
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  restaurant_id INT NULL,
  menu_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_rest (user_id, restaurant_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  order_id INT NULL,
  rating DECIMAL(2,1) NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_review_rest (restaurant_id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_review_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activity_log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_user (user_id),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------------------
-- 10. SEED SAMPLE COUPONS
-- -----------------------------------------------------------------------
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, description, is_active, expires_at)
VALUES 
  ('FOODWALA50', 'PERCENTAGE', 50, 199, 100, '50% OFF up to ₹100 on orders above ₹199', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  ('WELCOME', 'FLAT', 50, 149, 50, 'Flat ₹50 OFF on first order above ₹149', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  ('BENGALURU100', 'PERCENTAGE', 20, 499, 150, '20% OFF up to ₹150 on orders above ₹499', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  ('SUPER60', 'PERCENTAGE', 60, 249, 120, '60% OFF up to ₹120 on super saver orders', 1, DATE_ADD(NOW(), INTERVAL 1 YEAR))
ON DUPLICATE KEY UPDATE 
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  min_order_amount = VALUES(min_order_amount),
  max_discount = VALUES(max_discount),
  is_active = 1;

-- -----------------------------------------------------------------------
-- 11. SEED SAMPLE CATEGORIES & RESTAURANTS
-- -----------------------------------------------------------------------
INSERT IGNORE INTO menu_category (category_id, name, description) VALUES
  (1, 'South Indian', 'Traditional dosas, idlis, vadas and tiffin specialties'),
  (2, 'North Indian', 'Rich curries, rotis, paneer and tandoori delicacies'),
  (3, 'Biryani', 'Aromatic dum biryanis and coastal rice dishes'),
  (4, 'Burgers & Fast Food', 'Gourmet burgers, fries, shakes and quick bites'),
  (5, 'Desserts & Sweets', 'Traditional and contemporary sweet treats'),
  (6, 'Beverages', 'Filter coffee, fresh juices, and milkshakes');

INSERT IGNORE INTO restaurant (restaurant_id, name, cuisine, delivery_time, address, rating, is_active, latitude, longitude) VALUES
  (1, 'Central Tiffin Room (CTR) - Shri Sagar', 'South Indian, Street Food', 25, '7th Cross Rd, Malleshwaram, Bengaluru, Karnataka 560003', 4.8, 1, 12.9982, 77.5707),
  (2, 'Vidyarthi Bhavan', 'South Indian, Breakfast', 30, 'Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru, Karnataka 560004', 4.7, 1, 12.9427, 77.5739),
  (3, 'Meghana Foods', 'Biryani, Andhra, North Indian', 35, '1st Block, Koramangala, Bengaluru, Karnataka 560034', 4.6, 1, 12.9343, 77.6253),
  (4, 'Truffles', 'American, Cafe, Burgers', 28, 'Apex Building, 80 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038', 4.7, 1, 12.9784, 77.6408),
  (5, 'Nagarjuna', 'Andhra, Biryani, South Indian', 32, 'Residency Rd, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560025', 4.5, 1, 12.9721, 77.6074);

INSERT IGNORE INTO menu (menu_id, restaurant_id, name, description, price, rating, is_available, category_id) VALUES
  (1, 1, 'Crispy Benne Masala Dosa', 'Signature golden butter dosa served with coconut chutney and saagu.', 120.00, 4.9, 1, 1),
  (2, 1, 'Filter Coffee', 'Traditional South Indian chicory decoction with frothy steamed milk.', 45.00, 4.8, 1, 6),
  (3, 1, 'Rava Idli with Ghee', 'Steamed semolina cake seasoned with mustard seeds, curry leaves, and cashews.', 70.00, 4.6, 1, 1),
  (4, 2, 'Special Masala Dosa', 'Iconic heritage masala dosa roasted with generous ghee.', 110.00, 4.8, 1, 1),
  (5, 2, 'Crispy Medu Vada (2 pcs)', 'Golden crisp lentil fritters served with sambar and fresh chutney.', 65.00, 4.7, 1, 1),
  (6, 3, 'Meghana Special Chicken Biryani', 'Spicy Andhra style dum biryani loaded with tender marinated chicken pieces.', 320.00, 4.9, 1, 3),
  (7, 3, 'Paneer Biryani', 'Fragrant basmati rice layered with paneer tikka and Andhra spices.', 280.00, 4.5, 1, 3),
  (8, 4, 'All-American Cheese Burger', 'Juicy grilled patty topped with aged cheddar, caramelized onions, and house sauce.', 250.00, 4.8, 1, 4),
  (9, 4, 'Peri Peri Loaded Fries', 'Crispy french fries tossed with fiery peri peri seasoning and cheese dip.', 160.00, 4.6, 1, 4),
  (10, 5, 'Andhra Chicken 65', 'Deep fried spicy boneless chicken pieces tempered with curry leaves and green chillies.', 290.00, 4.7, 1, 2);

-- End of migrations.sql
