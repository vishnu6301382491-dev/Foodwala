package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.OrderItemDAO;
import com.tap.model.OrderItem;
import com.tap.util.DBConnection;

public class OrderItemDAOImpl implements OrderItemDAO {

    private static final String INSERT_QUERY = 
        "INSERT INTO order_item (order_id, menu_id, item_name, quantity, price_at_order, total_price, item_total) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)";
    private static final String GET_BY_ORDER_QUERY = 
        "SELECT oi.*, " +
        "       COALESCE(NULLIF(oi.item_name, ''), m.item_name, CONCAT('Item #', oi.menu_id)) AS resolved_item_name, " +
        "       COALESCE(NULLIF(oi.price_at_order, 0), m.price, CASE WHEN oi.quantity > 0 THEN oi.total_price / oi.quantity ELSE 0 END) AS resolved_price " +
        "FROM order_item oi " +
        "LEFT JOIN menu m ON oi.menu_id = m.menu_id " +
        "WHERE oi.order_id=? ORDER BY oi.order_item_id";

    @Override
    public int addOrderItem(OrderItem i) {
        try (Connection c = DBConnection.getConnection()) {
            return addOrderItem(c, i);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    public int addOrderItem(Connection c, OrderItem i) throws Exception {
        try (PreparedStatement ps = c.prepareStatement(INSERT_QUERY)) {
            ps.setInt(1, i.getOrderId());
            ps.setInt(2, i.getMenuId());
            ps.setString(3, i.getItemName() != null ? i.getItemName() : ("Item #" + i.getMenuId()));
            ps.setInt(4, i.getQuantity());
            ps.setDouble(5, i.getPriceAtOrder());
            ps.setDouble(6, i.getTotalPrice());
            ps.setDouble(7, i.getTotalPrice());
            return ps.executeUpdate();
        }
    }

    @Override
    public List<OrderItem> getOrderItemsByOrderId(int orderId) {
        List<OrderItem> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_BY_ORDER_QUERY)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    double price = 0.0;
                    try {
                        price = rs.getDouble("total_price");
                        if (price == 0.0) {
                            price = rs.getDouble("item_total");
                        }
                    } catch (Exception ex) {
                        try { price = rs.getDouble("item_total"); } catch (Exception ignored) {}
                    }

                    String itemName = rs.getString("resolved_item_name");
                    double priceAtOrder = rs.getDouble("resolved_price");

                    list.add(new OrderItem(
                        rs.getInt("order_item_id"),
                        rs.getInt("order_id"),
                        rs.getInt("menu_id"),
                        itemName,
                        rs.getInt("quantity"),
                        priceAtOrder,
                        price
                    ));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}
