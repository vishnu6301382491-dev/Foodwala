package com.tap.controller;

import java.io.IOException;
import com.tap.daoimpl.OrderDAOImpl;
import com.tap.daoimpl.OrderItemDAOImpl;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import java.util.List;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/orderConfirmation")
public class OrderConfirmationController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final OrderDAOImpl orderDAO = new OrderDAOImpl();
    private final OrderItemDAOImpl orderItemDAO = new OrderItemDAOImpl();

    @Override protected void doGet(HttpServletRequest request,HttpServletResponse response)throws ServletException,IOException{
        try{
            int orderId=Integer.parseInt(request.getParameter("orderId"));
            Order order=orderDAO.getOrder(orderId);
            List<OrderItem> items=orderItemDAO.getOrderItemsByOrderId(orderId);
            request.setAttribute("order",order);
            request.setAttribute("orderItems",items);
            request.getRequestDispatcher("/orderConfirmation.jsp").forward(request,response);
        }catch(Exception e){response.sendError(400,"Invalid order ID");}
    }
}
