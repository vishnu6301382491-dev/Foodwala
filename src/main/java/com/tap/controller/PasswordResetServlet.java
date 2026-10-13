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

import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;
import com.tap.service.SMSService;
import com.tap.util.PasswordUtil;
import com.tap.util.PasswordUtil.ValidationResult;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/api/auth/forgot-password", "/api/auth/reset-password", "/forgot-password", "/reset-password"})
public class PasswordResetServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final UserDAOImpl userDAO = new UserDAOImpl();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Hashed token store: hashedToken -> ResetRecord
    public static class ResetRecord {
        public final int userId;
        public final long expiresAt;

        public ResetRecord(int userId, long expiresAt) {
            this.userId = userId;
            this.expiresAt = expiresAt;
        }
    }

    public static final Map<String, ResetRecord> RESET_TOKEN_STORE = new ConcurrentHashMap<>();

    private static final Pattern IDENTIFIER_PATTERN = Pattern.compile("\"(?:email|phone|identifier)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern NEW_PW_PATTERN = Pattern.compile("\"(?:newPassword|password)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CONFIRM_PW_PATTERN = Pattern.compile("\"(?:confirmPassword|confirm_password)\"\\s*:\\s*\"([^\"]+)\"");

    public static String hashToken(String rawToken) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return rawToken;
        }
    }

    public static String generateResetToken(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        UserDAOImpl dao = new UserDAOImpl();
        User user = identifier.contains("@") ? dao.getUserByEmail(identifier) : dao.getUserByPhone(identifier);
        if (user == null) user = dao.getUserByEmail(identifier);
        if (user == null) return null;

        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        String rawToken = sb.toString();

        String tokenHash = hashToken(rawToken);
        long expiresAt = System.currentTimeMillis() + (15 * 60 * 1000);
        RESET_TOKEN_STORE.put(tokenHash, new ResetRecord(user.getUserId(), expiresAt));
        return rawToken;
    }

    public static boolean resetPasswordWithToken(String token, String newPassword) {
        if (token == null || token.isBlank() || newPassword == null || newPassword.isEmpty()) return false;
        String tokenHash = hashToken(token);
        ResetRecord record = RESET_TOKEN_STORE.get(tokenHash);
        if (record == null || System.currentTimeMillis() > record.expiresAt) {
            RESET_TOKEN_STORE.remove(tokenHash);
            return false;
        }

        ValidationResult valRes = PasswordUtil.validatePassword(newPassword);
        if (!valRes.valid) return false;

        String newHash = PasswordUtil.hash(newPassword);
        UserDAOImpl dao = new UserDAOImpl();
        int updated = dao.updatePassword(record.userId, newHash);
        RESET_TOKEN_STORE.remove(tokenHash);
        return updated > 0;
    }

    private static class RequestData {
        String identifier;
        String token;
        String newPassword;
        String confirmPassword;
    }

    private RequestData parseRequest(HttpServletRequest request) throws IOException {
        RequestData d = new RequestData();
        d.identifier = request.getParameter("identifier");
        if (d.identifier == null || d.identifier.isBlank()) d.identifier = request.getParameter("email");
        if (d.identifier == null || d.identifier.isBlank()) d.identifier = request.getParameter("phone");
        d.token = request.getParameter("token");
        d.newPassword = request.getParameter("newPassword");
        if (d.newPassword == null || d.newPassword.isBlank()) d.newPassword = request.getParameter("password");
        d.confirmPassword = request.getParameter("confirmPassword");
        if (d.confirmPassword == null || d.confirmPassword.isBlank()) d.confirmPassword = request.getParameter("confirm_password");

        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase().contains("application/json")) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String body = sb.toString();
            if (!body.isBlank()) {
                Matcher im = IDENTIFIER_PATTERN.matcher(body);
                if (im.find()) d.identifier = im.group(1).trim();
                Matcher tm = TOKEN_PATTERN.matcher(body);
                if (tm.find()) d.token = tm.group(1).trim();
                Matcher npm = NEW_PW_PATTERN.matcher(body);
                if (npm.find()) d.newPassword = npm.group(1);
                Matcher cpm = CONFIRM_PW_PATTERN.matcher(body);
                if (cpm.find()) d.confirmPassword = cpm.group(1);
            }
        }

        return d;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String path = request.getServletPath();
        RequestData data = parseRequest(request);

        if (path.contains("forgot-password")) {
            handleForgotPassword(request, response, data);
        } else {
            handleResetPassword(request, response, data);
        }
    }

    private void handleForgotPassword(HttpServletRequest request, HttpServletResponse response, RequestData data)
            throws IOException {
        String identifier = data.identifier != null ? data.identifier.trim() : null;

        if (identifier == null || identifier.isBlank()) {
            sendJson(response, 400, false, "Please enter your registered email or mobile number.", null);
            return;
        }

        User user = null;
        if (identifier.contains("@")) {
            user = userDAO.getUserByEmail(identifier);
        } else {
            user = userDAO.getUserByPhone(identifier);
            if (user == null) {
                user = userDAO.getUserByEmail(identifier);
            }
        }

        String rawToken = generateResetToken(identifier);

        // Generic safe response to prevent user enumeration
        String msg = "If an account exists with that email or mobile number, a password reset link has been issued.";
        boolean isDev = SMSService.getInstance().isDevMode();

        sendJson(response, 200, true, msg, (isDev && rawToken != null) ? rawToken : null);
    }

    private void handleResetPassword(HttpServletRequest request, HttpServletResponse response, RequestData data)
            throws IOException {
        String token = data.token != null ? data.token.trim() : null;
        String newPassword = data.newPassword;
        String confirmPassword = data.confirmPassword;

        if (token == null || token.isBlank()) {
            sendJson(response, 400, false, "Password reset token is required.", null);
            return;
        }

        if (newPassword == null || newPassword.isEmpty()) {
            sendJson(response, 400, false, "New password is required.", null);
            return;
        }

        // Validate token
        String tokenHash = hashToken(token);
        ResetRecord record = RESET_TOKEN_STORE.get(tokenHash);

        if (record == null || System.currentTimeMillis() > record.expiresAt) {
            RESET_TOKEN_STORE.remove(tokenHash);
            sendJson(response, 400, false, "Invalid or expired password reset token.", null);
            return;
        }

        // Validate password confirmation
        if (confirmPassword != null && !newPassword.equals(confirmPassword)) {
            sendJson(response, 400, false, "Passwords do not match.", null);
            return;
        }

        // Validate password policy
        ValidationResult valRes = PasswordUtil.validatePassword(newPassword);
        if (!valRes.valid) {
            sendJson(response, 400, false, valRes.message, null);
            return;
        }

        // Hash new password using Argon2id
        String newHash = PasswordUtil.hash(newPassword);

        // Update in database using parameterized query
        int updated = userDAO.updatePassword(record.userId, newHash);

        // Invalidate token immediately after use
        RESET_TOKEN_STORE.remove(tokenHash);

        if (updated > 0) {
            sendJson(response, 200, true, "Password reset successfully. You can now sign in with your new password.", null);
        } else {
            sendJson(response, 500, false, "Failed to update password. Please try again.", null);
        }
    }

    private void sendJson(HttpServletResponse response, int status, boolean success, String message, String devToken)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"success\":").append(success).append(",");
        sb.append("\"message\":\"").append(message.replace("\"", "\\\"")).append("\"");
        if (devToken != null) {
            sb.append(",\"devResetToken\":\"").append(devToken).append("\"");
        }
        sb.append("}");

        out.print(sb.toString());
        out.flush();
    }
}
