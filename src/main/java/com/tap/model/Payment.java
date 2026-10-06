package com.tap.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class Payment implements Serializable {
    private static final long serialVersionUID = 1L;
    private int paymentId;
    private int orderId;
    private String transactionId;
    private double amount;
    private String paymentMethod;
    private String paymentStatus;
    private String gatewayReference;
    private String maskedAccount;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private Timestamp createdAt;

    public Payment() {}

    public Payment(int paymentId, int orderId, String transactionId, double amount,
                   String paymentMethod, String paymentStatus, String gatewayReference,
                   String maskedAccount, Timestamp createdAt) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.gatewayReference = gatewayReference;
        this.maskedAccount = maskedAccount;
        this.createdAt = createdAt;
    }

    public Payment(int paymentId, int orderId, String transactionId, double amount,
                   String paymentMethod, String paymentStatus, String gatewayReference,
                   String maskedAccount, String razorpayOrderId, String razorpayPaymentId,
                   String razorpaySignature, Timestamp createdAt) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.gatewayReference = gatewayReference;
        this.maskedAccount = maskedAccount;
        this.razorpayOrderId = razorpayOrderId;
        this.razorpayPaymentId = razorpayPaymentId;
        this.razorpaySignature = razorpaySignature;
        this.createdAt = createdAt;
    }

    public int getPaymentId() { return paymentId; }
    public void setPaymentId(int paymentId) { this.paymentId = paymentId; }
    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getGatewayReference() { return gatewayReference; }
    public void setGatewayReference(String gatewayReference) { this.gatewayReference = gatewayReference; }
    public String getMaskedAccount() { return maskedAccount; }
    public void setMaskedAccount(String maskedAccount) { this.maskedAccount = maskedAccount; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }
}
