package com.tap.util;

import java.util.List;
import com.tap.model.Menu;
import com.tap.model.MenuCategory;
import com.tap.model.Restaurant;

public class JsonUtil {

    public static String escapeJson(String str) {
        if (str == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < str.length(); i++) {
            char ch = str.charAt(i);
            switch (ch) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch < ' ') {
                        String t = "000" + Integer.toHexString(ch);
                        sb.append("\\u").append(t.substring(t.length() - 4));
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
    }

    public static String restaurantToJson(Restaurant r) {
        if (r == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"restaurantId\":").append(r.getRestaurantId()).append(",");
        sb.append("\"name\":\"").append(escapeJson(r.getName())).append("\",");
        sb.append("\"cuisineType\":\"").append(escapeJson(r.getCuisineType())).append("\",");
        sb.append("\"deliveryTime\":").append(r.getDeliveryTime()).append(",");
        sb.append("\"address\":\"").append(escapeJson(r.getAddress())).append("\",");
        sb.append("\"adminUserId\":").append(r.getAdminUserId()).append(",");
        sb.append("\"rating\":").append(r.getRating()).append(",");
        sb.append("\"isActive\":").append(r.isActive()).append(",");
        sb.append("\"imagePath\":\"").append(escapeJson(r.getImagePath())).append("\",");
        sb.append("\"latitude\":").append(r.getLatitude()).append(",");
        sb.append("\"longitude\":").append(r.getLongitude()).append(",");
        sb.append("\"city\":\"").append(escapeJson(r.getCity())).append("\",");
        sb.append("\"state\":\"").append(escapeJson(r.getState())).append("\",");
        sb.append("\"pincode\":\"").append(escapeJson(r.getPincode())).append("\",");
        sb.append("\"phone\":\"").append(escapeJson(r.getPhone())).append("\",");
        sb.append("\"description\":\"").append(escapeJson(r.getDescription())).append("\",");
        sb.append("\"area\":\"").append(escapeJson(r.getArea())).append("\",");
        sb.append("\"reviewCount\":").append(r.getReviewCount()).append(",");
        sb.append("\"deliveryFee\":").append(r.getDeliveryFee()).append(",");
        sb.append("\"minimumOrder\":").append(r.getMinimumOrder()).append(",");
        sb.append("\"isOpen\":").append(r.isOpen()).append(",");
        sb.append("\"openingTime\":\"").append(escapeJson(r.getOpeningTime())).append("\",");
        sb.append("\"closingTime\":\"").append(escapeJson(r.getClosingTime())).append("\",");
        sb.append("\"isPopular\":").append(r.isPopular()).append(",");
        sb.append("\"distanceKm\":").append(Math.round(r.getDistanceKm() * 10.0) / 10.0);
        if (r.getMatchedMenuItems() != null && !r.getMatchedMenuItems().isEmpty()) {
            sb.append(",\"matchedMenuItems\":[");
            for (int i = 0; i < r.getMatchedMenuItems().size(); i++) {
                if (i > 0) sb.append(",");
                Menu m = r.getMatchedMenuItems().get(i);
                sb.append("{");
                sb.append("\"menuId\":").append(m.getMenuId()).append(",");
                sb.append("\"itemName\":\"").append(escapeJson(m.getItemName())).append("\",");
                sb.append("\"price\":").append(m.getPrice()).append(",");
                sb.append("\"isVeg\":").append(m.isVeg()).append(",");
                sb.append("\"categoryName\":\"").append(escapeJson(m.getCategoryName())).append("\"");
                sb.append("}");
            }
            sb.append("]");
        } else {
            sb.append(",\"matchedMenuItems\":[]");
        }
        sb.append("}");
        return sb.toString();
    }

    public static String restaurantsToJsonList(List<Restaurant> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(restaurantToJson(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String menuToJson(Menu m) {
        if (m == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"menuId\":").append(m.getMenuId()).append(",");
        sb.append("\"restaurantId\":").append(m.getRestaurantId()).append(",");
        sb.append("\"categoryId\":").append(m.getCategoryId()).append(",");
        sb.append("\"categoryName\":\"").append(escapeJson(m.getCategoryName())).append("\",");
        sb.append("\"itemName\":\"").append(escapeJson(m.getItemName())).append("\",");
        sb.append("\"description\":\"").append(escapeJson(m.getDescription())).append("\",");
        sb.append("\"price\":").append(m.getPrice()).append(",");
        sb.append("\"rating\":").append(m.getRating()).append(",");
        sb.append("\"isAvailable\":").append(m.isAvailable()).append(",");
        sb.append("\"imagePath\":\"").append(escapeJson(m.getImagePath())).append("\",");
        sb.append("\"isVeg\":").append(m.isVeg()).append(",");
        sb.append("\"isPopular\":").append(m.isPopular()).append(",");
        sb.append("\"preparationTime\":\"").append(escapeJson(m.getPreparationTime())).append("\"");
        sb.append("}");
        return sb.toString();
    }

    public static String categoryWithItemsToJson(MenuCategory cat, List<Menu> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"categoryId\":").append(cat.getCategoryId()).append(",");
        sb.append("\"restaurantId\":").append(cat.getRestaurantId()).append(",");
        sb.append("\"name\":\"").append(escapeJson(cat.getName())).append("\",");
        sb.append("\"description\":\"").append(escapeJson(cat.getDescription())).append("\",");
        sb.append("\"displayOrder\":").append(cat.getDisplayOrder()).append(",");
        sb.append("\"items\":").append(menusToJsonList(items));
        sb.append("}");
        return sb.toString();
    }

    public static String menusToJsonList(List<Menu> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(menuToJson(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    public static String stringListToJson(List<String> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(list.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
}
