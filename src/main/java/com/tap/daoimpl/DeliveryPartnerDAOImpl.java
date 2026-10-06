package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.DeliveryPartnerDAO;
import com.tap.model.DeliveryPartner;
import com.tap.util.DBConnection;

public class DeliveryPartnerDAOImpl implements DeliveryPartnerDAO {

    private static final String GET_BY_USER_SQL = "SELECT * FROM delivery_partner WHERE user_id=?";
    private static final String GET_BY_ID_SQL = "SELECT * FROM delivery_partner WHERE partner_id=?";
    private static final String GET_AVAILABLE_SQL = "SELECT * FROM delivery_partner WHERE is_available=TRUE";
    private static final String UPDATE_LOCATION_SQL = 
        "UPDATE delivery_partner SET current_lat=?, current_lng=?, accuracy=?, last_location_update=? WHERE partner_id=?";
    private static final String SET_AVAILABILITY_SQL = "UPDATE delivery_partner SET is_available=? WHERE partner_id=?";
    private static final String INSERT_PARTNER_SQL = 
        "INSERT INTO delivery_partner (user_id, name, phone, vehicle_number, current_lat, current_lng, accuracy, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    @Override
    public DeliveryPartner getPartnerByUserId(int userId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_USER_SQL)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public DeliveryPartner getPartnerById(int partnerId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_ID_SQL)) {
            ps.setInt(1, partnerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<DeliveryPartner> getAllAvailablePartners() {
        List<DeliveryPartner> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_AVAILABLE_SQL);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(map(rs));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public boolean updateLocation(int partnerId, double lat, double lng, double accuracy) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(UPDATE_LOCATION_SQL)) {
            ps.setDouble(1, lat);
            ps.setDouble(2, lng);
            ps.setDouble(3, accuracy);
            ps.setTimestamp(4, new Timestamp(System.currentTimeMillis()));
            ps.setInt(5, partnerId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean setAvailability(int partnerId, boolean available) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(SET_AVAILABILITY_SQL)) {
            ps.setBoolean(1, available);
            ps.setInt(2, partnerId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public int createPartner(DeliveryPartner partner) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(INSERT_PARTNER_SQL, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, partner.getUserId());
            ps.setString(2, partner.getName());
            ps.setString(3, partner.getPhone());
            ps.setString(4, partner.getVehicleNumber());
            ps.setDouble(5, partner.getCurrentLat());
            ps.setDouble(6, partner.getCurrentLng());
            ps.setDouble(7, partner.getAccuracy());
            ps.setBoolean(8, partner.isAvailable());
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    int id = rs.getInt(1);
                    partner.setPartnerId(id);
                    return id;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public DeliveryPartner getFirstAvailableOrDemoPartner() {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement("SELECT * FROM delivery_partner WHERE is_available=TRUE ORDER BY partner_id ASC LIMIT 1");
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return map(rs);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return getPartnerById(1);
    }

    private DeliveryPartner map(ResultSet rs) throws Exception {
        String vehicleType = "Hero Electric Scooter";
        String profileImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb";
        double rating = 4.8;
        String status = "AVAILABLE";

        try { if (rs.getString("vehicle_type") != null) vehicleType = rs.getString("vehicle_type"); } catch (Exception ignored) {}
        try { if (rs.getString("profile_image") != null) profileImage = rs.getString("profile_image"); } catch (Exception ignored) {}
        try { if (rs.getObject("rating") != null) rating = rs.getDouble("rating"); } catch (Exception ignored) {}
        try { if (rs.getString("status") != null) status = rs.getString("status"); } catch (Exception ignored) {}

        return new DeliveryPartner(
            rs.getInt("partner_id"),
            rs.getInt("user_id"),
            rs.getString("name"),
            rs.getString("phone"),
            rs.getString("vehicle_number"),
            vehicleType,
            profileImage,
            rating,
            status,
            rs.getDouble("current_lat"),
            rs.getDouble("current_lng"),
            rs.getDouble("accuracy"),
            rs.getBoolean("is_available"),
            rs.getTimestamp("last_location_update")
        );
    }
}
