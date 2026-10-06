package com.tap.dao;

import java.util.List;
import com.tap.model.Order;

public interface OrderDAO {
    int addOrder(Order order);
    Order getOrder(int orderId);
    List<Order> getOrdersByUserId(int userId);
    List<Order> getOrdersByRestaurantId(int restaurantId);
    List<Order> getAvailableOrdersForDelivery();
    List<Order> getAssignedOrdersForDelivery(int partnerId);
    boolean updateOrderStatus(int orderId, String status, String changedBy, String remarks);
    boolean assignDeliveryPartner(int orderId, int partnerId);
    boolean updatePaymentStatus(int orderId, String paymentStatus);
    boolean updateRazorpayDetails(int orderId, String razorpayOrderId, String razorpayPaymentId);
    Order getOrderByRazorpayOrderId(String razorpayOrderId);
    boolean updatePaymentFailure(int orderId, String reason);
    boolean updatePaymentCancellation(int orderId, String reason);
}
