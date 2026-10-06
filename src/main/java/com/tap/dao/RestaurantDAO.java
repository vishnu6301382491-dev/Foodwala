package com.tap.dao;

import java.util.List;
import com.tap.model.Restaurant;

public interface RestaurantDAO {
    List<Restaurant> getAllRestaurants();
    Restaurant getRestaurantById(int restaurantId);
    Restaurant getRestaurantByAdminUserId(int adminUserId);
    List<Restaurant> getRestaurantsNearby(double userLat, double userLng);
    
    List<Restaurant> getFilteredRestaurants(
        String search,
        String cuisine,
        String area,
        Double minRating,
        Boolean vegOnly,
        Integer maxDeliveryTime,
        Double maxDistance,
        Boolean openOnly,
        String sortBy,
        Double userLat,
        Double userLng,
        int page,
        int size
    );

    List<Restaurant> getRestaurants(
        String search,
        String cuisine,
        String area,
        String sortBy,
        String diet,
        Double minRating,
        Integer maxDeliveryTime,
        Boolean openOnly,
        Double maxDistance,
        Double userLat,
        Double userLng,
        int page,
        int size
    );
    
    int countFilteredRestaurants(
        String search,
        String cuisine,
        String area,
        Double minRating,
        Boolean vegOnly,
        Integer maxDeliveryTime,
        Double maxDistance,
        Boolean openOnly,
        Double userLat,
        Double userLng
    );
    
    List<String> getAllCuisines();
    List<String> getAllAreas();
}