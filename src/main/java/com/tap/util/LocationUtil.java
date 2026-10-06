package com.tap.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class LocationUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
     * Returns distance in kilometers rounded to 1 decimal place.
     */
    public static double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        if (lat1 == 0.0 && lon1 == 0.0 || lat2 == 0.0 && lon2 == 0.0) {
            return 1.5; // fallback average distance
        }

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;

        BigDecimal bd = BigDecimal.valueOf(distance).setScale(1, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    /**
     * Configurable delivery fee calculation based on real distance and cart total.
     * Rule: Free delivery for orders >= Rs. 500
     * Tier 1: 0 - 2 km  -> Rs. 30
     * Tier 2: 2 - 5 km  -> Rs. 45
     * Tier 3: 5+ km     -> Rs. 60 + Rs. 10/km for every km over 5km
     */
    public static double calculateDeliveryFee(double distanceKm, double itemTotal) {
        if (itemTotal >= 500.0) {
            return 0.0;
        }

        if (distanceKm <= 2.0) {
            return 30.0;
        } else if (distanceKm <= 5.0) {
            return 45.0;
        } else {
            double extraKm = Math.ceil(distanceKm - 5.0);
            return 60.0 + (extraKm * 10.0);
        }
    }

    /**
     * Estimates delivery duration in minutes based on food preparation + transit distance.
     */
    public static String getEstimatedTime(double distanceKm) {
        int basePrepMinutes = 20;
        int transitMinutes = (int) Math.round(distanceKm * 4.0); // approx 4 mins per km in city traffic
        int totalMin = basePrepMinutes + transitMinutes;
        int minRange = Math.max(20, totalMin - 5);
        int maxRange = totalMin + 5;
        return minRange + "-" + maxRange + " mins";
    }

    /**
     * Fallback reverse geocoding for Bengaluru regions when external service is offline or blocked.
     */
    public static String resolveLocalArea(double lat, double lng) {
        // Basavanagudi area (~12.9416, 77.5750)
        if (Math.abs(lat - 12.9416) < 0.02 && Math.abs(lng - 77.5750) < 0.02) {
            return "Basavanagudi, Bengaluru, Karnataka 560004";
        }
        // Malleshwaram area (~13.0031, 77.5714)
        if (Math.abs(lat - 13.0031) < 0.02 && Math.abs(lng - 77.5714) < 0.02) {
            return "Malleshwaram, Bengaluru, Karnataka 560003";
        }
        // Jayanagar area (~12.9298, 77.5834)
        if (Math.abs(lat - 12.9298) < 0.02 && Math.abs(lng - 77.5834) < 0.02) {
            return "Jayanagar, Bengaluru, Karnataka 560011";
        }
        // Koramangala area (~12.9343, 77.6186)
        if (Math.abs(lat - 12.9343) < 0.02 && Math.abs(lng - 77.6186) < 0.02) {
            return "Koramangala, Bengaluru, Karnataka 560034";
        }
        // Indiranagar area (~12.9784, 77.6408)
        if (Math.abs(lat - 12.9784) < 0.02 && Math.abs(lng - 77.6408) < 0.02) {
            return "Indiranagar, Bengaluru, Karnataka 560038";
        }

        return "Bengaluru, Karnataka, India";
    }
}
