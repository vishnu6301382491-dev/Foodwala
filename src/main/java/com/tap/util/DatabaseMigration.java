package com.tap.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DatabaseMigration {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/fudwala?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        try (Connection con = DriverManager.getConnection(url, "root", "root");
             Statement st = con.createStatement()) {

            System.out.println("Starting Database Migration for FoodWala Complete System...");

            // 1. Restaurant table extensions
            addColumnIfNotExists(st, "restaurant", "latitude", "DOUBLE DEFAULT 12.9716");
            addColumnIfNotExists(st, "restaurant", "longitude", "DOUBLE DEFAULT 77.5946");
            addColumnIfNotExists(st, "restaurant", "city", "VARCHAR(100) DEFAULT 'Bengaluru'");
            addColumnIfNotExists(st, "restaurant", "state", "VARCHAR(100) DEFAULT 'Karnataka'");
            addColumnIfNotExists(st, "restaurant", "pincode", "VARCHAR(20) DEFAULT '560004'");
            addColumnIfNotExists(st, "restaurant", "phone", "VARCHAR(20) DEFAULT '+91 80 2667 7588'");

            // Update realistic coordinates for Bengaluru restaurants
            st.executeUpdate("UPDATE restaurant SET latitude=13.0031, longitude=77.5714, pincode='560003', phone='+91 80 2334 4838' WHERE restaurant_id=1"); // CTR Malleshwaram
            st.executeUpdate("UPDATE restaurant SET latitude=12.9438, longitude=77.5738, pincode='560004', phone='+91 80 2667 7588' WHERE restaurant_id=2"); // Vidyarthi Bhavan Basavanagudi
            st.executeUpdate("UPDATE restaurant SET latitude=12.9554, longitude=77.5873, pincode='560027', phone='+91 80 2222 0022' WHERE restaurant_id=3"); // MTR Lalbagh
            st.executeUpdate("UPDATE restaurant SET latitude=12.9298, longitude=77.5834, pincode='560011', phone='+91 80 2663 3456' WHERE restaurant_id=4"); // Corner House Jayanagar
            st.executeUpdate("UPDATE restaurant SET latitude=12.9152, longitude=77.5841, pincode='560082', phone='+91 99863 56789' WHERE restaurant_id=5"); // Shivaji Military Hotel Jayanagar
            st.executeUpdate("UPDATE restaurant SET latitude=12.9482, longitude=77.5683, pincode='560004', phone='+91 80 2660 1234' WHERE restaurant_id=6"); // Brahmin's Coffee Bar Shankarpuram
            st.executeUpdate("UPDATE restaurant SET latitude=12.9343, longitude=77.6186, pincode='560034', phone='+91 80 4110 5555' WHERE restaurant_id=7"); // Meghana Foods Koramangala
            st.executeUpdate("UPDATE restaurant SET latitude=12.9338, longitude=77.6142, pincode='560034', phone='+91 80 4146 6565' WHERE restaurant_id=8"); // Truffles Koramangala

            // 2. Orders table extensions
            addColumnIfNotExists(st, "orders", "customer_name", "VARCHAR(100)");
            addColumnIfNotExists(st, "orders", "customer_phone", "VARCHAR(20)");
            addColumnIfNotExists(st, "orders", "delivery_address", "TEXT");
            addColumnIfNotExists(st, "orders", "delivery_lat", "DOUBLE");
            addColumnIfNotExists(st, "orders", "delivery_lng", "DOUBLE");
            addColumnIfNotExists(st, "orders", "delivery_fee", "DOUBLE DEFAULT 40.0");
            addColumnIfNotExists(st, "orders", "taxes", "DOUBLE DEFAULT 0.0");
            addColumnIfNotExists(st, "orders", "discount", "DOUBLE DEFAULT 0.0");
            addColumnIfNotExists(st, "orders", "item_total", "DOUBLE DEFAULT 0.0");
            addColumnIfNotExists(st, "orders", "delivery_partner_id", "INT NULL");
            addColumnIfNotExists(st, "orders", "payment_status", "VARCHAR(50) DEFAULT 'PENDING'");
            addColumnIfNotExists(st, "orders", "estimated_delivery_time", "VARCHAR(100) DEFAULT '30-40 mins'");
            addColumnIfNotExists(st, "orders", "razorpay_order_id", "VARCHAR(100) NULL");
            addColumnIfNotExists(st, "orders", "razorpay_payment_id", "VARCHAR(100) NULL");
            addColumnIfNotExists(st, "orders", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

            // 3. Order item table extensions
            addColumnIfNotExists(st, "order_item", "item_name", "VARCHAR(150)");
            addColumnIfNotExists(st, "order_item", "price_at_order", "DOUBLE DEFAULT 0.0");

            // 4. Address table
            st.executeUpdate("CREATE TABLE IF NOT EXISTS address (" +
                "address_id INT PRIMARY KEY AUTO_INCREMENT," +
                "user_id INT NOT NULL," +
                "full_name VARCHAR(100) NOT NULL," +
                "phone VARCHAR(20) NOT NULL," +
                "house_no VARCHAR(100)," +
                "street VARCHAR(150)," +
                "area VARCHAR(150)," +
                "city VARCHAR(100) DEFAULT 'Bengaluru'," +
                "state VARCHAR(100) DEFAULT 'Karnataka'," +
                "pincode VARCHAR(20)," +
                "latitude DOUBLE," +
                "longitude DOUBLE," +
                "formatted_address VARCHAR(500) NOT NULL," +
                "address_type VARCHAR(50) DEFAULT 'Home'," +
                "is_default BOOLEAN DEFAULT FALSE," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE" +
            ")");

            // 5. Order status history table
            st.executeUpdate("CREATE TABLE IF NOT EXISTS order_status_history (" +
                "history_id INT PRIMARY KEY AUTO_INCREMENT," +
                "order_id INT NOT NULL," +
                "status VARCHAR(50) NOT NULL," +
                "changed_by VARCHAR(100)," +
                "timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "remarks VARCHAR(255)," +
                "CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE" +
            ")");

            // 6. Delivery partner table
            st.executeUpdate("CREATE TABLE IF NOT EXISTS delivery_partner (" +
                "partner_id INT PRIMARY KEY AUTO_INCREMENT," +
                "user_id INT NOT NULL UNIQUE," +
                "name VARCHAR(100) NOT NULL," +
                "phone VARCHAR(20) NOT NULL," +
                "vehicle_number VARCHAR(50) DEFAULT 'KA-05-EJ-1234'," +
                "current_lat DOUBLE DEFAULT 12.9416," +
                "current_lng DOUBLE DEFAULT 77.5750," +
                "accuracy DOUBLE DEFAULT 10.0," +
                "is_available BOOLEAN DEFAULT TRUE," +
                "last_location_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                "CONSTRAINT fk_partner_user FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE" +
            ")");

            // 7. Payment table
            st.executeUpdate("CREATE TABLE IF NOT EXISTS payment (" +
                "payment_id INT PRIMARY KEY AUTO_INCREMENT," +
                "order_id INT NOT NULL," +
                "transaction_id VARCHAR(100) UNIQUE NOT NULL," +
                "amount DOUBLE NOT NULL," +
                "payment_method VARCHAR(50) NOT NULL," +
                "payment_status VARCHAR(50) NOT NULL," +
                "gateway_reference VARCHAR(100)," +
                "masked_account VARCHAR(100)," +
                "razorpay_order_id VARCHAR(100) NULL," +
                "razorpay_payment_id VARCHAR(100) NULL," +
                "razorpay_signature VARCHAR(255) NULL," +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                "CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE" +
            ")");
            addColumnIfNotExists(st, "payment", "razorpay_order_id", "VARCHAR(100) NULL");
            addColumnIfNotExists(st, "payment", "razorpay_payment_id", "VARCHAR(100) NULL");
            addColumnIfNotExists(st, "payment", "razorpay_signature", "VARCHAR(255) NULL");

            // 8. Seed sample roles & accounts
            // Password '123456' hash: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
            st.executeUpdate("INSERT IGNORE INTO `user` (user_id, username, password, email, phone, address, role) VALUES " +
                "(3, 'Rahul (Partner)', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'rahul.delivery@foodwala.com', '9876543220', 'Basavanagudi, Bengaluru', 'DELIVERY_PARTNER')," +
                "(4, 'Vidyarthi Bhavan Staff', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'vb.admin@foodwala.com', '9876543221', 'Gandhi Bazaar, Basavanagudi, Bengaluru', 'RESTAURANT')," +
                "(5, 'Admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', 'admin@foodwala.com', '9876543222', 'Bengaluru Central', 'ADMIN')");

            st.executeUpdate("INSERT IGNORE INTO delivery_partner (partner_id, user_id, name, phone, vehicle_number, current_lat, current_lng, accuracy, is_available) VALUES " +
                "(1, 3, 'Rahul', '9876543220', 'KA-05-EJ-1234', 12.9416, 77.5750, 8.5, TRUE)");

            st.executeUpdate("UPDATE restaurant SET admin_user_id=4 WHERE restaurant_id=2");

            System.out.println("DATABASE MIGRATION COMPLETED SUCCESSFULLY!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void addColumnIfNotExists(Statement st, String table, String column, String definition) {
        try {
            st.executeUpdate("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            System.out.println("Added column " + column + " to table " + table);
        } catch (Exception e) {
            // Already exists or handled
        }
    }
}
