package com.tap.service;

import java.util.UUID;
import java.util.regex.Pattern;
import com.tap.daoimpl.PaymentDAOImpl;
import com.tap.model.Payment;

public class PaymentService {

    private final PaymentDAOImpl paymentDAO = new PaymentDAOImpl();

    private static final Pattern UPI_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    /**
     * Validates UPI ID format strictly.
     * e.g. "hi" -> false, "user@upi" -> true, "user@okhdfcbank" -> true
     */
    public static boolean isValidUpiId(String upi) {
        if (upi == null || upi.trim().isEmpty()) {
            return false;
        }
        return UPI_PATTERN.matcher(upi.trim()).matches();
    }

    /**
     * Validates 10-digit Indian mobile number starting with 6, 7, 8, or 9.
     */
    public static boolean isValidIndianPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        String clean = phone.replaceAll("[^0-9]", "");
        return PHONE_PATTERN.matcher(clean).matches();
    }

    /**
     * Validates 6-digit Indian PIN Code.
     */
    public static boolean isValidIndianPincode(String pin) {
        if (pin == null || pin.trim().isEmpty()) {
            return false;
        }
        return PINCODE_PATTERN.matcher(pin.trim()).matches();
    }

    /**
     * Initializes payment record safely.
     * Possible statuses: INITIATED, PENDING, SUCCESS, FAILED, CANCELLED.
     */
    public Payment initiatePayment(int orderId, double amount, String paymentMethod, String accountDetail) {
        boolean isCod = "Cash on Delivery".equalsIgnoreCase(paymentMethod) || "COD".equalsIgnoreCase(paymentMethod);
        String prefix = isCod ? "FW-COD-" : "FW-TXN-";
        String txnId = prefix + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String gatewayRef = isCod ? "COD-GATEWAY" : ("GW-DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        String maskedAccount = maskAccountInfo(paymentMethod, accountDetail);
        String initialStatus = isCod ? "PENDING" : "INITIATED";

        Payment p = new Payment(0, orderId, txnId, amount, isCod ? "Cash on Delivery" : paymentMethod, 
                                initialStatus, gatewayRef, maskedAccount, null);
        int paymentId = paymentDAO.createPayment(p);
        p.setPaymentId(paymentId);
        return p;
    }

    /**
     * Confirms or declines payment transaction.
     */
    public boolean verifyPayment(String transactionId, boolean simulateSuccess) {
        String newStatus = simulateSuccess ? "SUCCESS" : "FAILED";
        return paymentDAO.updatePaymentStatus(transactionId, newStatus);
    }

    /**
     * Verifies Razorpay HMAC-SHA256 signature.
     */
    public boolean verifyRazorpaySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        return RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, RazorpayService.getKeySecret());
    }

    /**
     * Creates a Razorpay Order server-side.
     */
    public RazorpayService.RazorpayOrderResponse createRazorpayOrder(double amountInRupees, String receipt) {
        return RazorpayService.createRazorpayOrder(amountInRupees, receipt);
    }

    /**
     * Records an authentic Razorpay verified payment transaction.
     */
    public boolean recordRazorpaySuccess(int orderId, String razorpayOrderId, String razorpayPaymentId, 
                                        String razorpaySignature, double amount, String paymentMethod) {
        return paymentDAO.recordRazorpayPayment(orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, 
                                               amount, paymentMethod != null ? paymentMethod : "RAZORPAY", "SUCCESS");
    }

    public Payment getPaymentStatus(String transactionId) {
        return paymentDAO.getPaymentByTransactionId(transactionId);
    }

    public Payment getPaymentByOrderId(int orderId) {
        return paymentDAO.getPaymentByOrderId(orderId);
    }

    /**
     * Masks sensitive payment identifiers (PCI-DSS compliant).
     * Sensitive details like CVV, PIN, or full card numbers are NEVER saved.
     */
    public static String maskAccountInfo(String method, String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            if ("UPI".equalsIgnoreCase(method)) return "user@upi";
            if ("Credit/Debit Card".equalsIgnoreCase(method) || "Card".equalsIgnoreCase(method)) return "Card ending in 4242";
            if ("Net Banking".equalsIgnoreCase(method)) return "Net Banking Account";
            return "Cash on Delivery";
        }

        String trimmed = raw.trim();
        if (trimmed.contains("@")) {
            // UPI ID e.g. vishnu.customer@okhdfcbank -> v***r@okhdfcbank
            int atIndex = trimmed.indexOf("@");
            String handle = trimmed.substring(0, atIndex);
            String domain = trimmed.substring(atIndex);
            if (handle.length() <= 2) {
                return handle + "***" + domain;
            }
            return handle.charAt(0) + "***" + handle.charAt(handle.length() - 1) + domain;
        }

        // Card number e.g. 4111222233331234 -> Card ending in 1234
        String digitsOnly = trimmed.replaceAll("\\D", "");
        if (digitsOnly.length() >= 4) {
            return "Card ending in " + digitsOnly.substring(digitsOnly.length() - 4);
        }

        return trimmed;
    }
}
