package com.tap.controller;

import java.io.IOException;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/cart")
public class CartController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        Cart cart = (Cart) session.getAttribute("cart");

        if (cart == null) {
            cart = new Cart();
            session.setAttribute("cart", cart);
        }

        request.getRequestDispatcher("/cart.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        Cart cart = (Cart) session.getAttribute("cart");
        if (cart == null) {
            cart = new Cart();
            session.setAttribute("cart", cart);
        }

        String action = request.getParameter("action");
        String itemIdStr = request.getParameter("itemId");
        int targetItemId = 0;

        try {
            if ("add".equalsIgnoreCase(action)) {
                String restIdStr = request.getParameter("restaurantId");
                String priceStr = request.getParameter("price");
                String qtyStr = request.getParameter("quantity");
                String name = request.getParameter("name");

                // Validate before parsing to prevent NumberFormatException
                if (itemIdStr != null && !itemIdStr.trim().isEmpty()) {
                    int itemId = Integer.parseInt(itemIdStr.trim());
                    targetItemId = itemId;
                    int restaurantId = (restIdStr != null && !restIdStr.trim().isEmpty()) 
                                        ? Integer.parseInt(restIdStr.trim()) : 1;
                    double price = (priceStr != null && !priceStr.trim().isEmpty()) 
                                    ? Double.parseDouble(priceStr.trim()) : 0.0;
                    int quantity = (qtyStr != null && !qtyStr.trim().isEmpty()) 
                                    ? Integer.parseInt(qtyStr.trim()) : 1;

                    if (name == null || name.trim().isEmpty()) {
                        name = "Item #" + itemId;
                    }

                    // Reset cart if adding from a different restaurant
                    Integer currentRestId = (Integer) session.getAttribute("cartRestaurantId");
                    if (currentRestId != null && currentRestId != restaurantId) {
                        cart.clear();
                    }
                    session.setAttribute("cartRestaurantId", restaurantId);

                    CartItem item = new CartItem(itemId, restaurantId, name, price, quantity, price * quantity);
                    cart.addItem(item);
                }

            } else if ("update".equalsIgnoreCase(action)) {
                String qtyStr = request.getParameter("quantity");
                if (itemIdStr != null && qtyStr != null) {
                    int itemId = Integer.parseInt(itemIdStr.trim());
                    targetItemId = itemId;
                    int quantity = Integer.parseInt(qtyStr.trim());
                    cart.updateItem(itemId, quantity);
                }

            } else if ("remove".equalsIgnoreCase(action)) {
                if (itemIdStr != null) {
                    int itemId = Integer.parseInt(itemIdStr.trim());
                    targetItemId = itemId;
                    cart.removeItem(itemId);
                }

            } else if ("clear".equalsIgnoreCase(action)) {
                cart.clear();
                session.removeAttribute("cartRestaurantId");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (cart.isEmpty()) {
            session.removeAttribute("cartRestaurantId");
        }

        session.setAttribute("cart", cart);

        String format = request.getParameter("format");
        String acceptHeader = request.getHeader("Accept");
        boolean isJson = "json".equalsIgnoreCase(format) || 
                         (acceptHeader != null && acceptHeader.contains("application/json"));

        if (isJson) {
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            int currentQty = targetItemId > 0 ? cart.getQuantity(targetItemId) : 0;
            int cartCount = cart.getItemCount();
            double cartTotal = cart.getTotalAmount();
            String json = String.format(java.util.Locale.US,
                "{\"status\":\"success\",\"itemId\":%d,\"quantity\":%d,\"cartCount\":%d,\"cartTotal\":%.2f}",
                targetItemId,
                currentQty,
                cartCount,
                cartTotal
            );
            response.getWriter().write(json);
            return;
        }

        String redirect = request.getParameter("redirect");
        String restIdStr = request.getParameter("restaurantId");
        if ("menu".equalsIgnoreCase(redirect) && restIdStr != null && !restIdStr.isBlank()) {
            if ("add".equalsIgnoreCase(action)) {
                response.sendRedirect(request.getContextPath() + "/menu?restaurantId=" + restIdStr + "&added=1");
            } else {
                response.sendRedirect(request.getContextPath() + "/menu?restaurantId=" + restIdStr);
            }
        } else {
            response.sendRedirect(request.getContextPath() + "/cart");
        }
    }
}