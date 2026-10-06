package com.tap.controller;

import java.io.IOException;
import java.util.List;
import com.tap.daoimpl.OrderDAOImpl;
import com.tap.model.Order;
import com.tap.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/orders")
public class MyOrdersController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final OrderDAOImpl orderDAO = new OrderDAOImpl();

    @Override protected void doGet(HttpServletRequest request,HttpServletResponse response)throws ServletException,IOException{
        HttpSession session=request.getSession();
        User user=(User)session.getAttribute("loggedInUser");
        if(user==null){response.sendRedirect(request.getContextPath()+"/login");return;}
        List<Order> orders=orderDAO.getOrdersByUserId(user.getUserId());
        request.setAttribute("orders",orders);
        request.getRequestDispatcher("/orders.jsp").forward(request,response);
    }
}
