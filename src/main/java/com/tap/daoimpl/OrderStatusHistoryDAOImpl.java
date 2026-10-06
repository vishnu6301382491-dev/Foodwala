package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.OrderStatusHistoryDAO;
import com.tap.model.OrderStatusHistory;
import com.tap.util.DBConnection;

public class OrderStatusHistoryDAOImpl implements OrderStatusHistoryDAO {

    private static final String INSERT_SQL = 
        "INSERT INTO order_status_history (order_id, status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?)";
    private static final String GET_BY_ORDER_SQL = 
        "SELECT * FROM order_status_history WHERE order_id=? ORDER BY timestamp ASC, history_id ASC";

    @Override
    public int addHistory(OrderStatusHistory h) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(INSERT_SQL, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, h.getOrderId());
            ps.setString(2, h.getStatus());
            ps.setString(3, h.getChangedBy() != null ? h.getChangedBy() : "SYSTEM");
            ps.setString(4, h.getRemarks() != null ? h.getRemarks() : "");
            ps.setTimestamp(5, h.getTimestamp() != null ? h.getTimestamp() : new java.sql.Timestamp(System.currentTimeMillis()));
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int id = rs.getInt(1);
                    h.setHistoryId(id);
                    return id;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public List<OrderStatusHistory> getHistoryByOrderId(int orderId) {
        List<OrderStatusHistory> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_ORDER_SQL)) {
            ps.setInt(1, orderId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new OrderStatusHistory(
                        rs.getInt("history_id"),
                        rs.getInt("order_id"),
                        rs.getString("status"),
                        rs.getString("changed_by"),
                        rs.getTimestamp("timestamp"),
                        rs.getString("remarks")
                    ));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}
