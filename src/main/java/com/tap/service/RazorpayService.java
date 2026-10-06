package com.tap.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Service to handle Razorpay API operations and cryptographic signature verification.
 */
public class RazorpayService {

    // =========================================================================
    // CONFIGURE YOUR RAZORPAY TEST/LIVE KEYS HERE OR VIA ENVIRONMENT VARIABLES:
    // Generate from: https://dashboard.razorpay.com/ -> Settings -> API Keys
    // =========================================================================
    public static String KEY_ID = "rzp_test_TjiZvLxLbxKe38";
    public static String KEY_SECRET = "EMGwjwj0mKsFIQMFDUiB7HxM";

    public static String getKeyId() {
        String key = System.getenv("RAZORPAY_KEY_ID");
        if (key != null && !key.isBlank() && !key.contains("YourKeyIdHere")) return key.trim();
        String propKey = System.getProperty("RAZORPAY_KEY_ID");
        if (propKey != null && !propKey.isBlank() && !propKey.contains("YourKeyIdHere")) return propKey.trim();
        return KEY_ID;
    }

    public static String getKeySecret() {
        String secret = System.getenv("RAZORPAY_KEY_SECRET");
        if (secret != null && !secret.isBlank() && !secret.contains("YourKeySecretHere")) return secret.trim();
        String propSecret = System.getProperty("RAZORPAY_KEY_SECRET");
        if (propSecret != null && !propSecret.isBlank() && !propSecret.contains("YourKeySecretHere")) return propSecret.trim();
        return KEY_SECRET;
    }

    public static boolean isKeyConfigured() {
        String id = getKeyId();
        String secret = getKeySecret();
        return id != null && !id.isBlank() && !id.contains("YourKeyIdHere") && id.startsWith("rzp_")
            && secret != null && !secret.isBlank() && !secret.contains("YourKeySecretHere");
    }

    /**
     * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
     * Formula: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
     */
    public static boolean verifySignature(String orderId, String paymentId, String razorpaySignature, String secret) {
        if (orderId == null || paymentId == null || razorpaySignature == null) {
            return false;
        }
        if (secret == null || secret.isBlank()) {
            secret = getKeySecret();
        }

        try {
            String payload = orderId.trim() + "|" + paymentId.trim();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            String generatedSignature = hexString.toString();
            return generatedSignature.equalsIgnoreCase(razorpaySignature.trim());
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Generates a signature for testing/verification purposes.
     */
    public static String generateTestSignature(String orderId, String paymentId, String secret) {
        try {
            String payload = orderId.trim() + "|" + paymentId.trim();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.trim().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating signature", e);
        }
    }

    /**
     * Creates an authentic order with Razorpay Orders API.
     * Amount is passed in Rupees and converted to Paise (amountInRupees * 100).
     */
    public static RazorpayOrderResponse createRazorpayOrder(double amountInRupees, String receipt) {
        long amountInPaise = Math.round(amountInRupees * 100);
        String keyId = getKeyId();
        String keySecret = getKeySecret();

        if (receipt == null || receipt.isBlank()) {
            receipt = "rcpt_" + System.currentTimeMillis();
        }

        if (!isKeyConfigured()) {
            return new RazorpayOrderResponse(
                false, null, amountInPaise, "INR", receipt, null, keyId,
                "Razorpay API Keys are not yet configured. Please set your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            );
        }

        try {
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            String requestJson = String.format(
                "{\"amount\": %d, \"currency\": \"INR\", \"receipt\": \"%s\", \"payment_capture\": 1}",
                amountInPaise, escapeJson(receipt)
            );

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                String body = response.body();
                String orderId = extractJsonValue(body, "id");
                if (orderId != null && !orderId.isBlank()) {
                    return new RazorpayOrderResponse(true, orderId, amountInPaise, "INR", receipt, body, keyId, null);
                }
            }

            // If Razorpay API returned an error (e.g. 401 Unauthorized or 400 Bad Request)
            return new RazorpayOrderResponse(
                false, null, amountInPaise, "INR", receipt, response.body(), keyId,
                "Razorpay API returned status " + response.statusCode() + ": " + response.body()
            );

        } catch (Exception e) {
            System.err.println("Razorpay API connection error: " + e.getMessage());
            return new RazorpayOrderResponse(
                false, null, amountInPaise, "INR", receipt, null, keyId,
                "Connection to Razorpay API failed: " + e.getMessage()
            );
        }
    }

    public static class RazorpayOrderResponse {
        private final boolean success;
        private final String orderId;
        private final long amount;
        private final String currency;
        private final String receipt;
        private final String rawJson;
        private final String keyId;
        private final String errorMessage;

        public RazorpayOrderResponse(boolean success, String orderId, long amount, String currency, 
                                     String receipt, String rawJson, String keyId, String errorMessage) {
            this.success = success;
            this.orderId = orderId;
            this.amount = amount;
            this.currency = currency;
            this.receipt = receipt;
            this.rawJson = rawJson;
            this.keyId = keyId;
            this.errorMessage = errorMessage;
        }

        public boolean isSuccess() { return success; }
        public String getOrderId() { return orderId; }
        public long getAmount() { return amount; }
        public String getCurrency() { return currency; }
        public String getReceipt() { return receipt; }
        public String getRawJson() { return rawJson; }
        public String getKeyId() { return keyId; }
        public String getErrorMessage() { return errorMessage; }
    }

    private static String extractJsonValue(String json, String key) {
        if (json == null) return null;
        String search = "\"" + key + "\":\"";
        int idx = json.indexOf(search);
        if (idx != -1) {
            int start = idx + search.length();
            int end = json.indexOf("\"", start);
            if (end != -1) return json.substring(start, end);
        }
        return null;
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
