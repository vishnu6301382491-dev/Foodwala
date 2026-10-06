package com.tap.model;

import java.io.Serializable;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

public class Cart implements Serializable {
    private static final long serialVersionUID = 1L;

    private Map<Integer, CartItem> items;

    public Cart() {
        this.items = new LinkedHashMap<>();
    }

    public void addItem(CartItem item) {
        if (item == null) return;
        int itemId = item.getItemId();
        if (items.containsKey(itemId)) {
            CartItem existingItem = items.get(itemId);
            existingItem.setQuantity(existingItem.getQuantity() + item.getQuantity());
        } else {
            items.put(itemId, item);
        }
    }

    public void updateItem(int itemId, int quantity) {
        if (items.containsKey(itemId)) {
            if (quantity <= 0) {
                items.remove(itemId);
            } else {
                CartItem item = items.get(itemId);
                if (item != null) {
                    item.setQuantity(quantity);
                }
            }
        }
    }

    public void removeItem(int itemId) {
        items.remove(itemId);
    }

    public void clear() {
        items.clear();
    }

    public boolean isEmpty() {
        return items == null || items.isEmpty();
    }

    public Map<Integer, CartItem> getItems() {
        return items;
    }

    public Collection<CartItem> getCartItems() {
        return items.values();
    }

    public int getItemCount() {
        int count = 0;
        if (items != null) {
            for (CartItem item : items.values()) {
                count += item.getQuantity();
            }
        }
        return count;
    }

    public double getTotalAmount() {
        double total = 0.0;
        if (items != null) {
            for (CartItem item : items.values()) {
                total += item.getTotalPrice();
            }
        }
        return total;
    }

    public CartItem getItem(int itemId) {
        if (items != null) {
            return items.get(itemId);
        }
        return null;
    }

    public int getQuantity(int itemId) {
        if (items != null && items.containsKey(itemId)) {
            CartItem item = items.get(itemId);
            if (item != null) {
                return item.getQuantity();
            }
        }
        return 0;
    }

    public boolean containsItem(int itemId) {
        return items != null && items.containsKey(itemId);
    }
}