package com.tap.dao;

import java.util.List;
import com.tap.model.Menu;
import com.tap.model.MenuCategory;

public interface MenuDAO {
    int addMenu(Menu menu);
    Menu getMenu(int menuId);
    int updateMenu(Menu menu);
    int deleteMenu(int menuId);
    List<Menu> getAllMenus();
    List<Menu> getMenuByRestaurantId(int restaurantId);
    List<MenuCategory> getCategoriesByRestaurantId(int restaurantId);
    List<Menu> getMenuByRestaurantAndCategory(int restaurantId, int categoryId);
}
