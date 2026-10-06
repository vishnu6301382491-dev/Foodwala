package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String rawPhone = request.getParameter("phone");
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
            out.print("{\"success\": false, \"error\": \"TOO_MANY_REQUESTS\", \"message\": \"Please wait " + waitSec + "s before requesting a new OTP.\"}");
            return;
        }

        int otpInt = 100000 + RANDOM.nextInt(900000);
        String otp = String.valueOf(otpInt);
        String hashed = hashOtp(normalized, otp);
        long expiresAt = now + (5 * 60 * 1000);

        OTP_STORE.put(normalized, new OTPRecord(hashed, expiresAt, now));
        SMSService.getInstance().sendOtp(normalized, otp);

        String devMode = System.getenv("OTP_DEV_MODE");
        boolean isDev = (devMode == null || "true".equalsIgnoreCase(devMode));

        StringBuilder json = new StringBuilder();
        json.append("{\"success\": true, \"message\": \"OTP sent successfully.\", \"phone\": \"").append(normalized).append("\", \"expiresIn\": 300");
        if (isDev) {
            json.append(", \"devOtp\": \"").append(otp).append("\"");
        }
        json.append("}");

        out.print(json.toString());
    }
}
