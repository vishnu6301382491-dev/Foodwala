package com.tap.dao;

import com.tap.model.Payment;

public interface PaymentDAO {
    int createPayment(Payment payment);
    boolean updatePaymentStatus(String transactionId, String status);
    boolean recordRazorpayPayment(int orderId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature, double amount, String paymentMethod, String status);
    Payment getPaymentByOrderId(int orderId);
    Payment getPaymentByTransactionId(String transactionId);
}
