package com.tap.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.tap.daoimpl.OrderDAOImpl;
import com.tap.daoimpl.OrderItemDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.Restaurant;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/restaurant/dashboard", "/restaurant/order-status"})
public class RestaurantDashboardController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private final RestaurantDAOImpl restaurantDAO = new RestaurantDAOImpl();
    private final OrderDAOImpl orderDAO = new OrderDAOImpl();
    private final OrderItemDAOImpl orderItemDAO = new OrderItemDAOImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login?role=restaurant");
            return;
        }

        if (!user.isRestaurant() && !user.isAdmin()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access restricted to Restaurant Staff.");
            return;
        }

        Restaurant restaurant = restaurantDAO.getRestaurantByAdminUserId(user.getUserId());
        if (restaurant == null) {
            // Default to restaurant 2 (Vidyarthi Bhavan) for restaurant staff demo
            restaurant = restaurantDAO.getRestaurantById(2);
        }

        List<Order> orders = orderDAO.getOrdersByRestaurantId(restaurant.getRestaurantId());
        Map<Integer, List<OrderItem>> orderItemsMap = new HashMap<>();
        for (Order o : orders) {
            orderItemsMap.put(o.getOrderId(), orderItemDAO.getOrderItemsByOrderId(o.getOrderId()));
        }

        request.setAttribute("restaurant", restaurant);
        request.setAttribute("orders", orders);
        request.setAttribute("orderItemsMap", orderItemsMap);
        request.getRequestDispatcher("/restaurantDashboard.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null || (!user.isRestaurant() && !user.isAdmin())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Unauthorized action.");
            return;
        }

        try {
            int orderId = Integer.parseInt(request.getParameter("orderId"));
            String newStatus = request.getParameter("status"); // CONFIRMED, PREPARING, READY_FOR_PICKUP, CANCELLED
            String remarks = request.getParameter("remarks");

            if (newStatus != null && !newStatus.isBlank()) {
                orderDAO.updateOrderStatus(orderId, newStatus, user.getUsername(), 
                                           remarks != null ? remarks : ("Status updated to " + newStatus));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        response.sendRedirect(request.getContextPath() + "/restaurant/dashboard");
    }
}
