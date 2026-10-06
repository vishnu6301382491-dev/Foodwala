package com.tap.model;

import java.io.Serializable;

public class Menu implements Serializable {
    private static final long serialVersionUID = 1L;
    private int menuId;
    private int restaurantId;
    private int categoryId;
    private String categoryName;
    private String itemName;
    private String description;
    private double price;
    private double rating;
    private boolean available;
    private boolean veg;
    private boolean popular;
    private String preparationTime;
    private String imagePath;

    public Menu() {
        this.available = true;
        this.veg = true;
        this.rating = 4.5;
        this.preparationTime = "15-20 mins";
    }

    public Menu(int menuId, int restaurantId, String itemName, String description,
                double price, double rating, boolean available, String imagePath) {
        this();
        this.menuId = menuId;
        this.restaurantId = restaurantId;
        this.itemName = itemName;
        this.description = description;
        this.price = price;
        this.rating = rating;
        this.available = available;
        this.imagePath = imagePath;
    }

    public Menu(int menuId, int restaurantId, int categoryId, String categoryName,
                String itemName, String description, double price, double rating,
                boolean available, boolean veg, boolean popular, String preparationTime, String imagePath) {
        this.menuId = menuId;
        this.restaurantId = restaurantId;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.itemName = itemName;
        this.description = description;
        this.price = price;
        this.rating = rating;
        this.available = available;
        this.veg = veg;
        this.popular = popular;
        this.preparationTime = preparationTime;
        this.imagePath = imagePath;
    }

    public int getMenuId() { return menuId; }
    public void setMenuId(int menuId) { this.menuId = menuId; }

    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }

    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public boolean isVeg() { return veg; }
    public void setVeg(boolean veg) { this.veg = veg; }

    public boolean isPopular() { return popular; }
    public void setPopular(boolean popular) { this.popular = popular; }

    public String getPreparationTime() { return preparationTime; }
    public void setPreparationTime(String preparationTime) { this.preparationTime = preparationTime; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }
}
