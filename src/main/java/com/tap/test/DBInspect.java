package com.tap.test;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class DBInspect {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/fudwala?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        try (Connection con = DriverManager.getConnection(url, "root", "root")) {
            DatabaseMetaData meta = con.getMetaData();
            System.out.println("=== TABLES AND COLUMNS IN fudwala ===");
            try (ResultSet rs = meta.getTables("fudwala", null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String table = rs.getString("TABLE_NAME");
                    System.out.println("\nTable: " + table);
                    try (ResultSet cols = meta.getColumns("fudwala", null, table, "%")) {
                        while (cols.next()) {
                            System.out.println("   " + cols.getString("COLUMN_NAME") + " (" + cols.getString("TYPE_NAME") + ")");
                        }
                    }
                }
            }

            System.out.println("\n=== ORDER 6 SPECIFICALLY ===");
            try (Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery("SELECT * FROM orders WHERE order_id = 6")) {
                ResultSetMetaData rsmd = rs.getMetaData();
                int colCount = rsmd.getColumnCount();
                if (rs.next()) {
                    for (int i = 1; i <= colCount; i++) {
                        System.out.println("   " + rsmd.getColumnName(i) + " = " + rs.getString(i));
                    }
                } else {
                    System.out.println("Order 6 does not exist!");
                }
            }

            System.out.println("\n=== ORDER 6 ITEMS ===");
            try (Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery("SELECT * FROM order_item WHERE order_id = 6")) {
                ResultSetMetaData rsmd = rs.getMetaData();
                int colCount = rsmd.getColumnCount();
                while (rs.next()) {
                    System.out.println("OrderItem:");
                    for (int i = 1; i <= colCount; i++) {
                        System.out.println("   " + rsmd.getColumnName(i) + " = " + rs.getString(i));
                    }
                }
            }

            System.out.println("\n=== SAMPLE DELIVERY PARTNERS ===");
            try (Statement st = con.createStatement();
                 ResultSet rs = st.executeQuery("SELECT * FROM delivery_partner")) {
                ResultSetMetaData rsmd = rs.getMetaData();
                int colCount = rsmd.getColumnCount();
                while (rs.next()) {
                    System.out.println("DeliveryPartner:");
                    for (int i = 1; i <= colCount; i++) {
                        System.out.println("   " + rsmd.getColumnName(i) + " = " + rs.getString(i));
                    }
                }
            }
        }
    }
}
