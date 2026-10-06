package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.tap.dao.RestaurantDAO;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Restaurant;
import com.tap.util.DBConnection;
import com.tap.util.FoodAliasDictionary;
import com.tap.util.JsonUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/api/restaurants", "/api/restaurants/cuisines", "/api/restaurants/areas", "/api/search/suggestions"})
public class RestaurantApiController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private RestaurantDAO restaurantDAO;

    @Override
    public void init() throws ServletException {
        restaurantDAO = new RestaurantDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        PrintWriter out = response.getWriter();

        String path = request.getServletPath();

        if ("/api/search/suggestions".equals(path)) {
            handleSearchSuggestions(request, out);
            return;
        }

        if ("/api/restaurants/cuisines".equals(path)) {
            List<String> cuisines = restaurantDAO.getAllCuisines();
            out.write("{\"success\":true,\"cuisines\":" + JsonUtil.stringListToJson(cuisines) + "}");
            return;
        }

        if ("/api/restaurants/areas".equals(path)) {
            List<String> areas = restaurantDAO.getAllAreas();
            out.write("{\"success\":true,\"areas\":" + JsonUtil.stringListToJson(areas) + "}");
            return;
        }

        // /api/restaurants
        try {
            String search = request.getParameter("search");
            if (search == null) search = request.getParameter("q");

            String cuisine = request.getParameter("cuisine");
            String area = request.getParameter("area");

            Double minRating = null;
            String ratingParam = request.getParameter("rating");
            if (ratingParam == null) ratingParam = request.getParameter("minRating");
            if (ratingParam != null && !ratingParam.trim().isEmpty()) {
                try { minRating = Double.parseDouble(ratingParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Boolean vegOnly = null;
            String vegParam = request.getParameter("diet");
            if (vegParam == null) vegParam = request.getParameter("veg");
            if (vegParam == null) vegParam = request.getParameter("vegOnly");
            if (vegParam != null && (vegParam.equalsIgnoreCase("veg") || vegParam.equalsIgnoreCase("true") || vegParam.equals("1"))) {
                vegOnly = true;
            }

            Integer maxDeliveryTime = null;
            String timeParam = request.getParameter("deliveryTime");
            if (timeParam == null) timeParam = request.getParameter("maxDeliveryTime");
            if (timeParam != null && !timeParam.trim().isEmpty()) {
                try { maxDeliveryTime = Integer.parseInt(timeParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Double maxDistance = null;
            String distParam = request.getParameter("distance");
            if (distParam == null) distParam = request.getParameter("maxDistance");
            if (distParam != null && !distParam.trim().isEmpty()) {
                try { maxDistance = Double.parseDouble(distParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Boolean openOnly = null;
            String openParam = request.getParameter("isOpen");
            if (openParam == null) openParam = request.getParameter("openOnly");
            if (openParam != null && (openParam.equalsIgnoreCase("true") || openParam.equals("1"))) {
                openOnly = true;
            }

            String sortBy = request.getParameter("sort");
            if (sortBy == null) sortBy = request.getParameter("sortBy");

            Double userLat = null;
            String latParam = request.getParameter("latitude");
            if (latParam == null) latParam = request.getParameter("lat");
            if (latParam != null && !latParam.trim().isEmpty()) {
                try { userLat = Double.parseDouble(latParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Double userLng = null;
            String lngParam = request.getParameter("longitude");
            if (lngParam == null) lngParam = request.getParameter("lng");
            if (lngParam != null && !lngParam.trim().isEmpty()) {
                try { userLng = Double.parseDouble(lngParam.trim()); } catch (NumberFormatException ignored) {}
            }

            int page = 1;
            String pageParam = request.getParameter("page");
            if (pageParam != null && !pageParam.trim().isEmpty()) {
                try { page = Integer.parseInt(pageParam.trim()); } catch (NumberFormatException ignored) {}
            }

            int size = 12;
            String sizeParam = request.getParameter("size");
            if (sizeParam == null) sizeParam = request.getParameter("limit");
            if (sizeParam != null && !sizeParam.trim().isEmpty()) {
                try { size = Integer.parseInt(sizeParam.trim()); } catch (NumberFormatException ignored) {}
            }

            int total = restaurantDAO.countFilteredRestaurants(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, userLat, userLng);
            List<Restaurant> list = restaurantDAO.getFilteredRestaurants(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, sortBy, userLat, userLng, page, size);

            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"success\":true,");
            json.append("\"total\":").append(total).append(",");
            json.append("\"page\":").append(page).append(",");
            json.append("\"size\":").append(size).append(",");
            json.append("\"totalPages\":").append((int) Math.ceil((double) total / size)).append(",");
            json.append("\"hasMore\":").append((page * size) < total).append(",");
            json.append("\"restaurants\":").append(JsonUtil.restaurantsToJsonList(list));
            json.append("}");

            out.write(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            out.write("{\"success\":false,\"error\":\"" + JsonUtil.escapeJson(e.getMessage()) + "\"}");
        }
    }

    private void handleSearchSuggestions(HttpServletRequest request, PrintWriter out) {
        String rawQuery = request.getParameter("q");
        if (rawQuery == null) rawQuery = request.getParameter("search");
        if (rawQuery == null) rawQuery = "";
        rawQuery = rawQuery.trim();

        String didYouMean = FoodAliasDictionary.getClosestCanonical(rawQuery);
        Set<String> searchTokens = FoodAliasDictionary.getSearchTokensAndAliases(rawQuery);

        List<String> suggestionsJsonList = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        if (!rawQuery.isEmpty()) {
            // 1. Suggest canonical term if matched
            if (didYouMean != null && !didYouMean.equalsIgnoreCase(rawQuery)) {
                String icon = getEmojiForFood(didYouMean);
                suggestionsJsonList.add("{\"text\":\"" + JsonUtil.escapeJson(didYouMean) + "\",\"type\":\"dish\",\"badge\":\"Did you mean\",\"icon\":\"" + icon + "\"}");
                seen.add(didYouMean.toLowerCase());
            }

            // 2. Query distinct matching menu items from DB
            StringBuilder sqlMenu = new StringBuilder("SELECT DISTINCT m.item_name, m.is_veg, m.price FROM menu m WHERE m.is_available=TRUE AND (");
            List<String> tokenList = new ArrayList<>(searchTokens);
            List<Object> menuParams = new ArrayList<>();
            for (int i = 0; i < tokenList.size(); i++) {
                if (i > 0) sqlMenu.append(" OR ");
                sqlMenu.append("m.item_name LIKE ?");
                menuParams.add("%" + tokenList.get(i) + "%");
            }
            sqlMenu.append(") ORDER BY m.is_popular DESC, m.rating DESC LIMIT 6");

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(sqlMenu.toString())) {
                for (int i = 0; i < menuParams.size(); i++) {
                    ps.setObject(i + 1, menuParams.get(i));
                }
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String itemName = rs.getString("item_name");
                        if (itemName != null && !seen.contains(itemName.toLowerCase())) {
                            seen.add(itemName.toLowerCase());
                            boolean isVeg = rs.getBoolean("is_veg");
                            double price = rs.getDouble("price");
                            String icon = isVeg ? "🟢" : "🍗";
                            if (itemName.toLowerCase().contains("biryani")) icon = "🍛";
                            else if (itemName.toLowerCase().contains("dosa")) icon = "🥞";
                            else if (itemName.toLowerCase().contains("pizza")) icon = "🍕";
                            else if (itemName.toLowerCase().contains("burger")) icon = "🍔";
                            else if (itemName.toLowerCase().contains("coffee")) icon = "☕";
                            suggestionsJsonList.add("{\"text\":\"" + JsonUtil.escapeJson(itemName) + "\",\"type\":\"dish\",\"badge\":\"₹" + Math.round(price) + "\",\"icon\":\"" + icon + "\"}");
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            // 3. Query distinct matching restaurants from DB
            StringBuilder sqlRest = new StringBuilder("SELECT r.restaurant_id, r.name, r.area FROM restaurant r WHERE r.is_active=TRUE AND (");
            List<Object> restParams = new ArrayList<>();
            for (int i = 0; i < tokenList.size(); i++) {
                if (i > 0) sqlRest.append(" OR ");
                sqlRest.append("r.name LIKE ? OR r.cuisine_type LIKE ?");
                restParams.add("%" + tokenList.get(i) + "%");
                restParams.add("%" + tokenList.get(i) + "%");
            }
            sqlRest.append(") LIMIT 3");

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(sqlRest.toString())) {
                for (int i = 0; i < restParams.size(); i++) {
                    ps.setObject(i + 1, restParams.get(i));
                }
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        String rName = rs.getString("name");
                        String area = rs.getString("area");
                        int rId = rs.getInt("restaurant_id");
                        if (rName != null && !seen.contains(rName.toLowerCase())) {
                            seen.add(rName.toLowerCase());
                            String locText = (area != null && !area.isEmpty()) ? area : "Bengaluru";
                            suggestionsJsonList.add("{\"text\":\"" + JsonUtil.escapeJson(rName) + "\",\"type\":\"restaurant\",\"badge\":\"" + JsonUtil.escapeJson(locText) + "\",\"icon\":\"🍽️\",\"restaurantId\":" + rId + "}");
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Build suggestions JSON response
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"success\":true,");
        json.append("\"query\":\"").append(JsonUtil.escapeJson(rawQuery)).append("\",");
        if (didYouMean != null) {
            json.append("\"didYouMean\":\"").append(JsonUtil.escapeJson(didYouMean)).append("\",");
        } else {
            json.append("\"didYouMean\":null,");
        }
        json.append("\"suggestions\":[");
        for (int i = 0; i < suggestionsJsonList.size(); i++) {
            if (i > 0) json.append(",");
            json.append(suggestionsJsonList.get(i));
        }
        json.append("],");
        json.append("\"popular\":").append(JsonUtil.stringListToJson(FoodAliasDictionary.getPopularSearches()));
        json.append("}");

        out.write(json.toString());
    }

    private String getEmojiForFood(String food) {
        if (food == null) return "🍲";
        String lower = food.toLowerCase();
        if (lower.contains("biryani")) return "🍛";
        if (lower.contains("chicken") || lower.contains("kebab") || lower.contains("tikka")) return "🍗";
        if (lower.contains("dosa") || lower.contains("idli") || lower.contains("vada")) return "🥞";
        if (lower.contains("pizza")) return "🍕";
        if (lower.contains("burger")) return "🍔";
        if (lower.contains("coffee") || lower.contains("tea") || lower.contains("chai")) return "☕";
        if (lower.contains("paneer")) return "🧀";
        if (lower.contains("shawarma") || lower.contains("roll")) return "🌯";
        if (lower.contains("momo") || lower.contains("dimsum")) return "🥟";
        if (lower.contains("ice cream") || lower.contains("falooda")) return "🍨";
        return "🍲";
    }
}
