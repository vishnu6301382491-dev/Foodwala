package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tap.service.SMSService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/api/auth/send-otp")
public class SendOTPServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    public static class OTPRecord {
        public String hashedOtp;
        public long expiresAt;
        public int attempts;
        public long lastSentAt;

        public OTPRecord(String hashedOtp, long expiresAt, long lastSentAt) {
            this.hashedOtp = hashedOtp;
            this.expiresAt = expiresAt;
            this.attempts = 0;
            this.lastSentAt = lastSentAt;
        }
    }

    public static final Map<String, OTPRecord> OTP_STORE = new ConcurrentHashMap<>();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern PHONE_JSON_PATTERN = Pattern.compile("\"phone\"\\s*:\\s*\"([^\"]+)\"");

    public static String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[\\s\\-\\(\\)]", "");
        if (digits.startsWith("+91")) digits = digits.substring(3);
        else if (digits.startsWith("91") && digits.length() == 12) digits = digits.substring(2);
        else if (digits.startsWith("0") && digits.length() == 11) digits = digits.substring(1);

        if (digits.matches("^[6-9]\\d{9}$")) {
            return "+91" + digits;
        }
        return null;
    }

    public static String hashOtp(String phone, String otp) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((phone + ":" + otp).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void applyCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
        }
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
        response.setHeader("Access-Control-Max-Age", "3600");
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    private String extractPhone(HttpServletRequest request) throws IOException {
        String phoneParam = request.getParameter("phone");
        if (phoneParam != null && !phoneParam.isBlank()) {
            return phoneParam.trim();
        }

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String body = sb.toString();
        if (!body.isBlank()) {
            Matcher m = PHONE_JSON_PATTERN.matcher(body);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        return null;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String rawPhone = extractPhone(request);
        String normalized = normalizePhone(rawPhone);

        if (normalized == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\": false, \"error\": \"INVALID_PHONE\", \"message\": \"Please enter a valid 10-digit mobile number.\"}");
            return;
        }

        long now = System.currentTimeMillis();
        OTPRecord existing = OTP_STORE.get(normalized);
        if (existing != null && (now - existing.lastSentAt) < 30000) {
            long waitSec = (30000 - (now - existing.lastSentAt)) / 1000 + 1;
            response.setStatus(429);
            out.print("{\"success\": false, \"error\": \"TOO_MANY_REQUESTS\", \"message\": \"Please wait " + waitSec + "s before requesting a new OTP.\", \"cooldownRemaining\": " + waitSec + "}");
            return;
        }

        int otpInt = 100000 + RANDOM.nextInt(900000);
        String otp = String.valueOf(otpInt);
        String hashed = hashOtp(normalized, otp);
        long expiresAt = now + (5 * 60 * 1000);

        OTP_STORE.put(normalized, new OTPRecord(hashed, expiresAt, now));

        // Console Dev Mode Logging
        System.out.println("==================================================");
        System.out.println("[FoodWala OTP] Development OTP: " + otp);
        System.out.println("[FoodWala OTP] Phone: " + normalized);
        System.out.println("[FoodWala OTP] Expiration: 5 minutes");
        System.out.println("==================================================");

        // Deliver via SMS provider if configured
        SMSService.getInstance().sendOtp(normalized, otp);

        String json = "{\"success\": true, \"message\": \"OTP sent successfully.\", \"phone\": \"" + normalized + "\", \"expiresIn\": 300}";
        out.print(json);
    }
}
