package com.tap.test;

import java.io.FileWriter;
import java.util.List;
import com.tap.daoimpl.MenuDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.model.Menu;
import com.tap.model.Restaurant;
import com.tap.util.JsonUtil;

public class ExportData {
    public static void main(String[] args) {
        try {
            RestaurantDAOImpl restDao = new RestaurantDAOImpl();
            MenuDAOImpl menuDao = new MenuDAOImpl();

            List<Restaurant> restList = restDao.getAllRestaurants();
            List<Menu> menuList = menuDao.getAllMenus();

            String restJson = JsonUtil.restaurantsToJsonList(restList);
            String menuJson = JsonUtil.menusToJsonList(menuList);

            java.io.File jsDir = new java.io.File("D:/FoodWala_Eclipse_Project/js");
            jsDir.mkdirs();

            try (FileWriter fw = new FileWriter("D:/FoodWala_Eclipse_Project/js/foodwala-data.js")) {
                fw.write("// FoodWala Static Catalog Data\n");
                fw.write("window.FOODWALA_RESTAURANTS = " + restJson + ";\n\n");
                fw.write("window.FOODWALA_MENUS = " + menuJson + ";\n");
            }

            System.out.println("SUCCESS: Exported " + restList.size() + " restaurants and " + menuList.size() + " menu items to js/foodwala-data.js");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
