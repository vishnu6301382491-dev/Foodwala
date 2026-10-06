package com.tap.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.RestaurantDAO;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.CurrentLocation;
import com.tap.model.Restaurant;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet({"/restaurants", "/restaurant"})
public class RestaurantController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private RestaurantDAO restaurantDAO;

    @Override
    public void init() {
        restaurantDAO = new RestaurantDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        try {
            HttpSession session = request.getSession();

            // Retrieve or initialize customer current location
            CurrentLocation loc = (CurrentLocation) session.getAttribute("currentLocation");
            if (loc == null) {
                loc = new CurrentLocation(12.9416, 77.5750, 10.0,
                                          "Basavanagudi, Bengaluru, Karnataka 560004",
                                          "Bengaluru", "Karnataka", "560004");
                session.setAttribute("currentLocation", loc);
            }

            String search = request.getParameter("search");
            if (search == null) search = request.getParameter("q");

            String cuisine = request.getParameter("cuisine");
            String area = request.getParameter("area");
            String sort = request.getParameter("sort");
            if (sort == null || sort.trim().isEmpty()) {
                sort = "distance";
            }

            Boolean vegOnly = null;
            String vegParam = request.getParameter("diet");
            if (vegParam == null) vegParam = request.getParameter("veg");
            if (vegParam != null && (vegParam.equalsIgnoreCase("veg") || vegParam.equalsIgnoreCase("true") || vegParam.equals("1"))) {
                vegOnly = true;
            }

            Double minRating = null;
            String ratingParam = request.getParameter("minRating");
            if (ratingParam == null) ratingParam = request.getParameter("rating");
            if (ratingParam != null && !ratingParam.trim().isEmpty()) {
                try { minRating = Double.parseDouble(ratingParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Integer maxDeliveryTime = null;
            String timeParam = request.getParameter("maxDeliveryTime");
            if (timeParam == null) timeParam = request.getParameter("deliveryTime");
            if (timeParam != null && !timeParam.trim().isEmpty()) {
                try { maxDeliveryTime = Integer.parseInt(timeParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Double maxDistance = null;
            String distParam = request.getParameter("maxDistance");
            if (distParam == null) distParam = request.getParameter("distance");
            if (distParam != null && !distParam.trim().isEmpty()) {
                try { maxDistance = Double.parseDouble(distParam.trim()); } catch (NumberFormatException ignored) {}
            }

            Boolean openOnly = null;
            String openParam = request.getParameter("openOnly");
            if (openParam == null) openParam = request.getParameter("isOpen");
            if (openParam != null && (openParam.equalsIgnoreCase("true") || openParam.equals("1"))) {
                openOnly = true;
            }

            int totalCount = restaurantDAO.countFilteredRestaurants(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, loc.getLatitude(), loc.getLongitude());
            List<Restaurant> restaurants = restaurantDAO.getFilteredRestaurants(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, sort, loc.getLatitude(), loc.getLongitude(), 1, 12);

            request.setAttribute("restaurants", restaurants);
            request.setAttribute("totalCount", totalCount);
            request.setAttribute("currentLocation", loc);
            request.getRequestDispatcher("/restaurant.jsp").forward(request, response);
        } catch (Exception e) {
            e.printStackTrace();
            request.setAttribute("restaurants", new ArrayList<Restaurant>());
            request.setAttribute("totalCount", 0);
            request.getRequestDispatcher("/restaurant.jsp").forward(request, response);
        }
    }
}
