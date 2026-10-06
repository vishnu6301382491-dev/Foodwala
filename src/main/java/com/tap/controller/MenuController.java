package com.tap.controller;

import java.io.IOException;
import java.util.List;
import com.tap.daoimpl.MenuDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Menu;
import com.tap.model.MenuCategory;
import com.tap.model.Restaurant;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/menu")
public class MenuController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private MenuDAOImpl menuDAO;
    private RestaurantDAOImpl restaurantDAO;

    @Override
    public void init() {
        menuDAO = new MenuDAOImpl();
        restaurantDAO = new RestaurantDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        String value = request.getParameter("restaurantId");
        if (value == null) value = request.getParameter("restaurant_id");

        try {
            int restaurantId = Integer.parseInt(value);
            List<Menu> menuList = menuDAO.getMenuByRestaurantId(restaurantId);
            List<MenuCategory> categories = menuDAO.getCategoriesByRestaurantId(restaurantId);
            Restaurant restaurant = restaurantDAO.getRestaurantById(restaurantId);

            request.setAttribute("restaurantId", restaurantId);
            request.setAttribute("restaurant", restaurant);
            request.setAttribute("categories", categories);
            request.setAttribute("menuList", menuList);
            request.getRequestDispatcher("/menu.jsp").forward(request, response);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid restaurant ID");
        }
    }
}
