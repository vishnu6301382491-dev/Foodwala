package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.tap.dao.RestaurantDAO;
import com.tap.model.Menu;
import com.tap.model.Restaurant;
import com.tap.util.DBConnection;
import com.tap.util.FoodAliasDictionary;
import com.tap.util.FuzzySearchUtil;
import com.tap.util.LocationUtil;

public class RestaurantDAOImpl implements RestaurantDAO {

    @Override
    public List<Restaurant> getAllRestaurants() {
        List<Restaurant> list = new ArrayList<>();
        String sql = "SELECT * FROM restaurant WHERE is_active=TRUE ORDER BY rating DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                list.add(map(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Restaurant getRestaurantById(int restaurantId) {
        String sql = "SELECT * FROM restaurant WHERE restaurant_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Restaurant getRestaurantByAdminUserId(int adminUserId) {
        String sql = "SELECT * FROM restaurant WHERE admin_user_id = ? LIMIT 1";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, adminUserId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Restaurant> getRestaurantsNearby(double userLat, double userLng) {
        List<Restaurant> list = getAllRestaurants();
        for (Restaurant r : list) {
            double distance = LocationUtil.calculateDistanceKm(userLat, userLng, r.getLatitude(), r.getLongitude());
            r.setDistanceKm(distance);
        }
        // Sort ascending by distance: closest first
        Collections.sort(list, Comparator.comparingDouble(Restaurant::getDistanceKm));
        return list;
    }

    @Override
    public List<Restaurant> getFilteredRestaurants(
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
    ) {
        List<Restaurant> list = fetchFilteredList(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, sortBy, userLat, userLng);
        
        if (size <= 0) size = 12;
        if (page <= 0) page = 1;
        
        int fromIndex = (page - 1) * size;
        if (fromIndex >= list.size()) {
            return new ArrayList<>();
        }
        int toIndex = Math.min(fromIndex + size, list.size());
        return list.subList(fromIndex, toIndex);
    }

    @Override
    public List<Restaurant> getRestaurants(
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
    ) {
        Boolean vegOnly = (diet != null && (diet.equalsIgnoreCase("veg") || diet.equalsIgnoreCase("true") || diet.equalsIgnoreCase("pure_veg") || diet.equalsIgnoreCase("pure veg")));
        return getFilteredRestaurants(search, cuisine, area, minRating, vegOnly ? true : null, maxDeliveryTime, maxDistance, openOnly, sortBy, userLat, userLng, page, size);
    }

    @Override
    public int countFilteredRestaurants(
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
    ) {
        List<Restaurant> list = fetchFilteredList(search, cuisine, area, minRating, vegOnly, maxDeliveryTime, maxDistance, openOnly, null, userLat, userLng);
        return list.size();
    }

    private List<Restaurant> fetchFilteredList(
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
        Double userLng
    ) {
        List<Restaurant> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT DISTINCT r.* FROM restaurant r WHERE r.is_active=TRUE");
        List<Object> params = new ArrayList<>();
        Set<String> searchTerms = (search != null && !search.trim().isEmpty()) 
            ? FoodAliasDictionary.getSearchTokensAndAliases(search) 
            : Collections.emptySet();

        if (!searchTerms.isEmpty()) {
            sql.append(" AND (");
            int t = 0;
            for (String term : searchTerms) {
                if (t > 0) sql.append(" OR ");
                String q = "%" + term + "%";
                sql.append("(r.name LIKE ? OR r.cuisine_type LIKE ? OR r.address LIKE ? OR r.area LIKE ? OR r.description LIKE ? ");
                sql.append(" OR r.restaurant_id IN (SELECT m.restaurant_id FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id WHERE m.item_name LIKE ? OR m.description LIKE ? OR m.category_name LIKE ? OR c.name LIKE ?))");
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                params.add(q);
                t++;
            }
            sql.append(")");
        }

        if (cuisine != null && !cuisine.trim().isEmpty() && !cuisine.equalsIgnoreCase("all")) {
            sql.append(" AND r.cuisine_type LIKE ?");
            params.add("%" + cuisine.trim() + "%");
        }

        if (area != null && !area.trim().isEmpty() && !area.equalsIgnoreCase("all")) {
            sql.append(" AND (r.area LIKE ? OR r.address LIKE ?)");
            params.add("%" + area.trim() + "%");
            params.add("%" + area.trim() + "%");
        }

        if (minRating != null && minRating > 0) {
            sql.append(" AND r.rating >= ?");
            params.add(minRating);
        }

        if (openOnly != null && openOnly) {
            sql.append(" AND r.is_open = TRUE");
        }

        if (maxDeliveryTime != null && maxDeliveryTime > 0) {
            sql.append(" AND r.delivery_time <= ?");
            params.add(maxDeliveryTime);
        }

        if (vegOnly != null && vegOnly) {
            sql.append(" AND (r.cuisine_type LIKE '%Veg%' OR r.restaurant_id IN (SELECT m.restaurant_id FROM menu m WHERE m.is_veg = TRUE))");
        }

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Apply Geolocation Haversine Distance if coordinates exist
        double effectiveLat = (userLat != null && userLat != 0.0) ? userLat : 12.9416; // Default to Bengaluru Basavanagudi
        double effectiveLng = (userLng != null && userLng != 0.0) ? userLng : 77.5750;

        for (Restaurant r : list) {
            double dist = LocationUtil.calculateDistanceKm(effectiveLat, effectiveLng, r.getLatitude(), r.getLongitude());
            r.setDistanceKm(dist);
        }

        // Distance max filter
        if (maxDistance != null && maxDistance > 0) {
            list = list.stream().filter(r -> r.getDistanceKm() <= maxDistance).collect(Collectors.toList());
        }

        // Attach matched menu items for food search
        if (!searchTerms.isEmpty() && !list.isEmpty()) {
            attachMatchedMenuItems(list, searchTerms);
        }

        // Apply sorting (Relevance for search, or user-selected sort)
        if (sortBy != null && !sortBy.equalsIgnoreCase("distance") && !sortBy.equalsIgnoreCase("relevance") && !sortBy.equalsIgnoreCase("default")) {
            String s = sortBy.trim().toLowerCase();
            if (s.equals("rating") || s.equals("rating_desc")) {
                list.sort(Comparator.comparingDouble(Restaurant::getRating).reversed());
            } else if (s.equals("deliverytime") || s.equals("delivery_time") || s.equals("delivery_time_asc")) {
                list.sort(Comparator.comparingInt(Restaurant::getDeliveryTime));
            } else if (s.equals("popularity") || s.equals("popular")) {
                list.sort(Comparator.comparing(Restaurant::isPopular).reversed()
                    .thenComparing(Comparator.comparingDouble(Restaurant::getRating).reversed())
                    .thenComparing(Comparator.comparingInt(Restaurant::getReviewCount).reversed()));
            } else if (s.equals("name") || s.equals("name_asc")) {
                list.sort((r1, r2) -> String.CASE_INSENSITIVE_ORDER.compare(r1.getName(), r2.getName()));
            } else {
                list.sort(Comparator.comparingDouble(Restaurant::getDistanceKm));
            }
        } else if (!searchTerms.isEmpty()) {
            // When search query is active, sort by calculated relevance score (exact food matches > rest names > distance)
            list.sort((r1, r2) -> Double.compare(
                calculateRelevanceScore(r2, search, searchTerms),
                calculateRelevanceScore(r1, search, searchTerms)
            ));
        } else {
            // Default sort: Closest distance
            list.sort(Comparator.comparingDouble(Restaurant::getDistanceKm));
        }

        return list;
    }

    private void attachMatchedMenuItems(List<Restaurant> list, Set<String> searchTerms) {
        if (list == null || list.isEmpty() || searchTerms == null || searchTerms.isEmpty()) return;

        Map<Integer, Restaurant> map = new HashMap<>();
        for (Restaurant r : list) {
            map.put(r.getRestaurantId(), r);
        }

        StringBuilder sql = new StringBuilder("SELECT m.* FROM menu m WHERE m.is_available=TRUE AND m.restaurant_id IN (");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sql.append(",");
            sql.append(list.get(i).getRestaurantId());
        }
        sql.append(") AND (");

        List<String> termsList = new ArrayList<>(searchTerms);
        List<Object> params = new ArrayList<>();
        for (int i = 0; i < termsList.size(); i++) {
            if (i > 0) sql.append(" OR ");
            sql.append("m.item_name LIKE ? OR m.description LIKE ? OR m.category_name LIKE ?");
            String q = "%" + termsList.get(i) + "%";
            params.add(q);
            params.add(q);
            params.add(q);
        }
        sql.append(") ORDER BY m.rating DESC, m.is_popular DESC");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int restId = rs.getInt("restaurant_id");
                    Restaurant r = map.get(restId);
                    if (r != null && r.getMatchedMenuItems().size() < 3) {
                        Menu m = new Menu();
                        m.setMenuId(rs.getInt("menu_id"));
                        m.setRestaurantId(restId);
                        m.setItemName(rs.getString("item_name"));
                        m.setDescription(rs.getString("description"));
                        m.setPrice(rs.getDouble("price"));
                        m.setRating(rs.getDouble("rating"));
                        m.setAvailable(rs.getBoolean("is_available"));
                        m.setImagePath(rs.getString("image_path"));
                        m.setCategoryName(rs.getString("category_name"));
                        m.setVeg(rs.getBoolean("is_veg"));
                        m.setPopular(rs.getBoolean("is_popular"));
                        m.setPreparationTime(rs.getString("preparation_time"));
                        r.addMatchedMenuItem(m);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private double calculateRelevanceScore(Restaurant r, String rawSearch, Set<String> searchTerms) {
        double score = 0.0;
        String normName = FoodAliasDictionary.normalize(r.getName());
        String normCuisine = FoodAliasDictionary.normalize(r.getCuisineType());
        String normArea = FoodAliasDictionary.normalize(r.getArea());

        for (String term : searchTerms) {
            if (normName.equals(term)) score += 150.0;
            else if (normName.contains(term)) score += 80.0;

            if (normCuisine.contains(term)) score += 40.0;
            if (normArea != null && normArea.contains(term)) score += 30.0;
        }

        // Matched dish score
        if (r.getMatchedMenuItems() != null && !r.getMatchedMenuItems().isEmpty()) {
            score += 100.0 * r.getMatchedMenuItems().size();
            for (Menu m : r.getMatchedMenuItems()) {
                String normItem = FoodAliasDictionary.normalize(m.getItemName());
                for (String term : searchTerms) {
                    if (normItem.equals(term)) score += 80.0;
                    else if (normItem.contains(term)) score += 40.0;
                }
            }
        }

        // Proximity and rating contribution
        score += (r.getRating() * 4.0);
        score += Math.max(0.0, 20.0 - r.getDistanceKm());

        return score;
    }

    @Override
    public List<String> getAllCuisines() {
        Set<String> cuisines = new HashSet<>();
        String sql = "SELECT DISTINCT cuisine_type FROM restaurant WHERE is_active=TRUE AND cuisine_type IS NOT NULL";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String c = rs.getString("cuisine_type");
                if (c != null && !c.trim().isEmpty()) {
                    String[] parts = c.split("[,/]");
                    for (String part : parts) {
                        String clean = part.trim();
                        if (!clean.isEmpty()) cuisines.add(clean);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        List<String> list = new ArrayList<>(cuisines);
        Collections.sort(list);
        return list;
    }

    @Override
    public List<String> getAllAreas() {
        List<String> areas = new ArrayList<>();
        String sql = "SELECT DISTINCT area FROM restaurant WHERE is_active=TRUE AND area IS NOT NULL AND area != '' ORDER BY area";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String a = rs.getString("area");
                if (a != null && !a.trim().isEmpty() && !areas.contains(a.trim())) {
                    areas.add(a.trim());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return areas;
    }

    private Restaurant map(ResultSet rs) throws Exception {
        double lat = 12.9716;
        double lng = 77.5946;
        try {
            lat = rs.getDouble("latitude");
            lng = rs.getDouble("longitude");
        } catch (Exception ignored) {}

        String city = "Bengaluru";
        String state = "Karnataka";
        String pincode = "560004";
        String phone = "+91 80 2667 7588";
        String description = "";
        String area = "Basavanagudi";
        int reviewCount = 100;
        double deliveryFee = 35.0;
        double minimumOrder = 100.0;
        boolean isOpen = true;
        String openingTime = "07:00 AM";
        String closingTime = "11:00 PM";
        boolean isPopular = false;

        try {
            if (rs.getString("city") != null) city = rs.getString("city");
            if (rs.getString("state") != null) state = rs.getString("state");
            if (rs.getString("pincode") != null) pincode = rs.getString("pincode");
            if (rs.getString("phone") != null) phone = rs.getString("phone");
            if (rs.getString("description") != null) description = rs.getString("description");
            if (rs.getString("area") != null) area = rs.getString("area");
            reviewCount = rs.getInt("review_count");
            deliveryFee = rs.getDouble("delivery_fee");
            minimumOrder = rs.getDouble("minimum_order");
            isOpen = rs.getBoolean("is_open");
            if (rs.getString("opening_time") != null) openingTime = rs.getString("opening_time");
            if (rs.getString("closing_time") != null) closingTime = rs.getString("closing_time");
            isPopular = rs.getBoolean("is_popular");
        } catch (Exception ignored) {}

        Restaurant r = new Restaurant(
            rs.getInt("restaurant_id"),
            rs.getString("name"),
            rs.getString("cuisine_type"),
            rs.getInt("delivery_time"),
            rs.getString("address"),
            rs.getInt("admin_user_id"),
            rs.getDouble("rating"),
            rs.getBoolean("is_active"),
            rs.getString("image_path"),
            lat,
            lng,
            city,
            state,
            pincode,
            phone
        );
        r.setDescription(description);
        r.setArea(area);
        r.setReviewCount(reviewCount);
        r.setDeliveryFee(deliveryFee);
        r.setMinimumOrder(minimumOrder);
        r.setOpen(isOpen);
        r.setOpeningTime(openingTime);
        r.setClosingTime(closingTime);
        r.setPopular(isPopular);
        return r;
    }
}