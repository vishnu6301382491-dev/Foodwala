package com.tap.controller;

import java.io.IOException;
import java.util.List;

import com.tap.daoimpl.AddressDAOImpl;
import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.Address;
import com.tap.model.User;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/profile", "/address"})
public class ProfileController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final UserDAOImpl userDAO = new UserDAOImpl();
    private final AddressDAOImpl addressDAO = new AddressDAOImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        // Fetch fresh user and addresses
        User user = userDAO.getUser(loggedInUser.getUserId());
        if (user != null) {
            session.setAttribute("loggedInUser", user);
        } else {
            user = loggedInUser;
        }

        List<Address> addresses = addressDAO.getAddressesByUserId(user.getUserId());
        request.setAttribute("user", user);
        request.setAttribute("addresses", addresses);
        request.getRequestDispatcher("/profile.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpSession session = request.getSession();
        User loggedInUser = (User) session.getAttribute("loggedInUser");
        if (loggedInUser == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        String path = request.getServletPath();
        String action = request.getParameter("action");

        if ("/address".equalsIgnoreCase(path)) {
            if ("add".equalsIgnoreCase(action)) {
                String fullName = request.getParameter("fullName");
                String phone = request.getParameter("phone");
                String houseNo = request.getParameter("houseNo");
                String street = request.getParameter("street");
                String area = request.getParameter("area");
                String city = request.getParameter("city");
                String state = request.getParameter("state");
                String pincode = request.getParameter("pincode");
                String addressType = request.getParameter("addressType");
                boolean isDefault = request.getParameter("isDefault") != null;

                String formatted = String.format("%s, %s, %s, %s, %s - %s",
                    (houseNo != null ? houseNo : ""),
                    (street != null ? street : ""),
                    (area != null ? area : ""),
                    (city != null ? city : "Bengaluru"),
                    (state != null ? state : "Karnataka"),
                    (pincode != null ? pincode : "")
                ).replaceAll(", ,", ",").trim();

                Address a = new Address(0, loggedInUser.getUserId(), fullName, phone, houseNo, street, area,
                                        city, state, pincode, null, null, formatted, addressType, isDefault, null);
                addressDAO.addAddress(a);

            } else if ("edit".equalsIgnoreCase(action)) {
                try {
                    int addressId = Integer.parseInt(request.getParameter("addressId"));
                    String fullName = request.getParameter("fullName");
                    String phone = request.getParameter("phone");
                    String houseNo = request.getParameter("houseNo");
                    String street = request.getParameter("street");
                    String area = request.getParameter("area");
                    String city = request.getParameter("city");
                    String state = request.getParameter("state");
                    String pincode = request.getParameter("pincode");
                    String addressType = request.getParameter("addressType");
                    boolean isDefault = request.getParameter("isDefault") != null;

                    String formatted = String.format("%s, %s, %s, %s, %s - %s",
                        (houseNo != null ? houseNo : ""),
                        (street != null ? street : ""),
                        (area != null ? area : ""),
                        (city != null ? city : "Bengaluru"),
                        (state != null ? state : "Karnataka"),
                        (pincode != null ? pincode : "")
                    ).replaceAll(", ,", ",").trim();

                    Address a = new Address(addressId, loggedInUser.getUserId(), fullName, phone, houseNo, street, area,
                                            city, state, pincode, null, null, formatted, addressType, isDefault, null);
                    addressDAO.updateAddress(a);
                } catch (Exception e) {
                    e.printStackTrace();
                }

            } else if ("delete".equalsIgnoreCase(action)) {
                try {
                    int addressId = Integer.parseInt(request.getParameter("addressId"));
                    addressDAO.deleteAddress(addressId, loggedInUser.getUserId());
                } catch (Exception e) {
                    e.printStackTrace();
                }

            } else if ("setDefault".equalsIgnoreCase(action)) {
                try {
                    int addressId = Integer.parseInt(request.getParameter("addressId"));
                    addressDAO.setDefaultAddress(addressId, loggedInUser.getUserId());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            response.sendRedirect(request.getContextPath() + "/profile?tab=addresses");
            return;
        }

        // Profile update
        String username = request.getParameter("username");
        String email = request.getParameter("email");
        String phone = request.getParameter("phone");

        if (username != null && !username.isBlank()) loggedInUser.setUsername(username.trim());
        if (email != null && !email.isBlank()) loggedInUser.setEmail(email.trim());
        if (phone != null) loggedInUser.setPhone(phone.trim());

        userDAO.updateUser(loggedInUser);
        session.setAttribute("loggedInUser", loggedInUser);

        response.sendRedirect(request.getContextPath() + "/profile?success=1");
    }
}
