package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.AddressDAO;
import com.tap.model.Address;
import com.tap.util.DBConnection;

public class AddressDAOImpl implements AddressDAO {

    private static final String INSERT_SQL = 
        "INSERT INTO address (user_id, full_name, phone, house_no, street, area, city, state, pincode, latitude, longitude, formatted_address, address_type, is_default) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    private static final String UPDATE_SQL = 
        "UPDATE address SET full_name=?, phone=?, house_no=?, street=?, area=?, city=?, state=?, pincode=?, latitude=?, longitude=?, formatted_address=?, address_type=?, is_default=? " +
        "WHERE address_id=? AND user_id=?";

    private static final String DELETE_SQL = "DELETE FROM address WHERE address_id=? AND user_id=?";
    private static final String GET_BY_ID_SQL = "SELECT * FROM address WHERE address_id=?";
    private static final String GET_BY_USER_SQL = "SELECT * FROM address WHERE user_id=? ORDER BY is_default DESC, address_id DESC";
    private static final String CLEAR_DEFAULT_SQL = "UPDATE address SET is_default=FALSE WHERE user_id=?";
    private static final String SET_DEFAULT_SQL = "UPDATE address SET is_default=TRUE WHERE address_id=? AND user_id=?";

    @Override
    public int addAddress(Address a) {
        try (Connection con = DBConnection.getConnection()) {
            if (a.isDefault()) {
                try (PreparedStatement psClear = con.prepareStatement(CLEAR_DEFAULT_SQL)) {
                    psClear.setInt(1, a.getUserId());
                    psClear.executeUpdate();
                }
            }

            try (PreparedStatement ps = con.prepareStatement(INSERT_SQL, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, a.getUserId());
                ps.setString(2, a.getFullName());
                ps.setString(3, a.getPhone());
                ps.setString(4, a.getHouseNo());
                ps.setString(5, a.getStreet());
                ps.setString(6, a.getArea());
                ps.setString(7, a.getCity());
                ps.setString(8, a.getState());
                ps.setString(9, a.getPincode());
                if (a.getLatitude() != null) ps.setDouble(10, a.getLatitude()); else ps.setNull(10, java.sql.Types.DOUBLE);
                if (a.getLongitude() != null) ps.setDouble(11, a.getLongitude()); else ps.setNull(11, java.sql.Types.DOUBLE);
                ps.setString(12, a.getFormattedAddress());
                ps.setString(13, a.getAddressType());
                ps.setBoolean(14, a.isDefault());
                ps.executeUpdate();

                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        int id = rs.getInt(1);
                        a.setAddressId(id);
                        return id;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    @Override
    public boolean updateAddress(Address a) {
        try (Connection con = DBConnection.getConnection()) {
            if (a.isDefault()) {
                try (PreparedStatement psClear = con.prepareStatement(CLEAR_DEFAULT_SQL)) {
                    psClear.setInt(1, a.getUserId());
                    psClear.executeUpdate();
                }
            }

            try (PreparedStatement ps = con.prepareStatement(UPDATE_SQL)) {
                ps.setString(1, a.getFullName());
                ps.setString(2, a.getPhone());
                ps.setString(3, a.getHouseNo());
                ps.setString(4, a.getStreet());
                ps.setString(5, a.getArea());
                ps.setString(6, a.getCity());
                ps.setString(7, a.getState());
                ps.setString(8, a.getPincode());
                if (a.getLatitude() != null) ps.setDouble(9, a.getLatitude()); else ps.setNull(9, java.sql.Types.DOUBLE);
                if (a.getLongitude() != null) ps.setDouble(10, a.getLongitude()); else ps.setNull(10, java.sql.Types.DOUBLE);
                ps.setString(11, a.getFormattedAddress());
                ps.setString(12, a.getAddressType());
                ps.setBoolean(13, a.isDefault());
                ps.setInt(14, a.getAddressId());
                ps.setInt(15, a.getUserId());
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public boolean deleteAddress(int addressId, int userId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(DELETE_SQL)) {
            ps.setInt(1, addressId);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public Address getAddressById(int addressId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_ID_SQL)) {
            ps.setInt(1, addressId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return map(rs);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Address> getAddressesByUserId(int userId) {
        List<Address> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(GET_BY_USER_SQL)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(map(rs));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public Address getDefaultAddress(int userId) {
        List<Address> list = getAddressesByUserId(userId);
        if (list.isEmpty()) return null;
        for (Address a : list) {
            if (a.isDefault()) return a;
        }
        return list.get(0);
    }

    @Override
    public boolean setDefaultAddress(int addressId, int userId) {
        try (Connection con = DBConnection.getConnection()) {
            try (PreparedStatement psClear = con.prepareStatement(CLEAR_DEFAULT_SQL)) {
                psClear.setInt(1, userId);
                psClear.executeUpdate();
            }
            try (PreparedStatement ps = con.prepareStatement(SET_DEFAULT_SQL)) {
                ps.setInt(1, addressId);
                ps.setInt(2, userId);
                return ps.executeUpdate() > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private Address map(ResultSet rs) throws Exception {
        Double lat = rs.getObject("latitude") != null ? rs.getDouble("latitude") : null;
        Double lng = rs.getObject("longitude") != null ? rs.getDouble("longitude") : null;
        return new Address(
            rs.getInt("address_id"),
            rs.getInt("user_id"),
            rs.getString("full_name"),
            rs.getString("phone"),
            rs.getString("house_no"),
            rs.getString("street"),
            rs.getString("area"),
            rs.getString("city"),
            rs.getString("state"),
            rs.getString("pincode"),
            lat,
            lng,
            rs.getString("formatted_address"),
            rs.getString("address_type"),
            rs.getBoolean("is_default"),
            rs.getTimestamp("created_at")
        );
    }
}
