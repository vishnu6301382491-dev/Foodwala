package com.tap.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class DeliveryPartner implements Serializable {
    private static final long serialVersionUID = 1L;
    private int partnerId;
    private int userId;
    private String name;
    private String phone;
    private String vehicleNumber;
    private double currentLat;
    private double currentLng;
    private double accuracy;
    private boolean available;
    private String vehicleType = "Hero Electric Scooter";
    private String profileImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";
    private double rating = 4.8;
    private String status = "AVAILABLE";
    private Timestamp lastLocationUpdate;

    public DeliveryPartner() {}

    public DeliveryPartner(int partnerId, int userId, String name, String phone, String vehicleNumber,
                           double currentLat, double currentLng, double accuracy, boolean available,
                           Timestamp lastLocationUpdate) {
        this.partnerId = partnerId;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.vehicleNumber = vehicleNumber;
        this.currentLat = currentLat;
        this.currentLng = currentLng;
        this.accuracy = accuracy;
        this.available = available;
        this.lastLocationUpdate = lastLocationUpdate;
    }

    public DeliveryPartner(int partnerId, int userId, String name, String phone, String vehicleNumber,
                           String vehicleType, String profileImage, double rating, String status,
                           double currentLat, double currentLng, double accuracy, boolean available,
                           Timestamp lastLocationUpdate) {
        this.partnerId = partnerId;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.vehicleNumber = vehicleNumber;
        this.vehicleType = vehicleType;
        this.profileImage = profileImage;
        this.rating = rating;
        this.status = status;
        this.currentLat = currentLat;
        this.currentLng = currentLng;
        this.accuracy = accuracy;
        this.available = available;
        this.lastLocationUpdate = lastLocationUpdate;
    }

    public int getPartnerId() { return partnerId; }
    public void setPartnerId(int partnerId) { this.partnerId = partnerId; }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getCurrentLat() { return currentLat; }
    public void setCurrentLat(double currentLat) { this.currentLat = currentLat; }
    public double getCurrentLng() { return currentLng; }
    public void setCurrentLng(double currentLng) { this.currentLng = currentLng; }
    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public Timestamp getLastLocationUpdate() { return lastLocationUpdate; }
    public void setLastLocationUpdate(Timestamp lastLocationUpdate) { this.lastLocationUpdate = lastLocationUpdate; }
}
