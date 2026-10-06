package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import com.tap.daoimpl.DeliveryPartnerDAOImpl;
import com.tap.daoimpl.OrderDAOImpl;
import com.tap.daoimpl.OrderStatusHistoryDAOImpl;
import com.tap.model.DeliveryPartner;
import com.tap.model.Order;
import com.tap.model.OrderStatusHistory;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/delivery/dashboard", "/delivery/accept", "/delivery/status", "/delivery/location", "/delivery/toggle-status"})
public class DeliveryController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    private final DeliveryPartnerDAOImpl partnerDAO = new DeliveryPartnerDAOImpl();
    private final OrderDAOImpl orderDAO = new OrderDAOImpl();
    private final OrderStatusHistoryDAOImpl historyDAO = new OrderStatusHistoryDAOImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String path = request.getServletPath();

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login.jsp?redirect=" + path);
            return;
        }

        if (!user.isDeliveryPartner() && !user.isAdmin()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied. Delivery Partner portal only.");
            return;
        }

        DeliveryPartner partner = partnerDAO.getPartnerByUserId(user.getUserId());
        if (partner == null) {
            partner = new DeliveryPartner(0, user.getUserId(), user.getUsername(), 
                user.getPhone() != null ? user.getPhone() : "9876543220", 
                "KA-05-EJ-1234", 12.9416, 77.5750, 10.0, true, null);
            partnerDAO.createPartner(partner);
            partner = partnerDAO.getPartnerByUserId(user.getUserId());
        }

        if ("/delivery/dashboard".equals(path)) {
            List<Order> assignedOrders = orderDAO.getAssignedOrdersForDelivery(partner.getPartnerId());
            List<Order> availableOrders = orderDAO.getAvailableOrdersForDelivery();

            request.setAttribute("partner", partner);
            request.setAttribute("assignedOrders", assignedOrders);
            request.setAttribute("availableOrders", availableOrders);

            request.getRequestDispatcher("/deliveryDashboard.jsp").forward(request, response);
        } else {
            response.sendRedirect(request.getContextPath() + "/delivery/dashboard");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String path = request.getServletPath();

        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Please log in");
            return;
        }

        if (!user.isDeliveryPartner() && !user.isAdmin()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
            return;
        }

        DeliveryPartner partner = partnerDAO.getPartnerByUserId(user.getUserId());
        if (partner == null) {
            partner = new DeliveryPartner(0, user.getUserId(), user.getUsername(), 
                user.getPhone() != null ? user.getPhone() : "9876543220", 
                "KA-05-EJ-1234", 12.9416, 77.5750, 10.0, true, null);
            partnerDAO.createPartner(partner);
            partner = partnerDAO.getPartnerByUserId(user.getUserId());
        }

        if ("/delivery/accept".equals(path)) {
            try {
                int orderId = Integer.parseInt(request.getParameter("orderId"));
                boolean assigned = orderDAO.assignDeliveryPartner(orderId, partner.getPartnerId());
                if (assigned) {
                    session.setAttribute("successMessage", "Order #" + orderId + " accepted! Head to the restaurant for pickup.");
                } else {
                    session.setAttribute("errorMessage", "Order #" + orderId + " is no longer available.");
                }
            } catch (Exception e) {
                session.setAttribute("errorMessage", "Failed to accept order: " + e.getMessage());
            }
            response.sendRedirect(request.getContextPath() + "/delivery/dashboard");

        } else if ("/delivery/status".equals(path)) {
            try {
                int orderId = Integer.parseInt(request.getParameter("orderId"));
                String newStatus = request.getParameter("status"); // PICKED_UP, OUT_FOR_DELIVERY, DELIVERED
                String remarks = request.getParameter("remarks");
                if (remarks == null || remarks.isBlank()) {
                    remarks = "Status updated to " + newStatus + " by partner " + partner.getName();
                }

                boolean updated = orderDAO.updateOrderStatus(orderId, newStatus, partner.getName(), remarks);
                if (updated && "DELIVERED".equalsIgnoreCase(newStatus)) {
                    Order ord = orderDAO.getOrder(orderId);
                    if (ord != null && "Cash on Delivery".equalsIgnoreCase(ord.getPaymentMode())) {
                        orderDAO.updatePaymentStatus(orderId, "COMPLETED");
                    }
                    partnerDAO.setAvailability(partner.getPartnerId(), true);
                    session.setAttribute("successMessage", "Order #" + orderId + " marked as DELIVERED! Great job.");
                } else if (updated) {
                    session.setAttribute("successMessage", "Order #" + orderId + " updated to " + newStatus);
                }
            } catch (Exception e) {
                session.setAttribute("errorMessage", "Failed to update status: " + e.getMessage());
            }
            response.sendRedirect(request.getContextPath() + "/delivery/dashboard");

        } else if ("/delivery/location".equals(path)) {
            // Live GPS watchPosition report
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            PrintWriter out = response.getWriter();
            try {
                double lat = Double.parseDouble(request.getParameter("latitude"));
                double lng = Double.parseDouble(request.getParameter("longitude"));
                double acc = 10.0;
                String accStr = request.getParameter("accuracy");
                if (accStr != null && !accStr.isBlank()) {
                    acc = Double.parseDouble(accStr);
                }

                boolean updated = partnerDAO.updateLocation(partner.getPartnerId(), lat, lng, acc);
                out.print("{\"success\":" + updated + ",\"partnerId\":" + partner.getPartnerId() + ",\"lat\":" + lat + ",\"lng\":" + lng + "}");
            } catch (Exception e) {
                out.print("{\"success\":false,\"error\":\"" + e.getMessage().replace("\"", "\\\"") + "\"}");
            }
            out.flush();

        } else if ("/delivery/toggle-status".equals(path)) {
            boolean current = partner.isAvailable();
            partnerDAO.setAvailability(partner.getPartnerId(), !current);
            session.setAttribute("successMessage", "Availability status toggled to " + (!current ? "ONLINE" : "OFFLINE"));
            response.sendRedirect(request.getContextPath() + "/delivery/dashboard");
        }
    }
}
