package com.tap.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class Restaurant implements Serializable {
    private static final long serialVersionUID = 1L;
    private int restaurantId;
    private String name;
    private String description;
    private String cuisineType;
    private int deliveryTime;
    private String address;
    private String area;
    private int adminUserId;
    private double rating;
    private int reviewCount;
    private boolean active;
    private boolean open;
    private String openingTime;
    private String closingTime;
    private double deliveryFee;
    private double minimumOrder;
    private String imagePath;
    private double latitude;
    private double longitude;
    private String city;
    private String state;
    private String pincode;
    private String phone;
    private boolean popular;
    private double distanceKm; // Dynamically calculated based on customer location
    private List<Menu> matchedMenuItems = new ArrayList<>();

    public Restaurant() {
        this.city = "Bengaluru";
        this.state = "Karnataka";
        this.pincode = "560004";
        this.active = true;
        this.open = true;
        this.reviewCount = 50;
        this.deliveryFee = 30.0;
        this.minimumOrder = 100.0;
        this.openingTime = "07:00 AM";
        this.closingTime = "11:00 PM";
    }

    public Restaurant(int restaurantId, String name, String cuisineType, int deliveryTime, String address,
                      int adminUserId, double rating, boolean active, String imagePath) {
        this(restaurantId, name, cuisineType, deliveryTime, address, adminUserId, rating, active, imagePath,
             12.9716, 77.5946, "Bengaluru", "Karnataka", "560004", "+91 80 2667 7588");
    }

    public Restaurant(int restaurantId, String name, String cuisineType, int deliveryTime, String address,
                      int adminUserId, double rating, boolean active, String imagePath,
                      double latitude, double longitude, String city, String state, String pincode, String phone) {
        this();
        this.restaurantId = restaurantId;
        this.name = name;
        this.cuisineType = cuisineType;
        this.deliveryTime = deliveryTime;
        this.address = address;
        this.adminUserId = adminUserId;
        this.rating = rating;
        this.active = active;
        this.imagePath = imagePath;
        this.latitude = latitude;
        this.longitude = longitude;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
        this.phone = phone;
    }

    public Restaurant(String name, String cuisineType, int deliveryTime, String address,
                      int adminUserId, double rating, boolean active, String imagePath) {
        this(0, name, cuisineType, deliveryTime, address, adminUserId, rating, active, imagePath);
    }

    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCuisineType() { return cuisineType; }
    public void setCuisineType(String cuisineType) { this.cuisineType = cuisineType; }

    public int getDeliveryTime() { return deliveryTime; }
    public void setDeliveryTime(int deliveryTime) { this.deliveryTime = deliveryTime; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public int getAdminUserId() { return adminUserId; }
    public void setAdminUserId(int adminUserId) { this.adminUserId = adminUserId; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isOpen() { return open; }
    public void setOpen(boolean open) { this.open = open; }

    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }

    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }

    public double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(double deliveryFee) { this.deliveryFee = deliveryFee; }

    public double getMinimumOrder() { return minimumOrder; }
    public void setMinimumOrder(double minimumOrder) { this.minimumOrder = minimumOrder; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isPopular() { return popular; }
    public void setPopular(boolean popular) { this.popular = popular; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public List<Menu> getMatchedMenuItems() { return matchedMenuItems; }
    public void setMatchedMenuItems(List<Menu> matchedMenuItems) { this.matchedMenuItems = matchedMenuItems; }
    public void addMatchedMenuItem(Menu item) {
        if (this.matchedMenuItems == null) this.matchedMenuItems = new ArrayList<>();
        this.matchedMenuItems.add(item);
    }
}
