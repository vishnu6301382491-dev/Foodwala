package com.tap.model;

import java.io.Serializable;

public class OrderItem implements Serializable {
    private static final long serialVersionUID = 1L;
    private int orderItemId;
    private int orderId;
    private int menuId;
    private String itemName;
    private int quantity;
    private double priceAtOrder;
    private double totalPrice;
    private double itemTotal;

    public OrderItem() {}

    public OrderItem(int orderItemId, int orderId, int menuId, int quantity, double totalPrice) {
        this.orderItemId = orderItemId;
        this.orderId = orderId;
        this.menuId = menuId;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
        this.itemTotal = totalPrice;
        this.priceAtOrder = quantity > 0 ? (totalPrice / quantity) : 0.0;
    }

    public OrderItem(int orderItemId, int orderId, int menuId, String itemName,
                     int quantity, double priceAtOrder, double totalPrice) {
        this.orderItemId = orderItemId;
        this.orderId = orderId;
        this.menuId = menuId;
        this.itemName = itemName;
        this.quantity = quantity;
        this.priceAtOrder = priceAtOrder;
        this.totalPrice = totalPrice;
        this.itemTotal = totalPrice;
    }

    public int getOrderItemId() { return orderItemId; }
    public void setOrderItemId(int orderItemId) { this.orderItemId = orderItemId; }
    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }
    public int getMenuId() { return menuId; }
    public void setMenuId(int menuId) { this.menuId = menuId; }
    public int getItemId() { return menuId; }
    public void setItemId(int itemId) { this.menuId = itemId; }
    public int getId() { return orderItemId; }
    public void setId(int id) { this.orderItemId = id; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public double getPriceAtOrder() { return priceAtOrder; }
    public void setPriceAtOrder(double priceAtOrder) { this.priceAtOrder = priceAtOrder; }
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    public double getItemTotal() { return itemTotal; }
    public void setItemTotal(double itemTotal) { this.itemTotal = itemTotal; }
}
