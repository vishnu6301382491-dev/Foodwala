package com.tap.controller;

import java.io.IOException;
import java.util.List;

import com.tap.daoimpl.DeliveryPartnerDAOImpl;
import com.tap.daoimpl.OrderDAOImpl;
import com.tap.daoimpl.OrderItemDAOImpl;
import com.tap.daoimpl.OrderStatusHistoryDAOImpl;
import com.tap.daoimpl.PaymentDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.DeliveryPartner;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.OrderStatusHistory;
import com.tap.model.Payment;
import com.tap.model.Restaurant;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/order-details", "/order-track", "/order-status"})
public class OrderTrackingController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private final OrderDAOImpl orderDAO = new OrderDAOImpl();
    private final OrderItemDAOImpl orderItemDAO = new OrderItemDAOImpl();
    private final RestaurantDAOImpl restaurantDAO = new RestaurantDAOImpl();
    private final DeliveryPartnerDAOImpl partnerDAO = new DeliveryPartnerDAOImpl();
    private final OrderStatusHistoryDAOImpl historyDAO = new OrderStatusHistoryDAOImpl();
    private final PaymentDAOImpl paymentDAO = new PaymentDAOImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String path = request.getServletPath();
        String orderIdStr = request.getParameter("orderId");
        int orderId = 0;

        if (orderIdStr != null && !orderIdStr.trim().isEmpty()) {
            try {
                orderId = Integer.parseInt(orderIdStr.trim());
            } catch (Exception e) {
                orderId = -1;
            }
        }

        if (orderId == 0) {
            // Check if there is a last order ID in session
            HttpSession session = request.getSession();
            Integer lastId = (Integer) session.getAttribute("lastOrderId");
            if (lastId != null && lastId > 0) {
                orderId = lastId;
            }
        }

        // Check if orderId is invalid or zero
        if (orderId <= 0) {
            request.setAttribute("errorTitle", "Order Not Found");
            request.setAttribute("errorMessage", "Order #" + (orderIdStr != null && !orderIdStr.isBlank() ? orderIdStr : "0") + " does not exist. Please verify your order number or check your order history.");
            request.getRequestDispatcher("/orderDetails.jsp").forward(request, response);
            return;
        }

        Order order = orderDAO.getOrder(orderId);
        if (order == null) {
            request.setAttribute("errorTitle", "Order Not Found");
            request.setAttribute("errorMessage", "We couldn't find any details for Order #" + orderId + ". It might have been deleted or the order number is incorrect.");
            request.getRequestDispatcher("/orderDetails.jsp").forward(request, response);
            return;
        }

        HttpSession session = request.getSession();
        User loggedInUser = (User) session.getAttribute("loggedInUser");

        // Authorization check: Customer can only view own order unless ADMIN, RESTAURANT admin or assigned partner
        if (loggedInUser == null) {
            Integer lastOrderId = (Integer) session.getAttribute("lastOrderId");
            if (lastOrderId == null || lastOrderId != orderId) {
                request.setAttribute("errorTitle", "Access Denied");
                request.setAttribute("errorMessage", "You do not have permission to view Order #" + orderId + ". Please log in with your registered account.");
                request.getRequestDispatcher("/orderDetails.jsp").forward(request, response);
                return;
            }
        } else if (!loggedInUser.isAdmin()) {
            boolean isOwner = order.getUserId() == loggedInUser.getUserId();
            boolean isPartner = order.getDeliveryPartnerId() != null && 
                                partnerDAO.getPartnerByUserId(loggedInUser.getUserId()) != null &&
                                partnerDAO.getPartnerByUserId(loggedInUser.getUserId()).getPartnerId() == order.getDeliveryPartnerId();
            Restaurant rest = restaurantDAO.getRestaurantById(order.getRestaurantId());
            boolean isRestAdmin = rest != null && rest.getAdminUserId() == loggedInUser.getUserId();

            if (!isOwner && !isPartner && !isRestAdmin) {
                request.setAttribute("errorTitle", "Access Denied");
                request.setAttribute("errorMessage", "Access Denied: You do not have permission to view Order #" + orderId + ".");
                request.getRequestDispatcher("/orderDetails.jsp").forward(request, response);
                return;
            }
        }

        // Real-time status API for live polling
        if ("/order-status".equalsIgnoreCase(path)) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            DeliveryPartner partner = null;
            if (order.getDeliveryPartnerId() != null) {
                partner = partnerDAO.getPartnerById(order.getDeliveryPartnerId());
            }

            double partnerLat = partner != null ? partner.getCurrentLat() : (order.getDeliveryLat() != null ? order.getDeliveryLat() : 12.9416);
            double partnerLng = partner != null ? partner.getCurrentLng() : (order.getDeliveryLng() != null ? order.getDeliveryLng() : 77.5750);
            String partnerName = partner != null ? partner.getName() : "Assigning Partner...";
            String vehicle = partner != null ? partner.getVehicleNumber() : "";
            String partnerPhone = partner != null ? partner.getPhone() : "";

            String json = String.format(java.util.Locale.US,
                "{\"orderId\":%d,\"status\":\"%s\",\"paymentStatus\":\"%s\",\"estimatedTime\":\"%s\"," +
                "\"partner\":{\"id\":%s,\"name\":\"%s\",\"phone\":\"%s\",\"vehicle\":\"%s\",\"lat\":%.6f,\"lng\":%.6f}}",
                order.getOrderId(), order.getStatus(), order.getPaymentStatus(), order.getEstimatedDeliveryTime(),
                (order.getDeliveryPartnerId() != null ? order.getDeliveryPartnerId().toString() : "null"),
                escapeJson(partnerName), escapeJson(partnerPhone), escapeJson(vehicle), partnerLat, partnerLng
            );
            response.getWriter().write(json);
            return;
        }

        Restaurant restaurant = restaurantDAO.getRestaurantById(order.getRestaurantId());
        List<OrderItem> items = orderItemDAO.getOrderItemsByOrderId(orderId);
        List<OrderStatusHistory> history = historyDAO.getHistoryByOrderId(orderId);
        Payment payment = paymentDAO.getPaymentByOrderId(orderId);

        DeliveryPartner partner = null;
        if (order.getDeliveryPartnerId() != null) {
            partner = partnerDAO.getPartnerById(order.getDeliveryPartnerId());
        }

        request.setAttribute("order", order);
        request.setAttribute("restaurant", restaurant);
        request.setAttribute("orderItems", items);
        request.setAttribute("history", history);
        request.setAttribute("partner", partner);
        request.setAttribute("payment", payment);

        if ("/order-track".equalsIgnoreCase(path)) {
            request.getRequestDispatcher("/orderTrack.jsp").forward(request, response);
        } else {
            request.getRequestDispatcher("/orderDetails.jsp").forward(request, response);
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
