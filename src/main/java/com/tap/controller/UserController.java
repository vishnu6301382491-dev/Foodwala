package com.tap.controller;

import java.io.IOException;
import java.io.PrintWriter;
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

@WebServlet({"/api/users/me", "/api/user/profile"})
public class UserController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final UserDAOImpl userDAO = new UserDAOImpl();
    private final AddressDAOImpl addressDAO = new AddressDAOImpl();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        User sessionUser = (session != null) ? (User) session.getAttribute("loggedInUser") : null;

        if (sessionUser == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"authenticated\":false,\"message\":\"Unauthorized. Please log in.\"}");
            out.flush();
            return;
        }

        // Fetch fresh profile from database to ensure no stale data
        User user = userDAO.getUser(sessionUser.getUserId());
        if (user == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"authenticated\":false,\"message\":\"User record not found.\"}");
            out.flush();
            return;
        }

        // Refresh session
        session.setAttribute("loggedInUser", user);

        // Fetch real saved addresses from database
        Address defaultAddr = addressDAO.getDefaultAddress(user.getUserId());
        List<Address> addresses = addressDAO.getAddressesByUserId(user.getUserId());

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"success\":true,");
        sb.append("\"authenticated\":true,");
        
        // User object
        sb.append("\"user\":{");
        sb.append("\"userId\":").append(user.getUserId()).append(",");
        sb.append("\"username\":\"").append(escape(user.getUsername())).append("\",");
        sb.append("\"name\":\"").append(escape(user.getUsername())).append("\",");
        sb.append("\"email\":\"").append(escape(user.getEmail())).append("\",");
        sb.append("\"phone\":\"").append(escape(user.getPhone())).append("\",");
        sb.append("\"role\":\"").append(escape(user.getRole())).append("\"");
        sb.append("},");

        // Default Address object (if exists)
        if (defaultAddr != null) {
            sb.append("\"defaultAddress\":").append(addressToJson(defaultAddr)).append(",");
        } else {
            sb.append("\"defaultAddress\":null,");
        }

        // Saved Addresses array
        sb.append("\"savedAddresses\":[");
        for (int i = 0; i < addresses.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(addressToJson(addresses.get(i)));
        }
        sb.append("]");

        sb.append("}");

        out.print(sb.toString());
        out.flush();
    }

    private String addressToJson(Address a) {
        if (a == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"addressId\":").append(a.getAddressId()).append(",");
        sb.append("\"fullName\":\"").append(escape(a.getFullName())).append("\",");
        sb.append("\"phone\":\"").append(escape(a.getPhone())).append("\",");
        sb.append("\"houseNo\":\"").append(escape(a.getHouseNo())).append("\",");
        sb.append("\"street\":\"").append(escape(a.getStreet())).append("\",");
        sb.append("\"area\":\"").append(escape(a.getArea())).append("\",");
        sb.append("\"city\":\"").append(escape(a.getCity())).append("\",");
        sb.append("\"state\":\"").append(escape(a.getState())).append("\",");
        sb.append("\"pincode\":\"").append(escape(a.getPincode())).append("\",");
        sb.append("\"landmark\":\"").append(escape(a.getLandmark())).append("\",");
        sb.append("\"formattedAddress\":\"").append(escape(a.getFormattedAddress())).append("\",");
        sb.append("\"addressType\":\"").append(escape(a.getAddressType())).append("\",");
        sb.append("\"isDefault\":").append(a.isDefault()).append(",");
        sb.append("\"latitude\":").append(a.getLatitude() != null ? a.getLatitude() : "null").append(",");
        sb.append("\"longitude\":").append(a.getLongitude() != null ? a.getLongitude() : "null");
        sb.append("}");
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
