package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;
import com.tap.util.PasswordUtil;
import com.tap.util.PasswordUtil.ValidationResult;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet({"/register", "/api/auth/register"})
public class RegistrationController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAOImpl userDAO;

    private static final Pattern USERNAME_PATTERN = Pattern.compile("\"(?:username|name|fullName)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern PHONE_PATTERN = Pattern.compile("\"(?:phone|mobile)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("\"password\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CONFIRM_PATTERN = Pattern.compile("\"(?:confirmPassword|confirm_password)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern ADDRESS_PATTERN = Pattern.compile("\"address\"\\s*:\\s*\"([^\"]+)\"");

    @Override
    public void init() {
        userDAO = new UserDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getServletPath();
        if ("/api/auth/register".equalsIgnoreCase(path)) {
            response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            return;
        }
        request.getRequestDispatcher("/register.jsp").forward(request, response);
    }

    private static class RegisterData {
        String username;
        String email;
        String phone;
        String password;
        String confirmPassword;
        String address;
    }

    private RegisterData extractData(HttpServletRequest request) throws IOException {
        RegisterData d = new RegisterData();
        d.username = request.getParameter("username");
        if (d.username == null || d.username.isBlank()) d.username = request.getParameter("name");
        d.email = request.getParameter("email");
        d.phone = request.getParameter("phone");
        if (d.phone == null || d.phone.isBlank()) d.phone = request.getParameter("mobile");
        d.password = request.getParameter("password");
        d.confirmPassword = request.getParameter("confirmPassword");
        if (d.confirmPassword == null || d.confirmPassword.isBlank()) d.confirmPassword = request.getParameter("confirm_password");
        d.address = request.getParameter("address");

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
                Matcher um = USERNAME_PATTERN.matcher(body);
                if (um.find()) d.username = um.group(1).trim();
                Matcher em = EMAIL_PATTERN.matcher(body);
                if (em.find()) d.email = em.group(1).trim();
                Matcher pm = PHONE_PATTERN.matcher(body);
                if (pm.find()) d.phone = pm.group(1).trim();
                Matcher pwm = PASSWORD_PATTERN.matcher(body);
                if (pwm.find()) d.password = pwm.group(1);
                Matcher cpm = CONFIRM_PATTERN.matcher(body);
                if (cpm.find()) d.confirmPassword = cpm.group(1);
                Matcher am = ADDRESS_PATTERN.matcher(body);
                if (am.find()) d.address = am.group(1).trim();
            }
        }

        return d;
    }

    private boolean isApiRequest(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path != null && path.contains("/api/")) return true;
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) return true;
        String contentType = request.getContentType();
        return contentType != null && contentType.contains("application/json");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        boolean isApi = isApiRequest(request);
        RegisterData d = extractData(request);

        String username = d.username != null ? d.username.trim() : null;
        String email = d.email != null ? d.email.trim().toLowerCase() : null;
        String phone = d.phone != null && !d.phone.isBlank() ? d.phone.trim() : null;
        String address = d.address != null && !d.address.isBlank() ? d.address.trim() : null;
        String password = d.password; // Do NOT trim password
        String confirmPassword = d.confirmPassword;

        // 1. Validate required fields
        if (username == null || username.isBlank() || email == null || email.isBlank() || password == null || password.isEmpty()) {
            sendError(request, response, isApi, "Name, email and password are required.");
            return;
        }

        // 2. Validate email format
        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            sendError(request, response, isApi, "Please enter a valid email address.");
            return;
        }

        // 3. Validate password policy (8-128 chars, at least one letter, at least one digit)
        ValidationResult valRes = PasswordUtil.validatePassword(password);
        if (!valRes.valid) {
            sendError(request, response, isApi, valRes.message);
            return;
        }

        // 4. Validate password confirmation if provided
        if (confirmPassword != null && !confirmPassword.equals(password)) {
            sendError(request, response, isApi, "Passwords do not match. Please verify your confirm password.");
            return;
        }

        // 5. Check if email already exists
        if (userDAO.emailExists(email)) {
            sendError(request, response, isApi, "An account with this email address already exists.");
            return;
        }

        // 6. Check if mobile already exists
        if (phone != null && userDAO.phoneExists(phone)) {
            sendError(request, response, isApi, "An account with this mobile phone number already exists.");
            return;
        }

        // 7. Generate secure one-way password hash using Argon2id
        String passwordHash = PasswordUtil.hash(password);

        // 8. Create user with password hash (Raw password is NEVER stored)
        User user = new User(username, passwordHash, email, phone, address, "CUSTOMER");
        int generatedId = userDAO.addUser(user);

        if (generatedId > 0) {
            if (isApi) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                PrintWriter out = response.getWriter();
                out.print("{\"success\":true,\"message\":\"Account created successfully.\",\"user\":{" +
                        "\"userId\":" + generatedId + "," +
                        "\"name\":\"" + escape(user.getName()) + "\"," +
                        "\"username\":\"" + escape(user.getUsername()) + "\"," +
                        "\"email\":\"" + escape(user.getEmail()) + "\"," +
                        "\"phone\":\"" + (user.getPhone() != null ? escape(user.getPhone()) : "") + "\"," +
                        "\"role\":\"" + escape(user.getRole()) + "\"" +
                        "}}");
                out.flush();
            } else {
                response.sendRedirect(request.getContextPath() + "/login?registered=1");
            }
        } else {
            sendError(request, response, isApi, "Registration failed due to a server error. Please try again.");
        }
    }

    private void sendError(HttpServletRequest request, HttpServletResponse response, boolean isApi, String message)
            throws ServletException, IOException {
        if (isApi) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            PrintWriter out = response.getWriter();
            out.print("{\"success\":false,\"message\":\"" + escape(message) + "\"}");
            out.flush();
        } else {
            request.setAttribute("error", message);
            request.getRequestDispatcher("/register.jsp").forward(request, response);
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
