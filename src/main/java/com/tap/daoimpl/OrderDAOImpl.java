package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.OrderDAO;
import com.tap.model.Order;
import com.tap.model.OrderStatusHistory;
import com.tap.util.DBConnection;

public class OrderDAOImpl implements OrderDAO {

    private static final String INSERT_QUERY = 
        "INSERT INTO orders (restaurant_id, user_id, customer_name, customer_phone, customer_email, " +
        "delivery_address, house_number, street, area, city, state, pincode, landmark, delivery_instructions, " +
        "delivery_lat, delivery_lng, item_total, delivery_fee, taxes, discount, total_amount, " +
        "status, payment_mode, payment_status, estimated_delivery_time, delivery_partner_id) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    private static final String GET_QUERY = "SELECT * FROM orders WHERE order_id=?";
    private static final String GET_BY_USER_QUERY = "SELECT * FROM orders WHERE user_id=? ORDER BY order_date DESC";
    private static final String GET_BY_REST_QUERY = "SELECT * FROM orders WHERE restaurant_id=? ORDER BY order_date DESC";
    private static final String GET_AVAILABLE_DELIVERY = 
        "SELECT * FROM orders WHERE delivery_partner_id IS NULL AND status IN ('READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED') ORDER BY order_date ASC";
    private static final String GET_ASSIGNED_DELIVERY = 
        "SELECT * FROM orders WHERE delivery_partner_id=? ORDER BY CASE WHEN status='DELIVERED' THEN 1 ELSE 0 END, order_date DESC";

    @Override
    public int addOrder(Order o) {
        try (Connection con = DBConnection.getConnection()) {
            return insertOrderAndGetId(con, o);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public int insertOrderAndGetId(Connection c, Order o) throws Exception {
        try (PreparedStatement ps = c.prepareStatement(INSERT_QUERY, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, o.getRestaurantId());
            ps.setInt(2, o.getUserId());
            ps.setString(3, o.getCustomerName());
            ps.setString(4, o.getCustomerPhone());
            ps.setString(5, o.getCustomerEmail() != null ? o.getCustomerEmail() : "");
            ps.setString(6, o.getDeliveryAddress());
            ps.setString(7, o.getHouseNumber() != null ? o.getHouseNumber() : "");
            ps.setString(8, o.getStreet() != null ? o.getStreet() : "");
            ps.setString(9, o.getArea() != null ? o.getArea() : "");
            ps.setString(10, o.getCity() != null ? o.getCity() : "Bengaluru");
            ps.setString(11, o.getState() != null ? o.getState() : "Karnataka");
            ps.setString(12, o.getPincode() != null ? o.getPincode() : "560004");
            ps.setString(13, o.getLandmark() != null ? o.getLandmark() : "");
            ps.setString(14, o.getDeliveryInstructions() != null ? o.getDeliveryInstructions() : "");

            if (o.getDeliveryLat() != null) ps.setDouble(15, o.getDeliveryLat()); else ps.setNull(15, java.sql.Types.DOUBLE);
            if (o.getDeliveryLng() != null) ps.setDouble(16, o.getDeliveryLng()); else ps.setNull(16, java.sql.Types.DOUBLE);
            ps.setDouble(17, o.getItemTotal());
            ps.setDouble(18, o.getDeliveryFee());
            ps.setDouble(19, o.getTaxes());
            ps.setDouble(20, o.getDiscount());
            ps.setDouble(21, o.getTotalAmount());
            ps.setString(22, o.getStatus() != null ? o.getStatus() : "PLACED");
            ps.setString(23, o.getPaymentMode());
            ps.setString(24, o.getPaymentStatus() != null ? o.getPaymentStatus() : "PENDING");
            ps.setString(25, o.getEstimatedDeliveryTime() != null ? o.getEstimatedDeliveryTime() : "30-40 mins");
            if (o.getDeliveryPartnerId() != null) ps.setInt(26, o.getDeliveryPartnerId()); else ps.setNull(26, java.sql.Types.INTEGER);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int id = rs.getInt(1);
                    o.setOrderId(id);

                    // Add initial status history
                    new OrderStatusHistoryDAOImpl().addHistory(new OrderStatusHistory(
                        id, o.getStatus() != null ? o.getStatus() : "PLACED", "CUSTOMER", "Order placed by customer"
                    ));

                    return id;
                }
            }
        }
        return 0;
    }

    @Override
    public Order getOrder(int id) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_QUERY)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Order> getOrdersByUserId(int userId) {
        List<Order> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_BY_USER_QUERY)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(map(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Order> getOrdersByRestaurantId(int restaurantId) {
        List<Order> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_BY_REST_QUERY)) {
            ps.setInt(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(map(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Order> getAvailableOrdersForDelivery() {
        List<Order> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_AVAILABLE_DELIVERY);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Order> getAssignedOrdersForDelivery(int partnerId) {
        List<Order> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_ASSIGNED_DELIVERY)) {
            ps.setInt(1, partnerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(map(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean updateOrderStatus(int orderId, String status, String changedBy, String remarks) {
        String sql = "UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, orderId);
            int rows = ps.executeUpdate();
            if (rows > 0) {
                new OrderStatusHistoryDAOImpl().addHistory(new OrderStatusHistory(
                    orderId, status, changedBy != null ? changedBy : "SYSTEM", remarks
                ));
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean assignDeliveryPartner(int orderId, int partnerId) {
        // Atomic compare-and-swap: only claim if delivery_partner_id IS NULL
        String sql = "UPDATE orders SET delivery_partner_id=? WHERE order_id=? AND delivery_partner_id IS NULL";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, partnerId);
            ps.setInt(2, orderId);
            int updated = ps.executeUpdate();
            if (updated > 0) {
                new OrderStatusHistoryDAOImpl().addHistory(new OrderStatusHistory(
                    orderId, "ASSIGNED", "DELIVERY_PARTNER", "Delivery partner claimed order"
                ));
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean updatePaymentStatus(int orderId, String paymentStatus) {
        String sql = "UPDATE orders SET payment_status=?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, paymentStatus);
            ps.setInt(2, orderId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean updateRazorpayDetails(int orderId, String razorpayOrderId, String razorpayPaymentId) {
        String sql = "UPDATE orders SET razorpay_order_id=?, razorpay_payment_id=?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, razorpayOrderId);
            ps.setString(2, razorpayPaymentId);
            ps.setInt(3, orderId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public Order getOrderByRazorpayOrderId(String razorpayOrderId) {
        if (razorpayOrderId == null || razorpayOrderId.isBlank()) return null;
        String sql = "SELECT * FROM orders WHERE razorpay_order_id=? ORDER BY order_id DESC LIMIT 1";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, razorpayOrderId.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public boolean updatePaymentFailure(int orderId, String reason) {
        String sql = "UPDATE orders SET status='PAYMENT_FAILED', payment_status='FAILED', updated_at=CURRENT_TIMESTAMP WHERE order_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            int rows = ps.executeUpdate();
            if (rows > 0) {
                new OrderStatusHistoryDAOImpl().addHistory(new OrderStatusHistory(
                    orderId, "PAYMENT_FAILED", "PAYMENT_GATEWAY", reason != null ? reason : "Payment failed / declined"
                ));
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean updatePaymentCancellation(int orderId, String reason) {
        String sql = "UPDATE orders SET status='CANCELLED', payment_status='CANCELLED', updated_at=CURRENT_TIMESTAMP WHERE order_id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, orderId);
            int rows = ps.executeUpdate();
            if (rows > 0) {
                new OrderStatusHistoryDAOImpl().addHistory(new OrderStatusHistory(
                    orderId, "CANCELLED", "CUSTOMER", reason != null ? reason : "Payment cancelled by user"
                ));
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateOrderStatus(int orderId, String status) {
        return updateOrderStatus(orderId, status, "SYSTEM", "Status updated to " + status);
    }

    private Order map(ResultSet rs) throws Exception {
        Order o = new Order();
        o.setOrderId(rs.getInt("order_id"));
        o.setRestaurantId(rs.getInt("restaurant_id"));
        o.setUserId(rs.getInt("user_id"));

        try { o.setCustomerName(rs.getString("customer_name")); } catch (Exception ignored) {}
        try { o.setCustomerPhone(rs.getString("customer_phone")); } catch (Exception ignored) {}
        try { o.setCustomerEmail(rs.getString("customer_email")); } catch (Exception ignored) {}
        try { o.setDeliveryAddress(rs.getString("delivery_address")); } catch (Exception ignored) {}
        try { o.setHouseNumber(rs.getString("house_number")); } catch (Exception ignored) {}
        try { o.setStreet(rs.getString("street")); } catch (Exception ignored) {}
        try { o.setArea(rs.getString("area")); } catch (Exception ignored) {}
        try { o.setCity(rs.getString("city")); } catch (Exception ignored) {}
        try { o.setState(rs.getString("state")); } catch (Exception ignored) {}
        try { o.setPincode(rs.getString("pincode")); } catch (Exception ignored) {}
        try { o.setLandmark(rs.getString("landmark")); } catch (Exception ignored) {}
        try { o.setDeliveryInstructions(rs.getString("delivery_instructions")); } catch (Exception ignored) {}

        try {
            if (rs.getObject("delivery_lat") != null) o.setDeliveryLat(rs.getDouble("delivery_lat"));
            if (rs.getObject("delivery_lng") != null) o.setDeliveryLng(rs.getDouble("delivery_lng"));
        } catch (Exception ignored) {}

        try { o.setItemTotal(rs.getDouble("item_total")); } catch (Exception ignored) {}
        try { o.setDeliveryFee(rs.getDouble("delivery_fee")); } catch (Exception ignored) {}
        try { o.setTaxes(rs.getDouble("taxes")); } catch (Exception ignored) {}
        try { o.setDiscount(rs.getDouble("discount")); } catch (Exception ignored) {}
        o.setTotalAmount(rs.getDouble("total_amount"));

        o.setStatus(rs.getString("status"));
        o.setPaymentMode(rs.getString("payment_mode"));
        try { o.setPaymentStatus(rs.getString("payment_status")); } catch (Exception ignored) {}
        try { o.setRazorpayOrderId(rs.getString("razorpay_order_id")); } catch (Exception ignored) {}
        try { o.setRazorpayPaymentId(rs.getString("razorpay_payment_id")); } catch (Exception ignored) {}
        try {
            if (rs.getObject("delivery_partner_id") != null) {
                o.setDeliveryPartnerId(rs.getInt("delivery_partner_id"));
            }
        } catch (Exception ignored) {}
        try { o.setEstimatedDeliveryTime(rs.getString("estimated_delivery_time")); } catch (Exception ignored) {}
        o.setOrderDate(rs.getTimestamp("order_date"));
        try { o.setUpdatedAt(rs.getTimestamp("updated_at")); } catch (Exception ignored) {}

        return o;
    }
}
