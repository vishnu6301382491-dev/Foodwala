package com.tap.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import com.tap.daoimpl.AddressDAOImpl;
import com.tap.model.Address;
import com.tap.model.CurrentLocation;
import com.tap.model.User;
import com.tap.util.LocationUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/location", "/location/confirm", "/location/reverse"})
public class LocationController extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String path = request.getServletPath();
        if ("/location/reverse".equalsIgnoreCase(path)) {
            handleReverseGeocoding(request, response);
            return;
        }

        HttpSession session = request.getSession();
        CurrentLocation loc = (CurrentLocation) session.getAttribute("currentLocation");
        if (loc == null) {
            // Default to Basavanagudi, Bengaluru
            loc = new CurrentLocation(12.9416, 77.5750, 10.0, 
                                      "Basavanagudi, Bengaluru, Karnataka 560004", 
                                      "Bengaluru", "Karnataka", "560004");
            session.setAttribute("currentLocation", loc);
        }

        String accept = request.getHeader("Accept");
        boolean isAjax = (accept != null && accept.contains("application/json")) 
                      || "XMLHttpRequest".equalsIgnoreCase(request.getHeader("X-Requested-With"));

        // If a browser visited /location/confirm directly expecting HTML, redirect to /restaurants
        if ("/location/confirm".equalsIgnoreCase(path) && !isAjax) {
            String redirect = request.getParameter("redirect");
            String target = (redirect != null && !redirect.trim().isEmpty()) ? redirect.trim() : "/restaurants";
            if (!target.startsWith("/")) target = "/" + target;
            response.sendRedirect(request.getContextPath() + target);
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String json = String.format(java.util.Locale.US,
            "{\"latitude\":%.6f,\"longitude\":%.6f,\"accuracy\":%.1f,\"formattedAddress\":\"%s\",\"city\":\"%s\",\"state\":\"%s\",\"pincode\":\"%s\"}",
            loc.getLatitude(), loc.getLongitude(), loc.getAccuracy(),
            escapeJson(loc.getFormattedAddress()), escapeJson(loc.getCity()),
            escapeJson(loc.getState()), escapeJson(loc.getPincode())
        );
        response.getWriter().write(json);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String path = request.getServletPath();
        HttpSession session = request.getSession();
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if ("/location/reverse".equalsIgnoreCase(path)) {
            handleReverseGeocoding(request, response);
            return;
        }
        // /location/confirm
        String latStr = request.getParameter("latitude");
        String lngStr = request.getParameter("longitude");
        String accStr = request.getParameter("accuracy");
        String address = request.getParameter("formattedAddress");
        String city = request.getParameter("city");
        String state = request.getParameter("state");
        String pincode = request.getParameter("pincode");
        String saveAs = request.getParameter("saveAs"); // "Home", "Work", or null

        double lat = 12.9416;
        double lng = 77.5750;
        double accuracy = 10.0;
        try {
            if (latStr != null) lat = Double.parseDouble(latStr.trim());
            if (lngStr != null) lng = Double.parseDouble(lngStr.trim());
            if (accStr != null) accuracy = Double.parseDouble(accStr.trim());
        } catch (Exception ignored) {}

        if (address == null || address.trim().isEmpty()) {
            address = LocationUtil.resolveLocalArea(lat, lng);
        }
        if (city == null || city.isBlank()) city = "Bengaluru";
        if (state == null || state.isBlank()) state = "Karnataka";
        if (pincode == null || pincode.isBlank()) pincode = "560004";

        CurrentLocation loc = new CurrentLocation(lat, lng, accuracy, address, city, state, pincode);
        session.setAttribute("currentLocation", loc);

        // Optionally save to customer's saved addresses
        User user = (User) session.getAttribute("loggedInUser");
        if (user != null && saveAs != null && !saveAs.isBlank() && !"none".equalsIgnoreCase(saveAs)) {
            try {
                Address a = new Address();
                a.setUserId(user.getUserId());
                a.setFullName(user.getUsername());
                a.setPhone(user.getPhone() != null ? user.getPhone() : "9876543210");
                a.setHouseNo("Detected Location");
                a.setStreet(address);
                a.setArea(city);
                a.setCity(city);
                a.setState(state);
                a.setPincode(pincode);
                a.setLatitude(lat);
                a.setLongitude(lng);
                a.setFormattedAddress(address);
                a.setAddressType(saveAs);
                a.setDefault(false);
                new AddressDAOImpl().addAddress(a);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        String redirect = request.getParameter("redirect");
        String accept = request.getHeader("Accept");
        boolean isAjax = (accept != null && accept.contains("application/json")) 
                      || "XMLHttpRequest".equalsIgnoreCase(request.getHeader("X-Requested-With"));

        if (!isAjax) {
            String target = (redirect != null && !redirect.trim().isEmpty()) ? redirect.trim() : "/restaurants";
            if (!target.startsWith("/")) target = "/" + target;
            response.sendRedirect(request.getContextPath() + target);
            return;
        }

        String json = String.format(java.util.Locale.US,
            "{\"status\":\"success\",\"message\":\"Location confirmed\",\"formattedAddress\":\"%s\",\"latitude\":%.6f,\"longitude\":%.6f}",
            escapeJson(address), lat, lng
        );
        response.getWriter().write(json);
    }

    private void handleReverseGeocoding(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String latStr = request.getParameter("lat") != null ? request.getParameter("lat") : request.getParameter("latitude");
        String lngStr = request.getParameter("lng") != null ? request.getParameter("lng") : request.getParameter("longitude");

        double lat = 12.9416;
        double lng = 77.5750;
        try {
            if (latStr != null) lat = Double.parseDouble(latStr.trim());
            if (lngStr != null) lng = Double.parseDouble(lngStr.trim());
        } catch (Exception ignored) {}

        String formattedAddress = null;
        String city = "Bengaluru";
        String state = "Karnataka";
        String pincode = "560004";

        try {
            String osmUrl = String.format(java.util.Locale.US,
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=%.6f&lon=%.6f&zoom=18&addressdetails=1",
                lat, lng);
            URI uri = URI.create(osmUrl);
            URL url = uri.toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "FoodWala-Delivery-App/1.0");
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);

            if (conn.getResponseCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    String body = sb.toString();

                    int displayIdx = body.indexOf("\"display_name\":\"");
                    if (displayIdx != -1) {
                        int endIdx = body.indexOf("\"", displayIdx + 16);
                        if (endIdx != -1) {
                            formattedAddress = body.substring(displayIdx + 16, endIdx);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        if (formattedAddress == null || formattedAddress.trim().isEmpty()) {
            formattedAddress = LocationUtil.resolveLocalArea(lat, lng);
        }

        if (formattedAddress.contains("560003")) pincode = "560003";
        else if (formattedAddress.contains("560011")) pincode = "560011";
        else if (formattedAddress.contains("560034")) pincode = "560034";
        else if (formattedAddress.contains("560038")) pincode = "560038";

        String json = String.format(java.util.Locale.US,
            "{\"status\":\"success\",\"latitude\":%.6f,\"longitude\":%.6f,\"formattedAddress\":\"%s\",\"city\":\"%s\",\"state\":\"%s\",\"pincode\":\"%s\"}",
            lat, lng, escapeJson(formattedAddress), city, state, pincode
        );
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }

    private static String escapeJson(String s) {
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
