package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;
import com.tap.util.PasswordUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/login", "/api/auth/login"})
public class LoginController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAOImpl userDAO;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("\"(?:email|identifier|username)\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("\"password\"\\s*:\\s*\"([^\"]+)\"");

    @Override
    public void init() {
        userDAO = new UserDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String path = request.getServletPath();
        if ("/api/auth/login".equalsIgnoreCase(path)) {
            response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            return;
        }
        request.getRequestDispatcher("/login.jsp").forward(request, response);
    }

    private static class Credentials {
        String identifier;
        String password;
        String redirect;
    }

    private Credentials extractCredentials(HttpServletRequest request) throws IOException {
        Credentials creds = new Credentials();
        creds.identifier = request.getParameter("email");
        if (creds.identifier == null || creds.identifier.isBlank()) {
            creds.identifier = request.getParameter("phone");
        }
        if (creds.identifier == null || creds.identifier.isBlank()) {
            creds.identifier = request.getParameter("identifier");
        }
        if (creds.identifier == null || creds.identifier.isBlank()) {
            creds.identifier = request.getParameter("username");
        }

        creds.password = request.getParameter("password");
        creds.redirect = request.getParameter("redirect");

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
                Matcher em = EMAIL_PATTERN.matcher(body);
                if (em.find()) creds.identifier = em.group(1).trim();
                Matcher pm = PASSWORD_PATTERN.matcher(body);
                if (pm.find()) creds.password = pm.group(1);
            }
        }

        return creds;
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
        Credentials creds = extractCredentials(request);

        String identifier = creds.identifier != null ? creds.identifier.trim() : null;
        String password = creds.password; // Do NOT trim or alter actual password

        if (identifier == null || identifier.isBlank() || password == null || password.isEmpty()) {
            if (isApi) {
                sendJsonResponse(response, HttpServletResponse.SC_BAD_REQUEST, false, "Email/mobile number and password are required.", null);
            } else {
                request.setAttribute("error", "Email/mobile number and password are required.");
                request.getRequestDispatcher("/login.jsp").forward(request, response);
            }
            return;
        }

        // Retrieve user by email or by phone
        User user = null;
        if (identifier.contains("@")) {
            user = userDAO.getUserByEmail(identifier);
        } else {
            user = userDAO.getUserByPhone(identifier);
            if (user == null) {
                user = userDAO.getUserByEmail(identifier);
            }
        }

        // Constant-time verify check to mitigate user-enumeration & timing discrepancy
        boolean authenticated = false;
        if (user != null && user.getPassword() != null) {
            authenticated = PasswordUtil.verify(password, user.getPassword());
        } else {
            // Dummy hash verification with identical Argon2id work factor
            PasswordUtil.verify("dummyAttempt", "$argon2id$v=19$m=19456,t=3,p=1$c29tZXNhbHRmb3JkdW1teQ$ZHVtbXloYXNoZm9yY29uc3RhbnR0aW1l");
        }

        if (!authenticated) {
            // Generic security error message - Never reveal if identifier exists
            String genericError = "Invalid email/mobile number or password.";
            if (isApi) {
                sendJsonResponse(response, HttpServletResponse.SC_UNAUTHORIZED, false, genericError, null);
            } else {
                request.setAttribute("error", genericError);
                request.getRequestDispatcher("/login.jsp").forward(request, response);
            }
            return;
        }

        // Transparent, seamless upgrade to Argon2id if hash needs rehash
        if (PasswordUtil.needsRehash(user.getPassword())) {
            try {
                String freshArgon2Hash = PasswordUtil.hash(password);
                userDAO.updatePassword(user.getUserId(), freshArgon2Hash);
                user.setPassword(freshArgon2Hash);
            } catch (Exception e) {
                // Non-blocking fallback; user is already authenticated
            }
        }

        // Establish session
        HttpSession session = request.getSession(true);
        session.setAttribute("loggedInUser", user);
        session.setAttribute("currentUser", user);

        if (isApi) {
            sendJsonResponse(response, HttpServletResponse.SC_OK, true, "Login successful.", user);
            return;
        }

        // Standard JSP Form Post Redirection
        String redirect = creds.redirect;
        if (redirect != null && !redirect.isBlank() && !redirect.contains("://") && !redirect.contains("login") && !redirect.contains("register")) {
            response.sendRedirect(request.getContextPath() + (redirect.startsWith("/") ? redirect : "/" + redirect));
        } else if ("RESTAURANT".equalsIgnoreCase(user.getRole())) {
            response.sendRedirect(request.getContextPath() + "/restaurant/dashboard");
        } else if ("DELIVERY_PARTNER".equalsIgnoreCase(user.getRole()) || "DELIVERY".equalsIgnoreCase(user.getRole())) {
            response.sendRedirect(request.getContextPath() + "/delivery/dashboard");
        } else {
            response.sendRedirect(request.getContextPath() + "/cart");
        }
    }

    private void sendJsonResponse(HttpServletResponse response, int status, boolean success, String message, User user)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"success\":").append(success).append(",");
        sb.append("\"message\":\"").append(escape(message)).append("\"");

        if (user != null) {
            sb.append(",\"user\":{");
            sb.append("\"userId\":").append(user.getUserId()).append(",");
            sb.append("\"name\":\"").append(escape(user.getName())).append("\",");
            sb.append("\"username\":\"").append(escape(user.getUsername())).append("\",");
            sb.append("\"email\":\"").append(escape(user.getEmail())).append("\",");
            sb.append("\"phone\":\"").append(escape(user.getPhone())).append("\",");
            sb.append("\"role\":\"").append(escape(user.getRole())).append("\"");
            sb.append("}");
        }

        sb.append("}");
        out.print(sb.toString());
        out.flush();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
