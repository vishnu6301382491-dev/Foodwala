package com.tap.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class OrderStatusHistory implements Serializable {
    private static final long serialVersionUID = 1L;
    private int historyId;
    private int orderId;
    private String status;
    private String changedBy;
    private Timestamp timestamp;
    private String remarks;

    public OrderStatusHistory() {}

    public OrderStatusHistory(int historyId, int orderId, String status, String changedBy,
                              Timestamp timestamp, String remarks) {
        this.historyId = historyId;
        this.orderId = orderId;
        this.status = status;
        this.changedBy = changedBy;
        this.timestamp = timestamp;
        this.remarks = remarks;
    }

    public OrderStatusHistory(int orderId, String status, String changedBy, String remarks) {
        this(0, orderId, status, changedBy, new Timestamp(System.currentTimeMillis()), remarks);
    }

    public int getHistoryId() { return historyId; }
    public void setHistoryId(int historyId) { this.historyId = historyId; }
    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public Timestamp getTimestamp() { return timestamp; }
    public void setTimestamp(Timestamp timestamp) { this.timestamp = timestamp; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
