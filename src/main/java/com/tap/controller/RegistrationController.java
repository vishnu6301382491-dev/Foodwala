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

@WebServlet("/register")
public class RegistrationController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAOImpl userDAO;

    @Override public void init() { userDAO = new UserDAOImpl(); }

    @Override protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.getRequestDispatcher("/register.jsp").forward(request, response);
    }

    @Override protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String username=request.getParameter("username");
        String password=request.getParameter("password");
        String email=request.getParameter("email");
        String phone=request.getParameter("phone");
        String address=request.getParameter("address");

        if(username==null || password==null || email==null || username.isBlank() || password.isBlank() || email.isBlank()){
            request.setAttribute("error","Username, email and password are required.");
            request.getRequestDispatcher("/register.jsp").forward(request,response); return;
        }
        if(userDAO.getUserByEmail(email.trim())!=null){
            request.setAttribute("error","Email already registered.");
            request.getRequestDispatcher("/register.jsp").forward(request,response); return;
        }
        User user=new User(username.trim(), PasswordUtil.hash(password), email.trim(), phone, address, "CUSTOMER");
        if(userDAO.addUser(user) > 0){response.sendRedirect(request.getContextPath()+"/login?registered=1");}
        else{request.setAttribute("error","Registration failed.");request.getRequestDispatcher("/register.jsp").forward(request,response);}
    }
}
