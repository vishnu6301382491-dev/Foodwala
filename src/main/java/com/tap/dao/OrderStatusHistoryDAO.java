package com.tap.dao;

import java.util.List;
import com.tap.model.OrderStatusHistory;

public interface OrderStatusHistoryDAO {
    int addHistory(OrderStatusHistory history);
    List<OrderStatusHistory> getHistoryByOrderId(int orderId);
}
