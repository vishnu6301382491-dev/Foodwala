package com.tap.model;

import java.io.Serializable;

public class CurrentLocation implements Serializable {
    private static final long serialVersionUID = 1L;
    private double latitude;
    private double longitude;
    private double accuracy;
    private String formattedAddress;
    private String city;
    private String state;
    private String pincode;
    private long timestamp;

    public CurrentLocation() {
        this.city = "Bengaluru";
        this.state = "Karnataka";
        this.pincode = "560004";
        this.timestamp = System.currentTimeMillis();
    }

    public CurrentLocation(double latitude, double longitude, double accuracy,
                           String formattedAddress, String city, String state, String pincode) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracy = accuracy;
        this.formattedAddress = formattedAddress;
        this.city = city != null ? city : "Bengaluru";
        this.state = state != null ? state : "Karnataka";
        this.pincode = pincode != null ? pincode : "560004";
        this.timestamp = System.currentTimeMillis();
    }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public double getAccuracy() { return accuracy; }
    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }
    public String getFormattedAddress() { return formattedAddress; }
    public void setFormattedAddress(String formattedAddress) { this.formattedAddress = formattedAddress; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
