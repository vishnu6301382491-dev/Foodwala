package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.UUID;

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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String rawPhone = request.getParameter("phone");
        String otp = request.getParameter("otp");
        String normalized = SendOTPServlet.normalizePhone(rawPhone);

        if (normalized == null || otp == null || otp.trim().length() != 6) {
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

        String computed = SendOTPServlet.hashOtp(normalized, otp.trim());
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
            user = userDAO.getUser(1);
        } catch (Exception e) {}

        HttpSession session = request.getSession();
        String token = "fw_sess_" + UUID.randomUUID().toString();

        if (user != null) {
            session.setAttribute("currentUser", user);
            out.print("{\"success\": true, \"isNewUser\": false, \"message\": \"Mobile number verified successfully.\", \"token\": \"" + token + "\", \"user\": {\"userId\": " + user.getUserId() + ", \"name\": \"" + user.getName() + "\", \"phone\": \"" + normalized + "\", \"email\": \"" + (user.getEmail() != null ? user.getEmail() : "") + "\"}}");
        } else {
            out.print("{\"success\": true, \"isNewUser\": true, \"phone\": \"" + normalized + "\", \"message\": \"Mobile number verified successfully. Please complete your profile.\"}");
        }
    }
}
