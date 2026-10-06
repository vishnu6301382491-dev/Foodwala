package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import com.tap.dao.PaymentDAO;
import com.tap.model.Payment;
import com.tap.util.DBConnection;

public class PaymentDAOImpl implements PaymentDAO {

    private static final String INSERT_SQL = 
        "INSERT INTO payment (order_id, transaction_id, amount, payment_method, payment_status, gateway_reference, masked_account, razorpay_order_id, razorpay_payment_id, razorpay_signature) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    private static final String UPDATE_STATUS_SQL = 
        "UPDATE payment SET payment_status=? WHERE transaction_id=?";
    private static final String GET_BY_ORDER_SQL = 
        "SELECT * FROM payment WHERE order_id=? ORDER BY payment_id DESC LIMIT 1";
    private static final String GET_BY_TXN_SQL = 
        "SELECT * FROM payment WHERE transaction_id=?";

    @Override
    public int createPayment(Payment p) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(INSERT_SQL, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, p.getOrderId());
            ps.setString(2, p.getTransactionId());
            ps.setDouble(3, p.getAmount());
            ps.setString(4, p.getPaymentMethod());
            ps.setString(5, p.getPaymentStatus());
            ps.setString(6, p.getGatewayReference());
            ps.setString(7, p.getMaskedAccount());
            ps.setString(8, p.getRazorpayOrderId());
            ps.setString(9, p.getRazorpayPaymentId());
            ps.setString(10, p.getRazorpaySignature());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int id = rs.getInt(1);
                    p.setPaymentId(id);
                    return id;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public boolean updatePaymentStatus(String transactionId, String status) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(UPDATE_STATUS_SQL)) {
            ps.setString(1, status);
            ps.setString(2, transactionId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean recordRazorpayPayment(int orderId, String razorpayOrderId, String razorpayPaymentId, 
                                        String razorpaySignature, double amount, String paymentMethod, String status) {
        // Idempotency check: see if payment already exists for this order
        Payment existing = getPaymentByOrderId(orderId);
        if (existing != null) {
            String updateSql = "UPDATE payment SET payment_status=?, razorpay_order_id=?, razorpay_payment_id=?, razorpay_signature=?, amount=? WHERE payment_id=?";
            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setString(1, status != null ? status : "SUCCESS");
                ps.setString(2, razorpayOrderId != null ? razorpayOrderId : existing.getRazorpayOrderId());
                ps.setString(3, razorpayPaymentId != null ? razorpayPaymentId : existing.getRazorpayPaymentId());
                ps.setString(4, razorpaySignature != null ? razorpaySignature : existing.getRazorpaySignature());
                ps.setDouble(5, amount > 0 ? amount : existing.getAmount());
                ps.setInt(6, existing.getPaymentId());
                return ps.executeUpdate() > 0;
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        String txnId = "FW-RZP-" + (razorpayPaymentId != null ? razorpayPaymentId : String.valueOf(System.currentTimeMillis()));
        String masked = "Razorpay: " + (razorpayPaymentId != null ? razorpayPaymentId : "Verified");
        Payment p = new Payment(0, orderId, txnId, amount, paymentMethod != null ? paymentMethod : "RAZORPAY",
                                status != null ? status : "SUCCESS", razorpayPaymentId, masked,
                                razorpayOrderId, razorpayPaymentId, razorpaySignature, null);
        return createPayment(p) > 0;
    }

    @Override
    public Payment getPaymentByOrderId(int orderId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_ORDER_SQL)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Payment getPaymentByTransactionId(String transactionId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_TXN_SQL)) {
            ps.setString(1, transactionId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private Payment map(ResultSet rs) throws Exception {
        String rzpOrder = null;
        String rzpPay = null;
        String rzpSig = null;
        try { rzpOrder = rs.getString("razorpay_order_id"); } catch (Exception ignored) {}
        try { rzpPay = rs.getString("razorpay_payment_id"); } catch (Exception ignored) {}
        try { rzpSig = rs.getString("razorpay_signature"); } catch (Exception ignored) {}

        return new Payment(
            rs.getInt("payment_id"),
            rs.getInt("order_id"),
            rs.getString("transaction_id"),
            rs.getDouble("amount"),
            rs.getString("payment_method"),
            rs.getString("payment_status"),
            rs.getString("gateway_reference"),
            rs.getString("masked_account"),
            rzpOrder,
            rzpPay,
            rzpSig,
            rs.getTimestamp("created_at")
        );
    }
}
