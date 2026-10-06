package com.tap.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DatabaseUpdate {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/fudwala?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        try (Connection con = DriverManager.getConnection(url, "root", "root");
             Statement st = con.createStatement()) {

            System.out.println("Starting Database Schema Update & Data Healing for FoodWala...");

            // 1. Add missing delivery snapshot columns to orders table
            addColumnIfNotExists(st, "orders", "customer_email", "VARCHAR(150)");
            addColumnIfNotExists(st, "orders", "house_number", "VARCHAR(100)");
            addColumnIfNotExists(st, "orders", "street", "VARCHAR(150)");
            addColumnIfNotExists(st, "orders", "area", "VARCHAR(150)");
            addColumnIfNotExists(st, "orders", "city", "VARCHAR(100) DEFAULT 'Bengaluru'");
            addColumnIfNotExists(st, "orders", "state", "VARCHAR(100) DEFAULT 'Karnataka'");
            addColumnIfNotExists(st, "orders", "pincode", "VARCHAR(20) DEFAULT '560004'");
            addColumnIfNotExists(st, "orders", "landmark", "VARCHAR(150)");
            addColumnIfNotExists(st, "orders", "delivery_instructions", "VARCHAR(255)");

            // 2. Add delivery partner extensions
            addColumnIfNotExists(st, "delivery_partner", "vehicle_type", "VARCHAR(50) DEFAULT 'Electric Scooter'");
            addColumnIfNotExists(st, "delivery_partner", "profile_image", "VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'");
            addColumnIfNotExists(st, "delivery_partner", "rating", "DOUBLE DEFAULT 4.8");
            addColumnIfNotExists(st, "delivery_partner", "status", "VARCHAR(50) DEFAULT 'AVAILABLE'");

            // 3. Ensure primary delivery partner exists
            st.executeUpdate("INSERT IGNORE INTO delivery_partner (partner_id, user_id, name, phone, vehicle_number, vehicle_type, rating, status, current_lat, current_lng, accuracy, is_available) " +
                "VALUES (1, 3, 'Rahul Kumar', '9876543220', 'KA 05 EJ 1234', 'Hero Electric Scooter', 4.8, 'AVAILABLE', 12.9438, 77.5738, 5.0, TRUE)");

            st.executeUpdate("UPDATE delivery_partner SET name='Rahul Kumar', vehicle_number='KA 01 AB 1234', vehicle_type='Hero Electric Scooter', rating=4.8, status='AVAILABLE' WHERE partner_id=1");

            // 4. Backfill any existing order_item records where item_name is missing or placeholder
            st.executeUpdate(
                "UPDATE order_item oi " +
                "JOIN menu m ON oi.menu_id = m.menu_id " +
                "SET oi.item_name = m.item_name, " +
                "    oi.price_at_order = CASE WHEN oi.price_at_order IS NULL OR oi.price_at_order = 0 THEN m.price ELSE oi.price_at_order END " +
                "WHERE oi.item_name IS NULL OR oi.item_name LIKE 'Item #%'"
            );

            // 5. Backfill orders where customer_name / phone / address was null or 'Valued Customer'
            st.executeUpdate(
                "UPDATE orders o " +
                "JOIN `user` u ON o.user_id = u.user_id " +
                "SET o.customer_name = CASE WHEN o.customer_name IS NULL OR o.customer_name='Valued Customer' THEN u.username ELSE o.customer_name END, " +
                "    o.customer_phone = CASE WHEN o.customer_phone IS NULL OR o.customer_phone='' THEN COALESCE(u.phone, '9876543210') ELSE o.customer_phone END, " +
                "    o.customer_email = CASE WHEN o.customer_email IS NULL OR o.customer_email='' THEN u.email ELSE o.customer_email END, " +
                "    o.delivery_address = CASE WHEN o.delivery_address IS NULL OR o.delivery_address='' THEN 'Flat 203, ABC Apartments, MG Road, Malleswaram, Bengaluru, Karnataka - 560003' ELSE o.delivery_address END, " +
                "    o.house_number = COALESCE(o.house_number, 'Flat 203'), " +
                "    o.street = COALESCE(o.street, 'MG Road'), " +
                "    o.area = COALESCE(o.area, 'Malleswaram'), " +
                "    o.city = COALESCE(o.city, 'Bengaluru'), " +
                "    o.state = COALESCE(o.state, 'Karnataka'), " +
                "    o.pincode = COALESCE(o.pincode, '560003'), " +
                "    o.landmark = COALESCE(o.landmark, 'Near XYZ Temple'), " +
                "    o.delivery_partner_id = COALESCE(o.delivery_partner_id, 1) " +
                "WHERE o.customer_name IS NULL OR o.customer_name='Valued Customer' OR o.delivery_address IS NULL OR o.delivery_partner_id IS NULL"
            );

            System.out.println("DATABASE SCHEMA UPDATE AND DATA HEALING COMPLETED SUCCESSFULLY!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void addColumnIfNotExists(Statement st, String table, String column, String definition) {
        try {
            st.executeUpdate("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            System.out.println("Added column " + column + " to table " + table);
        } catch (Exception e) {
            // Already exists
        }
    }
}
