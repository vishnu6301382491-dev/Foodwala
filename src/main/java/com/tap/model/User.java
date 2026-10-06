package com.tap.model;

import java.io.Serializable;

public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    private int userId;
    private String username;
    private String password;
    private String email;
    private String phone;
    private String address;
    private String role; // CUSTOMER, RESTAURANT, DELIVERY_PARTNER, ADMIN

    public User() {
        this.role = "CUSTOMER";
    }

    public User(int userId, String username, String password, String email, String phone, String address, String role) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.role = (role != null && !role.isBlank()) ? role : "CUSTOMER";
    }

    public User(String username, String password, String email, String phone, String address, String role) {
        this(0, username, password, email, phone, address, role);
    }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getName() { return username; }
    public void setName(String name) { this.username = name; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isCustomer() {
        return "CUSTOMER".equalsIgnoreCase(role);
    }

    public boolean isRestaurant() {
        return "RESTAURANT".equalsIgnoreCase(role) || "RESTAURANT_ADMIN".equalsIgnoreCase(role);
    }

    public boolean isDeliveryPartner() {
        return "DELIVERY_PARTNER".equalsIgnoreCase(role);
    }

    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }
}
