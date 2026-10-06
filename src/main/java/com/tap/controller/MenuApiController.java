package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.tap.dao.MenuDAO;
import com.tap.dao.RestaurantDAO;
import com.tap.daoimpl.MenuDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Menu;
import com.tap.model.MenuCategory;
import com.tap.model.Restaurant;
import com.tap.util.JsonUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/api/menu", "/api/restaurants/menu"})
public class MenuApiController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private MenuDAO menuDAO;
    private RestaurantDAO restaurantDAO;

    @Override
    public void init() throws ServletException {
        menuDAO = new MenuDAOImpl();
        restaurantDAO = new RestaurantDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        PrintWriter out = response.getWriter();

        try {
            String rIdParam = request.getParameter("restaurantId");
            if (rIdParam == null) rIdParam = request.getParameter("restaurant_id");

            if (rIdParam == null || rIdParam.trim().isEmpty()) {
                out.write("{\"success\":false,\"error\":\"restaurantId parameter is required\"}");
                return;
            }

            int restaurantId = Integer.parseInt(rIdParam.trim());
            Restaurant restaurant = restaurantDAO.getRestaurantById(restaurantId);
            if (restaurant == null) {
                out.write("{\"success\":false,\"error\":\"Restaurant not found\"}");
                return;
            }

            List<MenuCategory> categories = menuDAO.getCategoriesByRestaurantId(restaurantId);
            List<Menu> allItems = menuDAO.getMenuByRestaurantId(restaurantId);

            // Group items by categoryId
            Map<Integer, List<Menu>> itemsByCategory = new HashMap<>();
            for (Menu item : allItems) {
                itemsByCategory.computeIfAbsent(item.getCategoryId(), k -> new ArrayList<>()).add(item);
            }

            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"success\":true,");
            json.append("\"restaurant\":").append(JsonUtil.restaurantToJson(restaurant)).append(",");
            json.append("\"categories\":[");

            if (categories.isEmpty() && !allItems.isEmpty()) {
                // If no categories in table, wrap in a default category
                json.append("{");
                json.append("\"categoryId\":0,");
                json.append("\"restaurantId\":").append(restaurantId).append(",");
                json.append("\"name\":\"Recommended\",");
                json.append("\"description\":\"Top picks and house specials\",");
                json.append("\"displayOrder\":1,");
                json.append("\"items\":").append(JsonUtil.menusToJsonList(allItems));
                json.append("}");
            } else {
                for (int i = 0; i < categories.size(); i++) {
                    if (i > 0) json.append(",");
                    MenuCategory cat = categories.get(i);
                    List<Menu> catItems = itemsByCategory.getOrDefault(cat.getCategoryId(), new ArrayList<>());
                    json.append(JsonUtil.categoryWithItemsToJson(cat, catItems));
                }
            }

            json.append("],");
            json.append("\"allItems\":").append(JsonUtil.menusToJsonList(allItems));
            json.append("}");

            out.write(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            out.write("{\"success\":false,\"error\":\"" + JsonUtil.escapeJson(e.getMessage()) + "\"}");
        }
    }
}
