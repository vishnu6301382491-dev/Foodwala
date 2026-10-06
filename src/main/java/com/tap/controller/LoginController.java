package com.tap.controller;

import java.io.IOException;
import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;
import com.tap.util.PasswordUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/login")
public class LoginController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAOImpl userDAO;

    @Override public void init() { userDAO = new UserDAOImpl(); }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.getRequestDispatcher("/login.jsp").forward(request,response);
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        User user = userDAO.getUserByEmail(email);
        if (user != null && user.getPassword().equals(PasswordUtil.hash(password))) {
            HttpSession session = request.getSession();
            session.setAttribute("loggedInUser", user);

            String redirect = request.getParameter("redirect");
            if (redirect != null && !redirect.isBlank() && !redirect.contains("://") && !redirect.contains("login") && !redirect.contains("register")) {
                response.sendRedirect(request.getContextPath() + (redirect.startsWith("/") ? redirect : "/" + redirect));
            } else if ("RESTAURANT".equalsIgnoreCase(user.getRole())) {
                response.sendRedirect(request.getContextPath() + "/restaurant/dashboard");
            } else if ("DELIVERY_PARTNER".equalsIgnoreCase(user.getRole()) || "DELIVERY".equalsIgnoreCase(user.getRole())) {
                response.sendRedirect(request.getContextPath() + "/delivery/dashboard");
            } else {
                response.sendRedirect(request.getContextPath() + "/cart");
            }
        } else {
            request.setAttribute("error", "Invalid email or password.");
            request.getRequestDispatcher("/login.jsp").forward(request, response);
        }
    }
}
