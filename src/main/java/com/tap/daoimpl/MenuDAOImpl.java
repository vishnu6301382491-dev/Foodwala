package com.tap.daoimpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import com.tap.dao.MenuDAO;
import com.tap.model.Menu;
import com.tap.model.MenuCategory;
import com.tap.util.DBConnection;

public class MenuDAOImpl implements MenuDAO {
    private static final String INSERT_QUERY = "INSERT INTO menu (restaurant_id,category_id,item_name,description,price,rating,is_available,image_path,is_veg,is_popular,preparation_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    private static final String GET_QUERY = "SELECT m.*, c.name AS category_title FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id WHERE m.menu_id=?";
    private static final String UPDATE_QUERY = "UPDATE menu SET restaurant_id=?,category_id=?,item_name=?,description=?,price=?,rating=?,is_available=?,image_path=?,is_veg=?,is_popular=?,preparation_time=? WHERE menu_id=?";
    private static final String DELETE_QUERY = "DELETE FROM menu WHERE menu_id=?";
    private static final String GET_ALL_QUERY = "SELECT m.*, c.name AS category_title FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id ORDER BY m.menu_id";
    private static final String GET_BY_RESTAURANT_QUERY = "SELECT m.*, c.name AS category_title FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id WHERE m.restaurant_id=? AND m.is_available=TRUE ORDER BY m.category_id, m.menu_id";
    private static final String GET_BY_REST_AND_CAT_QUERY = "SELECT m.*, c.name AS category_title FROM menu m LEFT JOIN menu_category c ON m.category_id = c.category_id WHERE m.restaurant_id=? AND m.category_id=? AND m.is_available=TRUE ORDER BY m.menu_id";
    private static final String GET_CATEGORIES_BY_REST = "SELECT * FROM menu_category WHERE restaurant_id=? ORDER BY display_order, category_id";

    @Override
    public int addMenu(Menu m) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(INSERT_QUERY)) {
            ps.setInt(1, m.getRestaurantId());
            ps.setInt(2, m.getCategoryId());
            ps.setString(3, m.getItemName());
            ps.setString(4, m.getDescription());
            ps.setDouble(5, m.getPrice());
            ps.setDouble(6, m.getRating());
            ps.setBoolean(7, m.isAvailable());
            ps.setString(8, m.getImagePath());
            ps.setBoolean(9, m.isVeg());
            ps.setBoolean(10, m.isPopular());
            ps.setString(11, m.getPreparationTime());
            return ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    @Override
    public Menu getMenu(int id) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_QUERY)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return map(rs);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public int updateMenu(Menu m) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(UPDATE_QUERY)) {
            ps.setInt(1, m.getRestaurantId());
            ps.setInt(2, m.getCategoryId());
            ps.setString(3, m.getItemName());
            ps.setString(4, m.getDescription());
            ps.setDouble(5, m.getPrice());
            ps.setDouble(6, m.getRating());
            ps.setBoolean(7, m.isAvailable());
            ps.setString(8, m.getImagePath());
            ps.setBoolean(9, m.isVeg());
            ps.setBoolean(10, m.isPopular());
            ps.setString(11, m.getPreparationTime());
            ps.setInt(12, m.getMenuId());
            return ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    @Override
    public int deleteMenu(int id) {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(DELETE_QUERY)) {
            ps.setInt(1, id);
            return ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    @Override
    public List<Menu> getAllMenus() {
        return queryList(GET_ALL_QUERY, null, null);
    }

    @Override
    public List<Menu> getMenuByRestaurantId(int restaurantId) {
        return queryList(GET_BY_RESTAURANT_QUERY, restaurantId, null);
    }

    @Override
    public List<Menu> getMenuByRestaurantAndCategory(int restaurantId, int categoryId) {
        return queryList(GET_BY_REST_AND_CAT_QUERY, restaurantId, categoryId);
    }

    @Override
    public List<MenuCategory> getCategoriesByRestaurantId(int restaurantId) {
        List<MenuCategory> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(GET_CATEGORIES_BY_REST)) {
            ps.setInt(1, restaurantId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new MenuCategory(
                        rs.getInt("category_id"),
                        rs.getInt("restaurant_id"),
                        rs.getString("name"),
                        rs.getString("description"),
                        rs.getInt("display_order")
                    ));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private List<Menu> queryList(String sql, Integer p1, Integer p2) {
        List<Menu> list = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            if (p1 != null) ps.setInt(1, p1);
            if (p2 != null) ps.setInt(2, p2);
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

    private Menu map(ResultSet rs) throws Exception {
        Menu m = new Menu(
            rs.getInt("menu_id"),
            rs.getInt("restaurant_id"),
            rs.getString("item_name"),
            rs.getString("description"),
            rs.getDouble("price"),
            rs.getDouble("rating"),
            rs.getBoolean("is_available"),
            rs.getString("image_path")
        );

        try {
            m.setCategoryId(rs.getInt("category_id"));
        } catch (Exception ignored) {}

        try {
            String catTitle = rs.getString("category_title");
            if (catTitle != null) {
                m.setCategoryName(catTitle);
            }
        } catch (Exception ignored) {}

        try {
            m.setVeg(rs.getBoolean("is_veg"));
            m.setPopular(rs.getBoolean("is_popular"));
            m.setPreparationTime(rs.getString("preparation_time"));
        } catch (Exception ignored) {}

        return m;
    }
}
