package com.tap.service;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Types;

import com.tap.daoimpl.DeliveryPartnerDAOImpl;
import com.tap.daoimpl.OrderStatusHistoryDAOImpl;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import com.tap.model.DeliveryPartner;
import com.tap.model.OrderStatusHistory;
import com.tap.util.DBConnection;

public class OrderService {

    private final DeliveryPartnerDAOImpl partnerDAO = new DeliveryPartnerDAOImpl();

    public int placeOrder(int userId, Cart cart, String paymentMode) throws Exception {
        com.tap.daoimpl.UserDAOImpl uDao = new com.tap.daoimpl.UserDAOImpl();
        com.tap.model.User u = uDao.getUser(userId);
        String name = (u != null && u.getUsername() != null) ? u.getUsername() : "";
        String phone = (u != null && u.getPhone() != null) ? u.getPhone() : "";
        String email = (u != null && u.getEmail() != null) ? u.getEmail() : "";
        String addr = (u != null && u.getAddress() != null) ? u.getAddress() : "";
        return placeOrder(userId, cart, name, phone, email, 
                          "", "", "", "", "", "", 
                          "", "", addr, 
                          null, null, paymentMode, 
                          paymentMode != null && paymentMode.equalsIgnoreCase("Cash on Delivery") ? "PENDING" : "SUCCESS",
                          40.0, cart.getTotalAmount() * 0.05, 0.0, "30-40 mins");
    }

    public int placeOrder(int userId, Cart cart, String customerName, String customerPhone,
                          String deliveryAddress, Double deliveryLat, Double deliveryLng,
                          String paymentMode, String paymentStatus,
                          double deliveryFee, double taxes, double discount, String estimatedDeliveryTime) throws Exception {

        return placeOrder(
            userId, cart, customerName, customerPhone, "",
            "", "", "", "", "", "", "", "",
            deliveryAddress, deliveryLat, deliveryLng, paymentMode, paymentStatus,
            deliveryFee, taxes, discount, estimatedDeliveryTime
        );
    }

    /**
     * Complete Order Creation with Full Delivery Snapshot & Automatic Partner Assignment.
     */
    public int placeOrder(int userId, Cart cart, String customerName, String customerPhone, String customerEmail,
                          String houseNumber, String street, String area, String city, String state, String pincode,
                          String landmark, String deliveryInstructions,
                          String deliveryAddress, Double deliveryLat, Double deliveryLng,
                          String paymentMode, String paymentStatus,
                          double deliveryFee, double taxes, double discount, String estimatedDeliveryTime) throws Exception {

        if (cart == null || cart.isEmpty()) {
            throw new IllegalArgumentException("Cart cannot be empty");
        }

        int restaurantId = 1;
        for (CartItem item : cart.getCartItems()) {
            if (item != null && item.getRestaurantId() > 0) {
                restaurantId = item.getRestaurantId();
                break;
            }
        }

        // Automatic delivery partner assignment
        DeliveryPartner assignedPartner = partnerDAO.getFirstAvailableOrDemoPartner();
        Integer partnerId = (assignedPartner != null) ? assignedPartner.getPartnerId() : 1;

        double itemTotal = cart.getTotalAmount();
        double finalAmount = (itemTotal + deliveryFee + taxes) - discount;
        int orderId = 0;

        String orderSql = 
            "INSERT INTO orders (user_id, restaurant_id, customer_name, customer_phone, customer_email, " +
            "delivery_address, house_number, street, area, city, state, pincode, landmark, delivery_instructions, " +
            "delivery_lat, delivery_lng, item_total, delivery_fee, taxes, discount, total_amount, " +
            "status, payment_mode, payment_status, estimated_delivery_time, delivery_partner_id) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLACED', ?, ?, ?, ?)";

        String itemSql = 
            "INSERT INTO order_item (order_id, menu_id, item_name, quantity, price_at_order, total_price, item_total) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection()) {
            con.setAutoCommit(false);

            try (PreparedStatement psOrder = con.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                psOrder.setInt(1, userId);
                psOrder.setInt(2, restaurantId);
                psOrder.setString(3, customerName != null ? customerName.trim() : "");
                psOrder.setString(4, customerPhone != null ? customerPhone.trim() : "");
                psOrder.setString(5, customerEmail != null ? customerEmail.trim() : "");

                psOrder.setString(6, deliveryAddress != null ? deliveryAddress.trim() : "");
                psOrder.setString(7, houseNumber != null ? houseNumber.trim() : "");
                psOrder.setString(8, street != null ? street.trim() : "");
                psOrder.setString(9, area != null ? area.trim() : "");
                psOrder.setString(10, city != null ? city.trim() : "");
                psOrder.setString(11, state != null ? state.trim() : "");
                psOrder.setString(12, pincode != null ? pincode.trim() : "");
                psOrder.setString(13, landmark != null ? landmark.trim() : "");
                psOrder.setString(14, deliveryInstructions != null ? deliveryInstructions.trim() : "");

                if (deliveryLat != null) psOrder.setDouble(15, deliveryLat); else psOrder.setNull(15, Types.DOUBLE);
                if (deliveryLng != null) psOrder.setDouble(16, deliveryLng); else psOrder.setNull(16, Types.DOUBLE);

                psOrder.setDouble(17, itemTotal);
                psOrder.setDouble(18, deliveryFee);
                psOrder.setDouble(19, taxes);
                psOrder.setDouble(20, discount);
                psOrder.setDouble(21, finalAmount);
                psOrder.setString(22, paymentMode);
                psOrder.setString(23, paymentStatus != null ? paymentStatus : "PENDING");
                psOrder.setString(24, estimatedDeliveryTime != null ? estimatedDeliveryTime : "30-40 mins");

                if (partnerId != null) psOrder.setInt(25, partnerId); else psOrder.setNull(25, Types.INTEGER);

                psOrder.executeUpdate();

                try (ResultSet rs = psOrder.getGeneratedKeys()) {
                    if (rs.next()) {
                        orderId = rs.getInt(1);
                    }
                }
            }

            if (orderId == 0) {
                con.rollback();
                throw new IllegalStateException("Failed to generate order ID");
            }

            try (PreparedStatement psItem = con.prepareStatement(itemSql)) {
                for (CartItem item : cart.getCartItems()) {
                    if (item != null) {
                        psItem.setInt(1, orderId);
                        psItem.setInt(2, item.getItemId());
                        psItem.setString(3, item.getName());
                        psItem.setInt(4, item.getQuantity());
                        psItem.setDouble(5, item.getPrice()); // Snapshot price at time of order
                        psItem.setDouble(6, item.getTotalPrice());
                        psItem.setDouble(7, item.getTotalPrice());
                        psItem.addBatch();
                    }
                }
                psItem.executeBatch();
            }

            con.commit();

            // Record initial history timeline
            try {
                OrderStatusHistoryDAOImpl historyDAO = new OrderStatusHistoryDAOImpl();
                historyDAO.addHistory(new OrderStatusHistory(
                    orderId, "PLACED", "CUSTOMER", "Order placed with " + paymentMode + " (Payment: " + paymentStatus + ")"
                ));

                if (assignedPartner != null) {
                    historyDAO.addHistory(new OrderStatusHistory(
                        orderId, "ASSIGNED", "SYSTEM", "Assigned to delivery partner: " + assignedPartner.getName()
                    ));
                }
            } catch (Exception ignored) {}

            return orderId;
        } catch (Exception e) {
            throw e;
        }
    }
}