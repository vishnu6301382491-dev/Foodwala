package com.tap.model;

import java.io.Serializable;

public class MenuCategory implements Serializable {
    private static final long serialVersionUID = 1L;
    private int categoryId;
    private int restaurantId;
    private String name;
    private String description;
    private int displayOrder;

    public MenuCategory() {}

    public MenuCategory(int categoryId, int restaurantId, String name, String description, int displayOrder) {
        this.categoryId = categoryId;
        this.restaurantId = restaurantId;
        this.name = name;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public int getCategoryId() { return categoryId; }
    public void setCategoryId(int categoryId) { this.categoryId = categoryId; }

    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
