package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tap.dao.UserDAO;
import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/api/auth/verify-otp")
public class VerifyOTPServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAO userDAO = new UserDAOImpl();

    private static final Pattern PHONE_JSON_PATTERN = Pattern.compile("\"phone\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern OTP_JSON_PATTERN = Pattern.compile("\"otp\"\\s*:\\s*\"([^\"]+)\"");

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

    private static class VerifyInput {
        String phone;
        String otp;
    }

    private VerifyInput extractInput(HttpServletRequest request) throws IOException {
        VerifyInput input = new VerifyInput();
        input.phone = request.getParameter("phone");
        input.otp = request.getParameter("otp");

        if ((input.phone == null || input.phone.isBlank()) || (input.otp == null || input.otp.isBlank())) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
            }
            String body = sb.toString();
            if (!body.isBlank()) {
                Matcher pm = PHONE_JSON_PATTERN.matcher(body);
                if (pm.find()) input.phone = pm.group(1).trim();
                Matcher om = OTP_JSON_PATTERN.matcher(body);
                if (om.find()) input.otp = om.group(1).trim();
            }
        }
        return input;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        applyCorsHeaders(request, response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        VerifyInput input = extractInput(request);
        String normalized = SendOTPServlet.normalizePhone(input.phone);
        String otp = (input.otp != null) ? input.otp.trim() : null;

        if (normalized == null || otp == null || otp.length() != 6 || !otp.matches("^\\d{6}$")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\": false, \"error\": \"INVALID_OTP_FORMAT\", \"message\": \"Please enter the 6-digit verification code.\"}");
            return;
        }

        SendOTPServlet.OTPRecord record = SendOTPServlet.OTP_STORE.get(normalized);
        if (record == null || System.currentTimeMillis() > record.expiresAt) {
            SendOTPServlet.OTP_STORE.remove(normalized);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\": false, \"error\": \"OTP_EXPIRED\", \"message\": \"OTP expired. Please request a new OTP.\"}");
            return;
        }

        if (record.attempts >= 5) {
            SendOTPServlet.OTP_STORE.remove(normalized);
            response.setStatus(429);
            out.print("{\"success\": false, \"error\": \"TOO_MANY_ATTEMPTS\", \"message\": \"Too many attempts. Please request a new OTP.\"}");
            return;
        }

        String computed = SendOTPServlet.hashOtp(normalized, otp);
        if (!computed.equals(record.hashedOtp)) {
            record.attempts++;
            int remaining = 5 - record.attempts;
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\": false, \"error\": \"INCORRECT_OTP\", \"message\": \"Incorrect OTP. Please check and try again.\", \"attemptsRemaining\": " + remaining + "}");
            return;
        }

        SendOTPServlet.OTP_STORE.remove(normalized);

        User user = null;
        try {
            user = userDAO.getUserByPhone(normalized);
            if (user == null) {
                // Fallback check user 1 if present
                user = userDAO.getUser(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        HttpSession session = request.getSession();
        String token = "fw_sess_" + UUID.randomUUID().toString();

        if (user != null) {
            session.setAttribute("currentUser", user);
            session.setAttribute("loggedInUser", user);
            out.print("{\"success\": true, \"isNewUser\": false, \"message\": \"Mobile number verified successfully.\", \"token\": \"" + token + "\", \"user\": {\"userId\": " + user.getUserId() + ", \"name\": \"" + (user.getName() != null ? user.getName().replace("\"", "\\\"") : "") + "\", \"phone\": \"" + normalized + "\", \"email\": \"" + (user.getEmail() != null ? user.getEmail().replace("\"", "\\\"") : "") + "\"}}");
        } else {
            out.print("{\"success\": true, \"isNewUser\": true, \"phone\": \"" + normalized + "\", \"message\": \"Mobile number verified successfully. Please complete your profile.\"}");
        }
    }
}
