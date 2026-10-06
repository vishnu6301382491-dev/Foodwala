package com.tap.test;

import java.io.FileWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.tap.util.DBConnection;

public class ExportStaticData {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection();
             Statement st = con.createStatement()) {

            // 1. Export Restaurants
            ResultSet rs = st.executeQuery("SELECT * FROM restaurant WHERE is_active=TRUE ORDER BY rating DESC");
            StringBuilder restJson = new StringBuilder("[");
            boolean first = true;
            int rCount = 0;
            while (rs.next()) {
                if (!first) restJson.append(",");
                first = false;
                rCount++;
                restJson.append("{")
                    .append(""restaurantId":").append(rs.getInt("restaurant_id")).append(",")
                    .append(""name":"").append(escapeJson(rs.getString("name"))).append("",")
                    .append(""cuisineType":"").append(escapeJson(rs.getString("cuisine_type"))).append("",")
                    .append(""deliveryTime":").append(rs.getInt("delivery_time")).append(",")
                    .append(""address":"").append(escapeJson(rs.getString("address"))).append("",")
                    .append(""area":"").append(escapeJson(rs.getString("area"))).append("",")
                    .append(""rating":").append(rs.getDouble("rating")).append(",")
                    .append(""reviewCount":").append(rs.getInt("review_count")).append(",")
                    .append(""isActive":").append(rs.getBoolean("is_active")).append(",")
                    .append(""isOpen":").append(rs.getBoolean("is_open")).append(",")
                    .append(""imagePath":"").append(escapeJson(rs.getString("image_path"))).append("",")
                    .append(""latitude":").append(rs.getDouble("latitude")).append(",")
                    .append(""longitude":").append(rs.getDouble("longitude")).append(",")
                    .append(""deliveryFee":").append(rs.getDouble("delivery_fee")).append(",")
                    .append(""minimumOrder":").append(rs.getDouble("minimum_order")).append(",")
                    .append(""description":"").append(escapeJson(rs.getString("description"))).append("",")
                    .append(""openingTime":"").append(escapeJson(rs.getString("opening_time"))).append("",")
                    .append(""closingTime":"").append(escapeJson(rs.getString("closing_time"))).append(""")
                    .append("}");
            }
            restJson.append("]");
            rs.close();

            // 2. Export Menu Items
            rs = st.executeQuery("SELECT m.*, c.name as cat_name FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id WHERE m.is_available=TRUE ORDER BY m.restaurant_id, m.category_name, m.price");
            StringBuilder menuJson = new StringBuilder("[");
            first = true;
            int mCount = 0;
            while (rs.next()) {
                if (!first) menuJson.append(",");
                first = false;
                mCount++;
                String cat = rs.getString("category_name");
                if (cat == null || cat.isEmpty()) cat = rs.getString("cat_name");
                if (cat == null || cat.isEmpty()) cat = "Main Course";

                menuJson.append("{")
                    .append(""menuId":").append(rs.getInt("menu_id")).append(",")
                    .append(""restaurantId":").append(rs.getInt("restaurant_id")).append(",")
                    .append(""itemName":"").append(escapeJson(rs.getString("item_name"))).append("",")
                    .append(""description":"").append(escapeJson(rs.getString("description"))).append("",")
                    .append(""price":").append(rs.getDouble("price")).append(",")
                    .append(""isAvailable":").append(rs.getBoolean("is_available")).append(",")
                    .append(""imagePath":"").append(escapeJson(rs.getString("image_path"))).append("",")
                    .append(""isVeg":").append(rs.getBoolean("is_veg")).append(",")
                    .append(""isPopular":").append(rs.getBoolean("is_popular")).append(",")
                    .append(""categoryName":"").append(escapeJson(cat)).append("",")
                    .append(""rating":").append(rs.getDouble("rating"))
                    .append("}");
            }
            menuJson.append("]");
            rs.close();

            // 3. Write JS data file
            StringBuilder js = new StringBuilder();
            js.append("// FoodWala Static Dataset (105+ Bengaluru Restaurants, 750+ Menu Items)\n");
            js.append("window.FOODWALA_RESTAURANTS = ").append(restJson).append(";\n\n");
            js.append("window.FOODWALA_MENUS = ").append(menuJson).append(";\n");

            java.io.File dir = new java.io.File("D:/FoodWala_Eclipse_Project/js");
            dir.mkdirs();
            try (FileWriter fw = new FileWriter("D:/FoodWala_Eclipse_Project/js/foodwala-data.js")) {
                fw.write(js.toString());
            }

            System.out.println("SUCCESS: Exported " + rCount + " restaurants and " + mCount + " menu items to js/foodwala-data.js");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
