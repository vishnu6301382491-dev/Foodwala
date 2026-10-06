package com.tap.test;

import java.util.List;
import java.util.Set;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Menu;
import com.tap.model.Restaurant;
import com.tap.util.FoodAliasDictionary;

public class FoodWalaFullSystemVerification {

    public static void main(String[] args) {
        System.out.println("===============================================================");
        System.out.println("     FOODWALA SMART FOOD SEARCH SYSTEM VERIFICATION           ");
        System.out.println("===============================================================\n");

        RestaurantDAOImpl dao = new RestaurantDAOImpl();
        double userLat = 12.9416; // Basavanagudi
        double userLng = 77.5750;

        int passed = 0;
        int total = 0;

        String[] testQueries = {
            "biriyani",
            "dumbiriyani",
            "chiken biryani",
            "dhosa",
            "masala dosa",
            "panner",
            "paneer butter masala",
            "shawarma",
            "chikn",
            "south indian",
            "north indian"
        };

        for (String q : testQueries) {
            total++;
            System.out.println("-----------------------------------------------------------------");
            System.out.println("TEST CASE #" + total + ": Query = '" + q + "'");
            
            // 1. Check alias resolution
            Set<String> tokens = FoodAliasDictionary.getSearchTokensAndAliases(q);
            String didYouMean = FoodAliasDictionary.getClosestCanonical(q);
            System.out.println("  -> Resolved Tokens & Aliases: " + tokens);
            if (didYouMean != null) {
                System.out.println("  -> Did You Mean: '" + didYouMean + "'");
            }

            // 2. Query DAO
            List<Restaurant> results = dao.getRestaurants(
                q, null, null, "distance", null, null, null, false, null, userLat, userLng, 1, 10
            );

            System.out.println("  -> Returned " + results.size() + " Restaurants");
            if (!results.isEmpty()) {
                passed++;
                Restaurant top = results.get(0);
                System.out.println("  -> #1 Result: " + top.getName() + " (" + top.getCuisineType() + ", " + top.getArea() + ")");
                if (top.getMatchedMenuItems() != null && !top.getMatchedMenuItems().isEmpty()) {
                    System.out.println("     Matched Dishes: ");
                    for (Menu m : top.getMatchedMenuItems()) {
                        System.out.println("       * " + m.getItemName() + " (₹" + Math.round(m.getPrice()) + ", " + (m.isVeg() ? "Veg" : "Non-Veg") + ")");
                    }
                }
                System.out.println("  [PASS] Successfully retrieved relevant restaurants and dishes.");
            } else {
                System.out.println("  [FAIL] No restaurants found.");
            }
        }

        // Test 12: Pure Veg + Filter
        total++;
        System.out.println("\n-----------------------------------------------------------------");
        System.out.println("TEST CASE #" + total + ": Pure Veg Filter");
        List<Restaurant> vegResults = dao.getRestaurants(
            null, null, null, "distance", "veg", null, null, false, null, userLat, userLng, 1, 10
        );
        if (!vegResults.isEmpty()) {
            passed++;
            System.out.println("  -> Returned " + vegResults.size() + " Pure Veg restaurants. Top: " + vegResults.get(0).getName());
            System.out.println("  [PASS] Pure Veg filter works.");
        } else {
            System.out.println("  [FAIL] Pure veg returned 0.");
        }

        // Test 13: Under 30 Mins Filter
        total++;
        System.out.println("\n-----------------------------------------------------------------");
        System.out.println("TEST CASE #" + total + ": Under 30 Mins Filter");
        List<Restaurant> fastResults = dao.getRestaurants(
            null, null, null, "deliveryTime", null, null, 30, false, null, userLat, userLng, 1, 10
        );
        if (!fastResults.isEmpty()) {
            passed++;
            System.out.println("  -> Returned " + fastResults.size() + " fast delivery restaurants. Top: " + fastResults.get(0).getName() + " (" + fastResults.get(0).getDeliveryTime() + " mins)");
            System.out.println("  [PASS] Fast delivery filter works.");
        } else {
            System.out.println("  [FAIL] Fast delivery returned 0.");
        }

        // Test 14: Distance Sorting from Basavanagudi
        total++;
        System.out.println("\n-----------------------------------------------------------------");
        System.out.println("TEST CASE #" + total + ": Distance Sorting from Basavanagudi");
        List<Restaurant> distResults = dao.getRestaurants(
            null, null, null, "distance", null, null, null, false, null, userLat, userLng, 1, 10
        );
        if (!distResults.isEmpty() && distResults.get(0).getDistanceKm() <= distResults.get(distResults.size() - 1).getDistanceKm()) {
            passed++;
            System.out.println("  -> Top nearest: " + distResults.get(0).getName() + " (" + String.format("%.2f", distResults.get(0).getDistanceKm()) + " km)");
            System.out.println("  [PASS] Distance sorting accurate.");
        } else {
            System.out.println("  [FAIL] Distance sorting incorrect.");
        }

        // Test 15: Autocomplete prefix suggestions
        total++;
        System.out.println("\n-----------------------------------------------------------------");
        System.out.println("TEST CASE #" + total + ": Autocomplete Prefix Suggestions for 'biri', 'dos', 'pan'");
        List<String> biriSuggestions = FoodAliasDictionary.getFoodSuggestions("biri", 5);
        List<String> dosSuggestions = FoodAliasDictionary.getFoodSuggestions("dos", 5);
        List<String> panSuggestions = FoodAliasDictionary.getFoodSuggestions("pan", 5);
        if (!biriSuggestions.isEmpty() && !dosSuggestions.isEmpty() && !panSuggestions.isEmpty()) {
            passed++;
            System.out.println("  -> 'biri' -> " + biriSuggestions);
            System.out.println("  -> 'dos' -> " + dosSuggestions);
            System.out.println("  -> 'pan' -> " + panSuggestions);
            System.out.println("  [PASS] Autocomplete suggestions generated successfully.");
        } else {
            System.out.println("  [FAIL] Autocomplete suggestions empty.");
        }

        // Test 16: Typo fuzzy suggestions
        total++;
        System.out.println("\n-----------------------------------------------------------------");
        System.out.println("TEST CASE #" + total + ": Typo Did You Mean Suggestions");
        String dym1 = FoodAliasDictionary.getClosestCanonical("dumbiriyani");
        String dym2 = FoodAliasDictionary.getClosestCanonical("dhosa");
        String dym3 = FoodAliasDictionary.getClosestCanonical("chikn");
        if (dym1 != null && dym2 != null && dym3 != null) {
            passed++;
            System.out.println("  -> 'dumbiriyani' -> Did you mean: " + dym1);
            System.out.println("  -> 'dhosa' -> Did you mean: " + dym2);
            System.out.println("  -> 'chikn' -> Did you mean: " + dym3);
            System.out.println("  [PASS] Typo tolerance and Did You Mean recommendations working.");
        } else {
            System.out.println("  [FAIL] Typo recommendations missing.");
        }

        System.out.println("\n===============================================================");
        System.out.println("             SUMMARY: " + passed + " / " + total + " TEST CASES PASSED");
        System.out.println("===============================================================");
    }
}
