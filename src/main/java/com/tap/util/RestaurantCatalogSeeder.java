package com.tap.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class RestaurantCatalogSeeder {

    private static final String DB_URL = "jdbc:mysql://localhost:3306/fudwala?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "root";

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("FOODWALA BENGALURU RESTAURANT CATALOG SEEDER");
        System.out.println("==================================================");

        try (Connection con = DriverManager.getConnection(DB_URL, USER, PASS);
             Statement st = con.createStatement()) {

            // 1. Ensure Table Columns exist
            System.out.println("1. Ensuring table schemas and columns...");
            addColumnIfNotExists(st, "restaurant", "description", "TEXT");
            addColumnIfNotExists(st, "restaurant", "area", "VARCHAR(150) DEFAULT 'Bengaluru Central'");
            addColumnIfNotExists(st, "restaurant", "review_count", "INT DEFAULT 50");
            addColumnIfNotExists(st, "restaurant", "delivery_fee", "DOUBLE DEFAULT 30.0");
            addColumnIfNotExists(st, "restaurant", "minimum_order", "DOUBLE DEFAULT 100.0");
            addColumnIfNotExists(st, "restaurant", "is_open", "BOOLEAN DEFAULT TRUE");
            addColumnIfNotExists(st, "restaurant", "opening_time", "VARCHAR(20) DEFAULT '07:00 AM'");
            addColumnIfNotExists(st, "restaurant", "closing_time", "VARCHAR(20) DEFAULT '11:00 PM'");

            st.executeUpdate("CREATE TABLE IF NOT EXISTS menu_category (" +
                "category_id INT PRIMARY KEY AUTO_INCREMENT," +
                "restaurant_id INT NOT NULL," +
                "name VARCHAR(100) NOT NULL," +
                "description VARCHAR(255)," +
                "display_order INT DEFAULT 1" +
            ")");

            addColumnIfNotExists(st, "menu", "category_id", "INT NULL");
            addColumnIfNotExists(st, "menu", "category_name", "VARCHAR(100) DEFAULT 'Main Course'");
            addColumnIfNotExists(st, "menu", "is_veg", "BOOLEAN DEFAULT TRUE");
            addColumnIfNotExists(st, "menu", "is_popular", "BOOLEAN DEFAULT FALSE");
            addColumnIfNotExists(st, "menu", "preparation_time", "VARCHAR(50) DEFAULT '15-20 mins'");

            // 2. Populate 105+ Bengaluru Restaurants
            seedRestaurants(con);

            // 3. Populate Menu Categories & Items
            seedMenus(con);

            int finalRestCount = 0;
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM restaurant")) {
                if (rs.next()) finalRestCount = rs.getInt(1);
            }
            int finalMenuCount = 0;
            try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM menu")) {
                if (rs.next()) finalMenuCount = rs.getInt(1);
            }

            System.out.println("==================================================");
            System.out.println("CATALOG SEEDING SUCCESSFUL!");
            System.out.println("Total Restaurants in Catalog: " + finalRestCount);
            System.out.println("Total Menu Items in Catalog: " + finalMenuCount);
            System.out.println("==================================================");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void addColumnIfNotExists(Statement st, String table, String col, String def) {
        try {
            st.executeUpdate("ALTER TABLE " + table + " ADD COLUMN " + col + " " + def);
            System.out.println("  + Added column " + col + " to " + table);
        } catch (Exception ignored) {}
    }

    public static class RestData {
        int id;
        String name;
        String cuisine;
        int deliveryTime;
        String address;
        String area;
        double rating;
        int reviewCount;
        String img;
        double lat;
        double lng;
        String pincode;
        String phone;
        String openTime;
        String closeTime;
        double deliveryFee;
        String desc;

        public RestData(int id, String name, String cuisine, int deliveryTime, String address, String area,
                        double rating, int reviewCount, String img, double lat, double lng, String pincode,
                        String phone, String openTime, String closeTime, double deliveryFee, String desc) {
            this.id = id; this.name = name; this.cuisine = cuisine; this.deliveryTime = deliveryTime;
            this.address = address; this.area = area; this.rating = rating; this.reviewCount = reviewCount;
            this.img = img; this.lat = lat; this.lng = lng; this.pincode = pincode; this.phone = phone;
            this.openTime = openTime; this.closeTime = closeTime; this.deliveryFee = deliveryFee; this.desc = desc;
        }
    }

    private static void seedRestaurants(Connection con) throws Exception {
        List<RestData> list = getSeededRestaurants();
        System.out.println("Seeding " + list.size() + " Bengaluru Restaurants...");

        String upsertSql = "INSERT INTO restaurant (restaurant_id, name, cuisine_type, delivery_time, address, area, " +
            "admin_user_id, rating, review_count, is_active, is_open, opening_time, closing_time, delivery_fee, " +
            "minimum_order, image_path, latitude, longitude, city, state, pincode, phone, description) " +
            "VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, TRUE, TRUE, ?, ?, ?, 100.0, ?, ?, ?, 'Bengaluru', 'Karnataka', ?, ?, ?) " +
            "ON DUPLICATE KEY UPDATE name=VALUES(name), cuisine_type=VALUES(cuisine_type), delivery_time=VALUES(delivery_time), " +
            "address=VALUES(address), area=VALUES(area), rating=VALUES(rating), review_count=VALUES(review_count), " +
            "opening_time=VALUES(opening_time), closing_time=VALUES(closing_time), delivery_fee=VALUES(delivery_fee), " +
            "image_path=VALUES(image_path), latitude=VALUES(latitude), longitude=VALUES(longitude), " +
            "pincode=VALUES(pincode), phone=VALUES(phone), description=VALUES(description)";

        try (PreparedStatement ps = con.prepareStatement(upsertSql)) {
            for (RestData r : list) {
                ps.setInt(1, r.id);
                ps.setString(2, r.name);
                ps.setString(3, r.cuisine);
                ps.setInt(4, r.deliveryTime);
                ps.setString(5, r.address);
                ps.setString(6, r.area);
                ps.setDouble(7, r.rating);
                ps.setInt(8, r.reviewCount);
                ps.setString(9, r.openTime);
                ps.setString(10, r.closeTime);
                ps.setDouble(11, r.deliveryFee);
                ps.setString(12, r.img);
                ps.setDouble(13, r.lat);
                ps.setDouble(14, r.lng);
                ps.setString(15, r.pincode);
                ps.setString(16, r.phone);
                ps.setString(17, r.desc);
                ps.addBatch();
            }
            ps.executeBatch();
        }
    }

    private static List<RestData> getSeededRestaurants() {
        List<RestData> list = new ArrayList<>();

        // Core 8
        list.add(new RestData(1, "Central Tiffin Room (CTR) - Shri Sagar", "South Indian, Breakfast", 25, "7th Cross, Margosa Road, Malleshwaram", "Malleshwaram", 4.8, 480, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 13.0031, 77.5714, "560003", "+91 80 2334 4838", "07:30 AM", "12:30 PM", 30.0, "Legendary Bengaluru eatery world-renowned for buttery crisp Benne Masala Dosa and filter coffee."));
        list.add(new RestData(2, "Vidyarthi Bhavan", "South Indian, Breakfast, Tiffin", 30, "32 Gandhi Bazaar Main Road, Basavanagudi", "Basavanagudi", 4.7, 650, "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4", 12.9438, 77.5738, "560004", "+91 80 2667 7588", "06:30 AM", "11:30 AM", 30.0, "Iconic South Indian culinary institution established in 1943, celebrated for thick signature masala dosas."));
        list.add(new RestData(3, "Mavalli Tiffin Room (MTR)", "South Indian, Karnataka, Pure Veg", 35, "14 Lalbagh Road, Mavalli", "Lalbagh", 4.6, 520, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9554, 77.5873, "560027", "+91 80 2222 0022", "07:00 AM", "09:30 PM", 35.0, "Heritage landmark where Rava Idli was invented, serving authentic traditional Karnataka fare since 1924."));
        list.add(new RestData(4, "Corner House Ice Cream", "Desserts, Ice Cream, Beverages", 20, "10th Main, 4th Block, Jayanagar", "Jayanagar", 4.9, 890, "https://images.unsplash.com/photo-1563805042-7684c019e1cb", 12.9298, 77.5834, "560011", "+91 80 2663 3456", "11:00 AM", "11:30 PM", 25.0, "Home of the world-famous Death by Chocolate (DBC) sundae and rich handcrafted dairy desserts."));
        list.add(new RestData(5, "Shivaji Military Hotel", "South Indian, Biryani, Non-Veg", 40, "8th Block, 45th Cross, Jayanagar", "Jayanagar", 4.6, 380, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9152, 77.5841, "560082", "+91 99863 56789", "08:00 AM", "04:00 PM", 40.0, "Traditional Karnataka military hotel known for aromatic mutton donne biryani cooked on woodfire."));
        list.add(new RestData(6, "Brahmin's Coffee Bar", "South Indian, Breakfast, Pure Veg", 20, "Ranga Rao Road, Near Shankar Mutt, Shankarpuram", "Basavanagudi", 4.8, 590, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd", 12.9482, 77.5683, "560004", "+91 80 2660 1234", "06:00 AM", "12:00 PM", 25.0, "Iconic stand-and-eat cafe famous for fluffy steamed idlis, golden crispy vadas, and fiery coconut chutney."));
        list.add(new RestData(7, "Meghana Foods", "Andhra, Biryani, North Indian", 30, "124 1st Cross, 5th Block, Koramangala", "Koramangala", 4.7, 980, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9343, 77.6186, "560034", "+91 80 4110 5555", "11:30 AM", "11:00 PM", 35.0, "Bengaluru's go-to hotspot for spicy Andhra style chicken boneless biryani and chili chicken."));
        list.add(new RestData(8, "Truffles", "Burgers, Continental, Fast Food, Cafe", 25, "28 4th B Cross, 5th Block, Koramangala", "Koramangala", 4.7, 920, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 12.9338, 77.6142, "560034", "+91 80 4146 6565", "11:00 AM", "11:00 PM", 30.0, "Beloved youth cafe renowned for massive American burgers, crispy fries, steaks, and decadent cheesecakes."));

        // Malleshwaram & Rajajinagar
        list.add(new RestData(9, "Veena Stores", "South Indian, Breakfast, Street Food", 15, "187 15th Cross, Margosa Road, Malleshwaram", "Malleshwaram", 4.8, 620, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 13.0078, 77.5689, "560003", "+91 80 2334 4839", "06:30 AM", "12:30 PM", 25.0, "Tiny culinary gem famous for melt-in-mouth soft idlis, spicy khara bath, and thick mint-coconut chutney."));
        list.add(new RestData(10, "Halli Mane", "South Indian, Karnataka, Traditional", 30, "3rd Cross, Sampige Road, Malleshwaram", "Malleshwaram", 4.5, 410, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 13.0012, 77.5702, "560003", "+91 80 4112 5678", "07:00 AM", "10:30 PM", 30.0, "Rustic village-themed restaurant serving Jolada Rotti Oota, Akki Rotti, and traditional Karnataka delicacies."));
        list.add(new RestData(11, "Janata Hotel", "South Indian, Breakfast, Tiffin", 20, "8th Cross, Sampige Road, Malleshwaram", "Malleshwaram", 4.4, 310, "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4", 13.0045, 77.5708, "560003", "+91 80 2334 1122", "07:00 AM", "09:00 PM", 25.0, "Old-school vegetarian restaurant beloved for crispy Vada Sambar, sagu masala dosa, and strong filter kaapi."));
        list.add(new RestData(12, "Sri Raghavendra Stores", "South Indian, Breakfast, Fast Food", 15, "Near Malleshwaram Railway Station", "Malleshwaram", 4.7, 490, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 13.0020, 77.5670, "560003", "+91 80 2344 7890", "06:00 AM", "01:00 PM", 25.0, "Bustling morning hub serving piping hot crispy shavige bath, chow chow bath, and steaming idlis."));
        list.add(new RestData(13, "Nalapaka", "Karnataka, North Karnataka, Pure Veg", 30, "1st Block, Rajajinagar", "Rajajinagar", 4.4, 270, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9912, 77.5540, "560010", "+91 80 2315 4567", "11:00 AM", "10:00 PM", 30.0, "Authentic North Karnataka Jolada Rotti meals with Yennegai stuffed brinjal, Shenga chutney, and buttermilk."));
        list.add(new RestData(14, "Paakashala", "South Indian, North Indian, Pure Veg", 25, "Dr Rajkumar Road, Rajajinagar", "Rajajinagar", 4.5, 360, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9985, 77.5580, "560010", "+91 80 2312 9988", "07:00 AM", "10:30 PM", 30.0, "Premium family vegetarian dining offering South Indian breakfasts, tandoori appetizers, and curries."));

        // Basavanagudi & Jayanagar
        list.add(new RestData(15, "Taaza Thindi", "South Indian, Breakfast, Pure Veg", 20, "1004 26th Main, 4th T Block, Jayanagar", "Jayanagar", 4.9, 750, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9238, 77.5898, "560041", "+91 80 4099 2233", "07:00 AM", "12:00 PM", 25.0, "High-hygiene model quick-service cafe offering budget-friendly crispy masala dosas, idlis, and kesari bath."));
        list.add(new RestData(16, "Maiyas", "South Indian, Sweets, Pure Veg", 30, "4th Block, 11th Main, Jayanagar", "Jayanagar", 4.5, 410, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9305, 77.5822, "560011", "+91 80 2656 4455", "07:00 AM", "10:00 PM", 30.0, "Multi-level vegetarian paradise known for traditional festive thalis, Benne Dosa, Badam Milk, and mysore pak."));
        list.add(new RestData(17, "Kamat Bugle Rock", "South Indian, North Karnataka, Pure Veg", 35, "Bull Temple Road, Basavanagudi", "Basavanagudi", 4.4, 380, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9420, 77.5680, "560004", "+91 80 2660 7788", "11:30 AM", "10:30 PM", 35.0, "Lush garden-side dining serving authentic Uttara Karnataka Jolada Rotti meals on banana leaf."));
        list.add(new RestData(18, "SLV Corner Restaurant", "South Indian, Fast Food, Pure Veg", 20, "Vanivilas Road, Basavanagudi", "Basavanagudi", 4.6, 420, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9450, 77.5740, "560004", "+91 80 2667 3344", "06:30 AM", "10:00 PM", 25.0, "Traditional self-service darshini popular for crispy rava idlis, onion dosas, and quick evening filter coffee."));
        list.add(new RestData(19, "VB Bakery", "Bakery, Desserts, Fast Food", 15, "Sajjan Rao Circle, VV Puram", "Basavanagudi", 4.8, 510, "https://images.unsplash.com/photo-1509440159596-0249088772ff", 12.9515, 77.5775, "560004", "+91 80 2667 8899", "08:00 AM", "10:00 PM", 25.0, "Historic 1953 bakery renowned for signature Khara Buns, Congress Bun butter masala, and honey cake."));
        list.add(new RestData(20, "VV Puram Food Street", "Street Food, South Indian, Fast Food", 20, "Old Hospital Road, Sajjan Rao Circle", "Basavanagudi", 4.7, 720, "https://images.unsplash.com/photo-1601050690597-df0568f70950", 12.9520, 77.5780, "560004", "+91 80 2667 0011", "05:00 PM", "11:30 PM", 25.0, "Bengaluru's premier evening food street featuring paddu, dahi puri, twist potato, and sweet jalebis."));

        // Koramangala
        list.add(new RestData(21, "Chinita Real Mexican Food", "Mexican, Continental, Healthy", 35, "218 5th Main, 5th Block, Koramangala", "Koramangala", 4.6, 390, "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", 12.9348, 77.6160, "560034", "+91 80 4110 3456", "12:00 PM", "11:00 PM", 40.0, "Artisanal Mexican taqueria serving fresh corn tortilla tacos, enchiladas, burritos, and churros with chocolate."));
        list.add(new RestData(22, "The Hole in the Wall Cafe", "Continental, Breakfast, Cafe, Burgers", 30, "4 8th Main, 4th Block, Koramangala", "Koramangala", 4.7, 680, "https://images.unsplash.com/photo-1554118811-1e0d58224f24", 12.9325, 77.6230, "560034", "+91 80 4094 9494", "08:00 AM", "09:00 PM", 35.0, "Cozy iconic breakfast cafe serving all-day English breakfasts, fluffy waffles, pancakes, and loaded omelets."));
        list.add(new RestData(23, "Nagarjuna - Koramangala", "Andhra, Biryani, South Indian", 30, "88 6th Block, Industrial Layout, Koramangala", "Koramangala", 4.6, 590, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9350, 77.6190, "560034", "+91 80 4110 0000", "12:00 PM", "11:00 PM", 35.0, "Legendary Andhra dining house famous for spicy Andhra Chicken 65, Gongura Mutton, and unlimited thali meals."));
        list.add(new RestData(24, "Anjappar Chettinad Restaurant", "Chettinad, South Indian, Biryani", 35, "80 Feet Road, 4th Block, Koramangala", "Koramangala", 4.4, 340, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9320, 77.6250, "560034", "+91 80 4121 8877", "11:30 AM", "11:00 PM", 35.0, "Authentic spicy Tamil Chettinad culinary house serving pepper chicken, seeraga samba biryani, and crab roast."));
        list.add(new RestData(25, "Onesta - Koramangala", "Pizza, Italian, Desserts", 30, "562 8th Main, 4th Block, Koramangala", "Koramangala", 4.5, 480, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9330, 77.6210, "560034", "+91 80 4090 6060", "12:30 PM", "11:00 PM", 30.0, "Gourmet pizzeria serving thin-crust artisan sourdough pizzas, pasta, garlic bread, and berry cheesecakes."));
        list.add(new RestData(26, "Empire Restaurant - Koramangala", "North Indian, Biryani, Mughlai, Fast Food", 35, "80 Feet Road, 6th Block, Koramangala", "Koramangala", 4.3, 850, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9370, 77.6170, "560034", "+91 80 4041 4041", "11:00 AM", "02:00 AM", 35.0, "Bengaluru's late-night food giant famous for Coin Parotta, Ghee Rice, Empire Special Butter Chicken, and kebabs."));
        list.add(new RestData(27, "Smoor Chocolates & Cafe", "Desserts, Bakery, Continental, Cafe", 25, "1131 100 Feet Road, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.7, 530, "https://images.unsplash.com/photo-1578985545062-69928b1d9587", 12.9690, 77.6410, "560038", "+91 80 4965 2929", "09:00 AM", "11:30 PM", 30.0, "Luxury chocolatier and cafe offering handcrafted artisan truffles, macron boxes, cheesecakes, and hot chocolate."));

        // Indiranagar
        list.add(new RestData(28, "Toit Brewpub & Kitchen", "Continental, Italian, Pizza, Burgers", 35, "298 100 Feet Road, Near CMH Road, Indiranagar", "Indiranagar", 4.8, 990, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9790, 77.6405, "560038", "+91 90197 13388", "12:00 PM", "11:30 PM", 40.0, "Iconic Bengaluru culinary pioneer famous for wood-fired sourdough pizzas, chicken wings, and gourmet burgers."));
        list.add(new RestData(29, "Glen's Bakehouse - Indiranagar", "Bakery, Cafe, Desserts, Italian", 25, "297 100 Feet Road, Indiranagar", "Indiranagar", 4.7, 820, "https://images.unsplash.com/photo-1578985545062-69928b1d9587", 12.9780, 77.6412, "560038", "+91 80 4122 8989", "09:00 AM", "11:00 PM", 30.0, "Charming European bakery celebrated for signature Red Velvet cupcakes, sourdough pot pies, and apple tarts."));
        list.add(new RestData(30, "Daddy - Casual Dining", "Continental, Asian, North Indian", 35, "963 12th Main Road, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.5, 410, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9710, 77.6400, "560038", "+91 95914 99990", "12:00 PM", "11:30 PM", 35.0, "Stylish dining destination offering eclectic global fusion, loaded nachos, peri-peri skewers, and mocktails."));
        list.add(new RestData(31, "Smoke House Deli - Indiranagar", "Continental, Italian, Healthy", 35, "1207 100 Feet Road, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.6, 360, "https://images.unsplash.com/photo-1554118811-1e0d58224f24", 12.9680, 77.6420, "560038", "+91 80 2520 0087", "09:00 AM", "11:00 PM", 40.0, "Illustrated European deli serving handmade pastas, artisanal salads, organic smoked meats, and shakes."));
        list.add(new RestData(32, "Phobidden Fruit", "Asian, Vietnamese, Healthy", 40, "965 12th Main Road, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.7, 330, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 12.9705, 77.6402, "560038", "+91 80 4125 5175", "12:00 PM", "10:30 PM", 40.0, "Authentic Vietnamese bistro renowned for aromatic steaming Pho noodle soup, rice paper summer rolls, and banh mi."));
        list.add(new RestData(33, "Milano Ice Cream", "Desserts, Ice Cream, Italian", 20, "460 9th A Main, 1st Stage, Indiranagar", "Indiranagar", 4.9, 780, "https://images.unsplash.com/photo-1563805042-7684c019e1cb", 12.9770, 77.6450, "560038", "+91 80 4148 5566", "11:00 AM", "11:30 PM", 25.0, "Authentic Italian gelato parlour with creamy pistachio, dark chocolate hazelnut, and fresh sorbets on waffle cones."));
        list.add(new RestData(34, "Indiranagar Club Kitchen", "South Indian, Continental, North Indian", 25, "4th Cross, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.4, 210, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9740, 77.6430, "560038", "+91 80 2528 2233", "07:30 AM", "10:00 PM", 30.0, "Classic club dining serving comforting South Indian tiffins, club sandwiches, fish fry, and cold coffee."));

        // HSR Layout
        list.add(new RestData(35, "Broadway - The Gourmet Theatre", "Continental, Asian, North Indian", 35, "2793 27th Main, Sector 1, HSR Layout", "HSR Layout", 4.6, 340, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9120, 77.6510, "560102", "+91 80 4965 3030", "12:00 PM", "11:00 PM", 35.0, "Fine dining eatery celebrated for live teppanyaki, wood-fired thin pizzas, sushi rolls, and gourmet kebabs."));
        list.add(new RestData(36, "Vasudev Adigas - HSR", "South Indian, Fast Food, Pure Veg", 20, "19th Main, Sector 1, HSR Layout", "HSR Layout", 4.4, 450, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9150, 77.6480, "560102", "+91 80 2572 4455", "06:30 AM", "10:30 PM", 25.0, "Prominent vegetarian food brand serving crisp set dosas, Bisibelebath with boondi, and filter coffee."));
        list.add(new RestData(37, "Third Wave Coffee - HSR", "Cafe, Beverages, Continental, Bakery", 20, "1306 24th Main, Sector 2, HSR Layout", "HSR Layout", 4.7, 520, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb", 12.9100, 77.6460, "560102", "+91 80 4370 7070", "07:30 AM", "11:00 PM", 30.0, "Specialty craft coffee roastery serving cold brews, artisanal pour-overs, croissants, and hummus bagel sandwiches."));
        list.add(new RestData(38, "Mishmash Cafe", "Continental, Fast Food, Cafe", 25, "17th Cross, Sector 4, HSR Layout", "HSR Layout", 4.5, 260, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 12.9130, 77.6380, "560102", "+91 80 4114 8877", "11:00 AM", "11:00 PM", 30.0, "Vibrant neighborhood cafe popular for cheesy peri-peri fries, crunchy chicken burgers, and Oreo thickshakes."));
        list.add(new RestData(39, "Kritunga Restaurant - HSR", "Andhra, Biryani, Rayalaseema", 35, "27th Main, Sector 1, HSR Layout", "HSR Layout", 4.3, 490, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9115, 77.6520, "560102", "+91 80 4200 1122", "11:30 AM", "11:00 PM", 35.0, "Fiery Rayalaseema Andhra restaurant known for Natukodi Biryani, Gongura Royyala Vepudu, and ragi sangati."));

        // JP Nagar & Banashankari
        list.add(new RestData(40, "Gufha Restaurant", "North Indian, Mughlai, Biryani", 40, "The President Hotel, 79/8 Diagonal Road, 3rd Block, Jayanagar", "Jayanagar", 4.5, 320, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", 12.9280, 77.5810, "560011", "+91 80 4180 8080", "12:00 PM", "11:00 PM", 35.0, "Cave-themed theme restaurant serving rich frontier specialties like Dal Makhani, Paneer Tikka, and Galouti Kebab."));
        list.add(new RestData(41, "The Yellow Submarine", "Continental, Italian, Asian", 35, "SRK Towers, Bannerghatta Road, 4th Phase, JP Nagar", "JP Nagar", 4.6, 290, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9050, 77.5950, "560078", "+91 80 4965 2525", "12:00 PM", "11:30 PM", 35.0, "Rooftop brewery and kitchen overlooking lake views, serving loaded platters, woodfire pizza, and dim sums."));
        list.add(new RestData(42, "Brahmin Tiffin Centre", "South Indian, Breakfast, Pure Veg", 15, "15th Cross, 2nd Phase, JP Nagar", "JP Nagar", 4.7, 340, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9090, 77.5900, "560078", "+91 80 2658 9988", "06:30 AM", "12:30 PM", 25.0, "Locals' favourite morning joint for buttery Benne Pudi Dosa, hot filter coffee, and curd vadas."));
        list.add(new RestData(43, "Udupi Grand - Banashankari", "South Indian, North Indian, Pure Veg", 25, "100 Feet Ring Road, Banashankari 2nd Stage", "Banashankari", 4.4, 410, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9240, 77.5650, "560070", "+91 80 2671 2233", "07:00 AM", "10:30 PM", 30.0, "Bustling multi-cuisine vegetarian restaurant offering South Indian meals, Chinese fried rice, and milkshakes."));
        list.add(new RestData(44, "Donne Biryani Mane", "Karnataka, Biryani, South Indian", 30, "Outer Ring Road, Banashankari 3rd Stage", "Banashankari", 4.5, 330, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9300, 77.5500, "560085", "+91 80 2679 5566", "11:00 AM", "10:30 PM", 30.0, "Aromatic traditional Karnataka chicken donne biryani wrapped in dried plantain leaf bowls with mutton chops."));
        list.add(new RestData(45, "Sri Krishna Sagar - JP Nagar", "South Indian, Breakfast, Pure Veg", 20, "24th Main, 5th Phase, JP Nagar", "JP Nagar", 4.5, 360, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9020, 77.5880, "560078", "+91 80 2659 1100", "06:30 AM", "10:30 PM", 25.0, "Family darshini serving hot set dosas, bisibelebath, poori bhaji, and authentic South Indian filter coffee."));

        // BTM Layout & Bannerghatta
        list.add(new RestData(46, "Mani's Dum Biryani", "Biryani, South Indian, North Indian", 30, "7th Main, 2nd Stage, BTM Layout", "BTM Layout", 4.6, 550, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9140, 77.6100, "560076", "+91 80 4110 9988", "11:00 AM", "11:00 PM", 30.0, "Famous for Chennai-style aromatic chicken and mutton dum biryani served with brinjal dalcha and raita."));
        list.add(new RestData(47, "Al Daaz", "Arabian, Middle Eastern, Mughlai", 35, "64 Outer Ring Road, 2nd Stage, BTM Layout", "BTM Layout", 4.7, 610, "https://images.unsplash.com/photo-1544025162-d76694265947", 12.9160, 77.6130, "560076", "+91 80 4151 7766", "12:00 PM", "11:30 PM", 35.0, "Authentic Arabian dining serving fragrant Chicken Mandi, Faham chicken, Kuboos with Garlic Toum, and Shawarma."));
        list.add(new RestData(48, "Biryani Zone - BTM", "Andhra, Biryani, North Indian", 30, "16th Main, 1st Stage, BTM Layout", "BTM Layout", 4.4, 420, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9180, 77.6080, "560068", "+91 80 4140 3344", "11:30 AM", "11:00 PM", 30.0, "Spicy Andhra Special Chicken Boneless Biryani, Pepper Mutton, and flavorful Hyderabadi egg biryani."));
        list.add(new RestData(49, "Anand Sweets and Savouries", "Desserts, Sweets, Street Food, Pure Veg", 25, "Bannerghatta Main Road, Dollars Colony", "JP Nagar", 4.8, 580, "https://images.unsplash.com/photo-1601050690597-df0568f70950", 12.8980, 77.5990, "560076", "+91 80 4120 7788", "09:00 AM", "10:30 PM", 25.0, "Royal Indian mithai and chaat palace famous for Kaju Katli, Raj Kachori, Chole Bhature, and Badam Pista milk."));

        // Electronic City
        list.add(new RestData(50, "Thalassery Restaurant", "Kerala, South Indian, Biryani", 35, "Neeladri Road, Phase 1, Electronic City", "Electronic City", 4.5, 390, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.8440, 77.6630, "560100", "+91 80 4110 8899", "11:00 AM", "11:00 PM", 40.0, "Malabar culinary haven serving authentic Thalassery Chicken Biryani, Kerala Porotta, and Meen Pollichathu."));
        list.add(new RestData(51, "Nandhana Palace - E-City", "Andhra, Biryani, South Indian", 30, "Hosur Road, Phase 1, Electronic City", "Electronic City", 4.4, 460, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.8500, 77.6650, "560100", "+91 80 4123 7766", "11:30 AM", "11:00 PM", 35.0, "Andhra meals hotspot serving spicy Amaravathi Chicken Curry, Nati Kodi Biryani, and traditional payasam."));
        list.add(new RestData(52, "Republic of Noodles", "Asian, Thai, Chinese", 40, "Lemon Tree Hotel, Phase 1, Electronic City", "Electronic City", 4.6, 280, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 12.8480, 77.6600, "560100", "+91 80 4423 2323", "12:30 PM", "11:00 PM", 45.0, "Award-winning pan-Asian fine dining with wok-tossed Pad Thai noodles, Malaysian Laksa, and Dim Sum baskets."));
        list.add(new RestData(53, "Silicon Dhaba", "North Indian, Punjabi, Tandoor", 35, "Velankani Drive, Phase 1, Electronic City", "Electronic City", 4.3, 310, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.8420, 77.6710, "560100", "+91 80 4112 3344", "12:00 PM", "11:30 PM", 35.0, "Highway dhaba vibes in the IT corridor with Sarson Ka Saag, Makki Roti, Butter Naan, and Tandoori Chicken."));

        // Whitefield, Marathahalli & Bellandur
        list.add(new RestData(54, "Windmills Craftworks", "Continental, American, Desserts", 45, "331 Road 5B, EPIP Zone, Whitefield", "Whitefield", 4.8, 620, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9820, 77.7210, "560066", "+91 88802 33322", "12:00 PM", "11:30 PM", 45.0, "World-class microbrewery and culinary kitchen serving Wagyu sliders, pork ribs, and Belgian chocolate cake."));
        list.add(new RestData(55, "Herbs & Spices", "Continental, Italian, Bakery", 35, "ECC Road, Whitefield", "Whitefield", 4.6, 290, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9720, 77.7480, "560066", "+91 80 2845 1818", "11:30 AM", "10:30 PM", 40.0, "Quaint heritage bungalow cafe serving creamy Risotto, Chicken Lasagna, garlic bread, and fresh fruit tarts."));
        list.add(new RestData(56, "The Bier Library", "Continental, Pizza, Bar Food", 40, "Koramangala 6th Block, Near Sony World", "Koramangala", 4.7, 510, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9360, 77.6220, "560034", "+91 91081 80000", "12:00 PM", "11:30 PM", 40.0, "Open-air patio kitchen serving massive 21-inch slice pizzas, loaded nachos, BBQ skewers, and burgers."));
        list.add(new RestData(57, "Mainland China - Whitefield", "Chinese, Asian, Seafood", 40, "ITPB Main Road, Whitefield", "Whitefield", 4.6, 380, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 12.9860, 77.7320, "560066", "+91 80 4115 5555", "12:00 PM", "11:00 PM", 40.0, "Fine dining Asian restaurant famous for steamed crystal dumplings, Kung Pao chicken, and Szechuan noodles."));
        list.add(new RestData(58, "California Burrito - Marathahalli", "Mexican, Fast Food, Healthy", 25, "Outer Ring Road, Marathahalli", "Marathahalli", 4.6, 520, "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", 12.9560, 77.6980, "560037", "+91 80 4965 2211", "11:00 AM", "11:00 PM", 30.0, "Mexican quick service serving custom Burrito bowls, tacos, nachos with fresh guacamole and grilled peri chicken."));
        list.add(new RestData(59, "The Fisherman's Wharf", "Goan, Seafood, Continental", 45, "Sarjapur Road, Ambalipura, Bellandur", "Sarjapur Road", 4.6, 440, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9180, 77.6740, "560103", "+91 80 4965 2828", "12:00 PM", "11:00 PM", 45.0, "Goan holiday style restaurant famous for Goan Prawn Curry, Kingfish Fry, butter garlic lobster, and Bebinca."));
        list.add(new RestData(60, "Byg Brewski Brewing Company", "Continental, Asian, North Indian", 40, "Sarjapur Road, Hennur & Sarjapur", "Sarjapur Road", 4.8, 890, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9090, 77.6820, "560035", "+91 80 4680 9797", "12:30 PM", "11:30 PM", 45.0, "Asia's largest open-air culinary experience serving loaded platters, woodfire sourdough pizzas, and gourmet bao."));
        list.add(new RestData(61, "Zoey's Pizzeria & Cafe", "Pizza, Italian, Cafe", 30, "Kasavanahalli Main Road, Sarjapur", "Sarjapur Road", 4.5, 230, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9020, 77.6810, "560035", "+91 80 4122 1100", "11:30 AM", "10:30 PM", 35.0, "Cozy neighborhood pizzeria making handmade Neapolitan pizzas with fresh mozzarella, basil, and garlic dips."));
        list.add(new RestData(62, "Chai Point - Bellandur", "Beverages, Fast Food, Snacks", 15, "EcoSpace, Outer Ring Road, Bellandur", "Bellandur", 4.4, 490, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd", 12.9260, 77.6840, "560103", "+91 80 4099 8877", "07:00 AM", "10:00 PM", 25.0, "India's tea innovator serving Ginger Chai unheated flasks, bun samosa, banana cake, and poha breakfast."));

        // Central Business District
        list.add(new RestData(63, "Koshy's Restaurant", "Continental, British, North Indian", 30, "39 St. Marks Road, Near MG Road", "MG Road", 4.5, 590, "https://images.unsplash.com/photo-1554118811-1e0d58224f24", 12.9735, 77.6010, "560001", "+91 80 2221 3793", "09:00 AM", "11:00 PM", 35.0, "Historic intellectual gathering cafe serving colonial British breakfast, Appam with stew, and roast chicken."));
        list.add(new RestData(64, "Nagarjuna - Residency Road", "Andhra, Biryani, South Indian", 30, "44/1 Residency Road", "Residency Road", 4.7, 720, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9700, 77.6050, "560025", "+91 80 2555 9848", "11:45 AM", "11:00 PM", 35.0, "Flagship Andhra restaurant serving piping hot ghee rice, gunpowder, fiery chicken roast, and mutton chops."));
        list.add(new RestData(65, "The Only Place", "Steaks, American, Continental, Burgers", 35, "13 Museum Road, Off Church Street", "Church Street", 4.6, 470, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 12.9740, 77.6060, "560001", "+91 80 2558 8676", "12:00 PM", "11:00 PM", 35.0, "Legendary steakhouse offering juicy Chateaubriand steaks, Salisbury burgers, and warm apple pie with ice cream."));
        list.add(new RestData(66, "Matteo Coffea", "Cafe, Desserts, Beverages, Italian", 20, "2 Church Street, Off Brigade Road", "Church Street", 4.6, 680, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb", 12.9745, 77.6040, "560001", "+91 80 4333 6000", "09:00 AM", "11:30 PM", 25.0, "Vibrant coffee house famous for rich espresso blends, classic carrot cake, chocolate fudge shakes, and paninis."));
        list.add(new RestData(67, "Plan B - Castle Street", "American, Bar Food, Burgers", 30, "20 Castle Street, Ashok Nagar, Richmond Road", "Richmond Road", 4.6, 520, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 12.9660, 77.6110, "560025", "+91 88800 22005", "12:00 PM", "11:30 PM", 35.0, "Bengaluru's chicken wings institution serving fiery Ghost Pepper wings, BBQ sliders, and craft burgers."));
        list.add(new RestData(68, "Ebony - Fine Dining", "North Indian, Parsi, Mughlai", 40, "Barton Centre, 84 MG Road", "MG Road", 4.6, 380, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", 12.9748, 77.6075, "560001", "+91 80 4178 3344", "12:30 PM", "11:00 PM", 40.0, "Skyline rooftop dining overlooking CBD with rich Balti curries, Parsi Patra Ni Macchi, and Mutton Dhansak."));
        list.add(new RestData(69, "Albert Bakery", "Bakery, Street Food, Mughlai", 20, "93 Mosque Road, Frazer Town", "Frazer Town", 4.8, 590, "https://images.unsplash.com/photo-1509440159596-0249088772ff", 12.9980, 77.6160, "560005", "+91 98861 65349", "03:00 PM", "09:30 PM", 25.0, "120-year-old bakery legendary for hot mutton kheema samosas, coconut pastries, and brain puffs during Ramadan."));
        list.add(new RestData(70, "Karama Restaurant", "Mughlai, Arabian, North Indian", 35, "Mosque Road, Frazer Town", "Frazer Town", 4.5, 430, "https://images.unsplash.com/photo-1544025162-d76694265947", 12.9975, 77.6150, "560005", "+91 80 4110 9900", "12:00 PM", "11:30 PM", 35.0, "Frazer Town culinary house serving mutton Karachi biryani, Tandoori Raan, Mandi, and Kunafa dessert."));
        list.add(new RestData(71, "Thom's Bakery", "Bakery, Fast Food, Desserts", 20, "1/2 Wheeler Road, Cox Town", "Frazer Town", 4.7, 490, "https://images.unsplash.com/photo-1509440159596-0249088772ff", 12.9990, 77.6230, "560005", "+91 80 2548 4455", "08:00 AM", "09:30 PM", 25.0, "Beloved heritage bakery renowned for Plum cakes, mutton patties, chicken puffs, and freshly baked sourdough."));

        // North Bengaluru
        list.add(new RestData(72, "Nandi Upachar", "South Indian, Karnataka, Pure Veg", 25, "International Airport Road, Near Hebbal Flyover", "Hebbal", 4.5, 380, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 13.0380, 77.5920, "560024", "+91 80 2363 4455", "06:30 AM", "11:00 PM", 30.0, "Spacious highway vegetarian stop serving crispy butter dosas, poori sagu, filter coffee, and lunch thalis."));
        list.add(new RestData(73, "Arirang Korean Restaurant", "Korean, Asian, Seafood", 40, "13 Kamanahalli Main Road, HRBR Layout", "Kalyan Nagar", 4.7, 310, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 13.0180, 77.6430, "560043", "+91 80 4173 2581", "12:00 PM", "10:30 PM", 40.0, "Authentic Korean barbecue house offering tabletop pork belly grill, Kimchi Jjigae, Bibimbap, and Gimbap."));
        list.add(new RestData(74, "Once Upon a Flame", "Steaks, Continental, Burgers", 35, "CMR Road, HRBR Layout, Kalyan Nagar", "Kalyan Nagar", 4.6, 270, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 13.0160, 77.6450, "560043", "+91 80 4125 7788", "12:00 PM", "11:00 PM", 35.0, "Meat lover's haven specializing in tenderloin steaks, peri-peri grilled chicken, and loaded burgers."));
        list.add(new RestData(75, "Chetty's Corner", "Street Food, Fast Food, Snacks", 15, "Serpentine Road, Kumara Park West, Seshadripuram", "Vasanth Nagar", 4.7, 430, "https://images.unsplash.com/photo-1601050690597-df0568f70950", 12.9910, 77.5790, "560020", "+91 80 2334 0011", "11:00 AM", "10:00 PM", 25.0, "Originators of Bengaluru's famous Bun Nippat Masala, Masala Pepsi, and cheesy potato twists."));
        list.add(new RestData(76, "The Fatty Bao - Indiranagar", "Asian, Japanese, Dim Sum", 35, "610 12th Main Road, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.7, 540, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 12.9715, 77.6405, "560038", "+91 80 4411 4499", "12:00 PM", "11:00 PM", 40.0, "Trendy Asian gastrobar famous for Char Siu pork bao, Ramen bowls, sushi platters, and dim sums."));
        list.add(new RestData(77, "Sukh Sagar", "North Indian, South Indian, Fast Food, Pure Veg", 25, "Gandhi Nagar, Near Majestic", "Majestic", 4.4, 380, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9780, 77.5770, "560009", "+91 80 2226 2626", "08:00 AM", "11:00 PM", 30.0, "Classic landmark opposite Majestic offering Pav Bhaji, Chole Bhature, fruit juices, and South Indian thalis."));
        list.add(new RestData(78, "Kamath Hotel - Majestic", "South Indian, Karnataka, Pure Veg", 20, "Tank Bund Road, Majestic", "Majestic", 4.3, 290, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9770, 77.5720, "560009", "+91 80 2287 4455", "06:00 AM", "10:30 PM", 25.0, "Convenient transit hub dining serving quick hot idlis, poori, South Indian meals, and sweet badam halwa."));
        list.add(new RestData(79, "SGS Non-Veg Gundu Pulav", "Karnataka, Biryani, Non-Veg", 25, "Cottonpet Main Road, Chickpet", "Majestic", 4.7, 490, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8", 12.9690, 77.5740, "560053", "+91 98450 11223", "07:00 AM", "03:00 PM", 30.0, "City legacy hotel famous for small-grain Seeraga Samba mutton pulav cooked in pure ghee with peppery leg soup."));
        list.add(new RestData(80, "Sankey's Cafe", "Cafe, Fast Food, Beverages", 20, "Sadashivanagar, Near Sankey Tank", "Sadashivanagar", 4.5, 310, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb", 13.0090, 77.5780, "560080", "+91 80 2361 7788", "08:00 AM", "10:30 PM", 25.0, "Peaceful lakeside cafe serving English breakfast, pasta arrabbiata, cold coffee, and hot brownies."));

        // West & Northwest
        list.add(new RestData(81, "Pavithra Paradise", "South Indian, North Indian, Pure Veg", 25, "Chord Road, Vijayanagar", "Vijayanagar", 4.5, 420, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9720, 77.5380, "560040", "+91 80 2330 1122", "07:00 AM", "10:30 PM", 30.0, "West Bengaluru family vegetarian landmark famous for Rava Dosa, paneer butter masala, and fruit falooda."));
        list.add(new RestData(82, "Adyar Ananda Bhavan (A2B) - Vijayanagar", "South Indian, Sweets, Pure Veg", 25, "Service Road, Vijayanagar", "Vijayanagar", 4.4, 510, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9710, 77.5340, "560040", "+91 80 2338 9988", "07:00 AM", "10:30 PM", 25.0, "Leading South Indian vegetarian chain serving Ghee Podi Idli, Onion Rava Dosa, Chole Bhature, and Rasgulla."));
        list.add(new RestData(83, "Hotel Janatha - Vijayanagar", "South Indian, Breakfast, Tiffin", 20, "17th Cross, MC Layout, Vijayanagar", "Vijayanagar", 4.6, 330, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9730, 77.5360, "560040", "+91 80 2335 4433", "06:30 AM", "01:00 PM", 25.0, "Classic breakfast spot offering hot uddina vada, khara bath, ghee masala dosa, and strong chicory filter kaapi."));
        list.add(new RestData(84, "Navayuga Family Restaurant", "Andhra, Seafood, Biryani", 35, "Gandhi Nagar, Near Majestic", "Majestic", 4.5, 380, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 12.9760, 77.5780, "560009", "+91 80 2225 4488", "11:30 AM", "11:00 PM", 35.0, "Legendary for fiery Andhra chili fish, seer fish fry, Andhra chicken roast, and unlimited spicy lunch meals."));
        list.add(new RestData(85, "Beijing Bites - Malleshwaram", "Chinese, Thai, Asian", 30, "Sampige Road, Malleshwaram", "Malleshwaram", 4.3, 310, "https://images.unsplash.com/photo-1541832676-9b763b0239ab", 13.0060, 77.5700, "560003", "+91 80 2346 8877", "11:30 AM", "11:00 PM", 30.0, "Neighborhood favorite for Hakka noodles, crispy honey chili potatoes, Manchurian gravy, and momos."));

        // Outer Suburbs
        list.add(new RestData(86, "Windsor Pub - Vasanth Nagar", "Continental, Pub Food, Seafood", 35, "Millers Road, Vasanth Nagar", "Vasanth Nagar", 4.6, 280, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9920, 77.5930, "560052", "+91 80 4114 9223", "12:00 PM", "11:00 PM", 35.0, "Heritage pub restaurant famous for Anglo-Indian fish curry, pork vindaloo, beef chilli fry, and crab cakes."));
        list.add(new RestData(87, "Savoury Restaurant - Frazer Town", "Mughlai, Arabian, Biryani, Chinese", 30, "Mosque Road, Frazer Town", "Frazer Town", 4.5, 520, "https://images.unsplash.com/photo-1544025162-d76694265947", 12.9985, 77.6140, "560005", "+91 80 2548 8899", "11:00 AM", "11:30 PM", 30.0, "Bustling family destination famous for Arabian grilled chicken, mutton biryani, shawarma rolls, and mocktails."));
        list.add(new RestData(88, "The Pizza Bakery - Indiranagar", "Pizza, Italian, Continental", 30, "100 Feet Road, Indiranagar", "Indiranagar", 4.7, 490, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9760, 77.6415, "560038", "+91 80 4374 8877", "12:00 PM", "11:00 PM", 35.0, "Authentic wood-fired sourdough pizzas with artisanal stuffed crusts, burrata salads, and tiramisu."));
        list.add(new RestData(89, "Chulha Chauki Da Dhaba", "North Indian, Mughlai, Punjabi", 35, "Outer Ring Road, Mahadevapura", "Mahadevapura", 4.4, 390, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9910, 77.6890, "560048", "+91 80 4120 3344", "12:00 PM", "11:00 PM", 35.0, "Clay oven Punjabi specialties including Kulcha thali, Butter Chicken, Paneer Tikka Masala, and lassi."));
        list.add(new RestData(90, "Absolute Barbecues (AB's) - Marathahalli", "Barbecue, North Indian, Buffet", 40, "Near Innovative Multiplex, Marathahalli", "Marathahalli", 4.6, 610, "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", 12.9540, 77.7010, "560037", "+91 80 4965 2580", "12:00 PM", "11:00 PM", 40.0, "Interactive live table barbecue with grilled exotic skewers, crispy corn, biryani, and live wish grill."));
        list.add(new RestData(91, "Pasta Street - Whitefield", "Italian, Pizza, Continental", 35, "ITPB Main Road, Whitefield", "Whitefield", 4.5, 340, "https://images.unsplash.com/photo-1513104890138-7c749659a591", 12.9840, 77.7280, "560066", "+91 80 4099 7788", "11:30 AM", "11:00 PM", 35.0, "Italian specialty kitchen with custom pasta tossed in cheese wheel, Margherita pizza, and panna cotta."));
        list.add(new RestData(92, "Zoey's Desserts & Bakes", "Bakery, Desserts, Cafe", 25, "AECS Layout, Brookefield", "Brookefield", 4.7, 240, "https://images.unsplash.com/photo-1578985545062-69928b1d9587", 12.9680, 77.7120, "560037", "+91 80 4112 8899", "10:00 AM", "10:30 PM", 30.0, "Artisan home-style bakery offering Nutella cheesecakes, banoffee pies, brownies, and cold brew coffees."));
        list.add(new RestData(93, "Royal Andhra Spice - Yelahanka", "Andhra, Biryani, South Indian", 30, "BB Road, Yelahanka", "Yelahanka", 4.4, 290, "https://images.unsplash.com/photo-1633945274405-b6c8069047b0", 13.1000, 77.5950, "560064", "+91 80 2856 3344", "11:30 AM", "11:00 PM", 35.0, "Traditional Andhra spicy meals, bamboo chicken biryani, Gongura mutton, and sweet double ka meetha."));
        list.add(new RestData(94, "Arogya Aahaara", "South Indian, Healthy, Pure Veg", 20, "13th Main, HAL 2nd Stage, Indiranagar", "Indiranagar", 4.8, 410, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9730, 77.6380, "560038", "+91 80 4115 2233", "07:00 AM", "10:00 PM", 25.0, "Nutrient-rich South Indian eatery serving ragi dosa, millet idlis, red rice pongal, and herbal herbal tea."));
        list.add(new RestData(95, "Cheesecakes by Smoor", "Desserts, Bakery", 20, "Forum Mall, Koramangala", "Koramangala", 4.8, 380, "https://images.unsplash.com/photo-1563805042-7684c019e1cb", 12.9350, 77.6120, "560034", "+91 80 4120 5544", "10:00 AM", "11:00 PM", 25.0, "Decadent gourmet New York baked cheesecakes, blueberry compote jars, and dark chocolate ganache slices."));
        list.add(new RestData(96, "Urban Solace - Cafe for the Soul", "Cafe, Continental, Beverages", 30, "Annswamy Mudaliar Road, Ulsoor", "Ulsoor", 4.6, 260, "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb", 12.9810, 77.6200, "560042", "+91 98450 15518", "11:00 AM", "10:30 PM", 30.0, "Peaceful lakeside cafe known for pot roast, grilled sandwiches, iced lemon tea, and comedy open-mic evenings."));
        list.add(new RestData(97, "Domlur Club Kitchen", "South Indian, North Indian, Chinese", 25, "Domlur 2nd Stage, Near EGL", "Domlur", 4.3, 210, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9620, 77.6400, "560071", "+91 80 2535 3344", "07:30 AM", "10:30 PM", 30.0, "Classic multi-cuisine family diner serving South Indian tiffins, chili chicken, butter naan, and biryani."));
        list.add(new RestData(98, "Kabab Magic - Basavanagudi", "Mughlai, Fast Food, North Indian", 25, "RV Road, Minerva Circle, Basavanagudi", "Basavanagudi", 4.6, 640, "https://images.unsplash.com/photo-1544025162-d76694265947", 12.9490, 77.5750, "560004", "+91 80 2661 2233", "12:00 PM", "11:00 PM", 25.0, "Legendary Bengaluru kebab brand famous for juicy Grilled Chicken, Chicken Shawarma roll, and Mutton Seekh."));
        list.add(new RestData(99, "Goli Vada Pav No. 1", "Street Food, Fast Food, Snacks", 15, "Commercial Street, Tasker Town", "Shivajinagar", 4.5, 340, "https://images.unsplash.com/photo-1601050690597-df0568f70950", 12.9820, 77.6080, "560001", "+91 80 2559 1122", "10:00 AM", "10:00 PM", 25.0, "Indian burger staple serving spicy classic Vada Pav, Schezwan Vada Pav, Cheese Vada Pav, and Masala Fries."));
        list.add(new RestData(100, "Hotel Fanoos - Johnson Market", "Mughlai, Kebabs, Rolls", 25, "Johnson Market, Hosur Road, Richmond Town", "Richmond Road", 4.7, 710, "https://images.unsplash.com/photo-1544025162-d76694265947", 12.9610, 77.6090, "560025", "+91 80 2221 1445", "12:00 PM", "11:30 PM", 25.0, "Iconic roll joint famous for monster Jumbo Beef/Mutton Sheekh roll, Chicken Shawarma, and crispy parottas."));
        list.add(new RestData(101, "Suryawanshi - Maharashtrian", "Maharashtrian, North Indian, Seafood", 35, "Whitefield Main Road & Indiranagar", "Whitefield", 4.6, 320, "https://images.unsplash.com/photo-1546833999-b9f581a1996d", 12.9750, 77.7300, "560066", "+91 80 4110 3300", "11:30 AM", "11:00 PM", 35.0, "Spicy Kolhapuri mutton thali, Misal Pav, Puran Poli, Kothimbir Vadi, and Kokum Sharbat."));
        list.add(new RestData(102, "Mezzeh Mediterranean Kitchen", "Mediterranean, Arabian, Healthy", 30, "100 Feet Road, Indiranagar", "Indiranagar", 4.7, 280, "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", 12.9755, 77.6410, "560038", "+91 80 4155 7788", "12:00 PM", "10:30 PM", 35.0, "Fresh Hummus Falafel platters, Fattoush salad, Chicken Shish Taouk, and freshly baked pita bread."));
        list.add(new RestData(103, "Madurai Idly Shop - Indiranagar", "South Indian, Breakfast, Pure Veg", 15, "100 Feet Road, Indiranagar", "Indiranagar", 4.5, 410, "https://images.unsplash.com/photo-1589301760014-d929f3979dbc", 12.9720, 77.6420, "560038", "+91 80 4125 6677", "06:00 AM", "11:00 PM", 25.0, "Tamil-style soft mallipoo idlis with 4 varieties of fresh chutneys, podi dosas, and filter coffee."));
        list.add(new RestData(104, "Leon's Burgers & Wings", "Burgers, Fast Food, American", 25, "Koramangala 5th Block & Indiranagar", "Koramangala", 4.6, 680, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", 12.9340, 77.6150, "560034", "+91 80 4123 9900", "11:00 AM", "01:00 AM", 30.0, "Crispy fried chicken burgers, peri peri crinkle fries, hot buffalo wings, and creamy thickshakes."));
        list.add(new RestData(105, "The Filter Coffee - Koramangala", "South Indian, Breakfast, Pure Veg", 20, "8th Main, 4th Block, Koramangala", "Koramangala", 4.8, 540, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd", 12.9315, 77.6240, "560034", "+91 80 4099 3322", "06:30 AM", "10:30 PM", 25.0, "Authentic brass tumbler degree filter coffee paired with mini ghee idlis, onion uttapam, and pineapple kesari."));

        return list;
    }

    private static void seedMenus(Connection con) throws Exception {
        System.out.println("Seeding categorized menus for all restaurants...");

        // Ensure category mappings for existing menu items (menu_id 1..16)
        try (Statement st = con.createStatement()) {
            st.executeUpdate("UPDATE menu SET category_name='Breakfast Specials', is_veg=TRUE, is_popular=TRUE, preparation_time='10-15 mins' WHERE menu_id IN (1,2,5,6,9,10)");
            st.executeUpdate("UPDATE menu SET category_name='Crispy Dosas', is_veg=TRUE, is_popular=TRUE, preparation_time='15 mins' WHERE menu_id IN (3,4,11,12)");
            st.executeUpdate("UPDATE menu SET category_name='Biryani Specials', is_veg=FALSE, is_popular=TRUE, preparation_time='20 mins' WHERE menu_id IN (7,8,13,14)");
            st.executeUpdate("UPDATE menu SET category_name='Beverages', is_veg=TRUE, is_popular=FALSE, preparation_time='5 mins' WHERE menu_id IN (15,16)");
        }

        for (int rId = 1; rId <= 105; rId++) {
            seedMenuForRestaurant(con, rId);
        }

        // Seed menu_category table from menu categories and update category_id
        System.out.println("Populating menu_category table and linking category_id...");
        try (Statement st = con.createStatement()) {
            st.executeUpdate("INSERT INTO menu_category (restaurant_id, name, description, display_order) " +
                "SELECT DISTINCT m.restaurant_id, m.category_name, CONCAT(m.category_name, ' specials'), 1 " +
                "FROM menu m " +
                "WHERE m.category_name IS NOT NULL AND m.category_name != '' " +
                "AND NOT EXISTS (SELECT 1 FROM menu_category mc WHERE mc.restaurant_id = m.restaurant_id AND mc.name = m.category_name)");

            st.executeUpdate("UPDATE menu m " +
                "JOIN menu_category mc ON m.restaurant_id = mc.restaurant_id AND m.category_name = mc.name " +
                "SET m.category_id = mc.category_id " +
                "WHERE m.category_id IS NULL OR m.category_id = 0");
        }
    }

    private static void seedMenuForRestaurant(Connection con, int rId) throws Exception {
        if (rId == 1 || rId == 2 || rId == 6 || rId == 9 || rId == 11 || rId == 12 || rId == 15 || rId == 18 || rId == 42 || rId == 45 || rId == 72 || rId == 83 || rId == 94 || rId == 103 || rId == 105) {
            // South Indian Breakfast
            addMenu(con, rId, "Breakfast Specials", "Steamed Idli (2 pcs)", "Soft melt-in-mouth steamed rice cakes served with hot sambar and coconut chutney.", 50.0, 4.8, true, true, "10 mins", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc");
            addMenu(con, rId, "Breakfast Specials", "Crispy Medu Vada (1 pc)", "Deep-fried lentil donut with crisp exterior and fluffy center.", 40.0, 4.7, true, true, "10 mins", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc");
            addMenu(con, rId, "Breakfast Specials", "Khara Bath (Chow Chow Bath)", "Semolina cooked with vegetables, mustard seeds, curry leaves, and aromatic spices.", 55.0, 4.6, true, false, "12 mins", "https://images.unsplash.com/photo-1589301760014-d929f3979dbc");
            addMenu(con, rId, "Crispy Dosas", "Benne Masala Dosa", "Crispy golden crepe roasted in pure butter, stuffed with spiced potato mash.", 95.0, 4.9, true, true, "15 mins", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4");
            addMenu(con, rId, "Crispy Dosas", "Open Butter Masala Dosa", "Thick fluffy spongy dosa topped with chutney powder, butter, and potato masala.", 105.0, 4.8, true, true, "15 mins", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4");
            addMenu(con, rId, "Crispy Dosas", "Ghee Onion Rava Dosa", "Lacy crispy semolina crepe loaded with chopped onions, green chilies, and pure ghee.", 110.0, 4.6, true, false, "18 mins", "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4");
            addMenu(con, rId, "Snacks & Sweets", "Kesari Bath", "Traditional saffron semolina pudding garnished with roasted cashews and raisins in ghee.", 50.0, 4.7, true, false, "10 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
            addMenu(con, rId, "Beverages", "Signature Filter Coffee", "Authentic South Indian chicory-infused filter coffee frothed in fresh dairy milk.", 35.0, 4.9, true, true, "5 mins", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd");
        } else if (rId == 5 || rId == 7 || rId == 23 || rId == 24 || rId == 39 || rId == 44 || rId == 46 || rId == 48 || rId == 50 || rId == 51 || rId == 79 || rId == 84 || rId == 93) {
            // Biryani & Andhra / Military
            addMenu(con, rId, "Biryani Specials", "Chicken Boneless Biryani", "Aromatic basmati rice layered with juicy marinated chicken pieces in spicy gravy.", 280.0, 4.8, false, true, "20 mins", "https://images.unsplash.com/photo-1633945274405-b6c8069047b0");
            addMenu(con, rId, "Biryani Specials", "Mutton Donne Biryani", "Traditional seeraga samba rice cooked with tender mutton chunks and coriander-mint paste in leaf bowls.", 320.0, 4.9, false, true, "20 mins", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8");
            addMenu(con, rId, "Biryani Specials", "Special Veg Paneer Biryani", "Fragrant saffron rice layered with spiced cottage cheese cubes, fried onions, and mint.", 220.0, 4.5, true, false, "18 mins", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8");
            addMenu(con, rId, "Starters & Appetizers", "Andhra Chilli Chicken", "Crisp boneless chicken tossed with slit green chilies, curry leaves, and lemon juice.", 240.0, 4.8, false, true, "15 mins", "https://images.unsplash.com/photo-1544025162-d76694265947");
            addMenu(con, rId, "Starters & Appetizers", "Guntur Paneer 65", "Golden crispy cottage cheese cubes seasoned with spicy red Guntur chili seasoning.", 190.0, 4.6, true, false, "15 mins", "https://images.unsplash.com/photo-1544025162-d76694265947");
            addMenu(con, rId, "Curries & Gravies", "Nati Koli Curry", "Country chicken simmered in a robust peppery coconut-coriander rustic gravy.", 270.0, 4.7, false, true, "20 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
            addMenu(con, rId, "Breads & Rice", "Malabar Parotta (2 pcs)", "Layered flaky Kerala flatbread cooked golden crisp on the tawa with ghee.", 60.0, 4.8, true, true, "10 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
        } else if (rId == 4 || rId == 19 || rId == 27 || rId == 29 || rId == 33 || rId == 49 || rId == 69 || rId == 71 || rId == 92 || rId == 95) {
            // Desserts, Bakery & Ice Cream
            addMenu(con, rId, "Signature Sundaes", "Death By Chocolate (DBC)", "Warm chocolate cake topped with double scoops of vanilla ice cream, hot chocolate fudge, and roasted peanuts.", 220.0, 4.9, true, true, "10 mins", "https://images.unsplash.com/photo-1563805042-7684c019e1cb");
            addMenu(con, rId, "Signature Sundaes", "Hot Fudge Brownie Sundae", "Gooey baked chocolate brownie served warm with vanilla bean gelato and Belgian fudge.", 180.0, 4.8, true, true, "10 mins", "https://images.unsplash.com/photo-1563805042-7684c019e1cb");
            addMenu(con, rId, "Cakes & Pastries", "Red Velvet Cupcake", "Moist crimson sponge topped with velvety smooth cream cheese frosting.", 90.0, 4.7, true, true, "5 mins", "https://images.unsplash.com/photo-1578985545062-69928b1d9587");
            addMenu(con, rId, "Cakes & Pastries", "Artisan Chocolate Truffle Pastry", "Multi-layered dark Belgian chocolate ganache sponge cake.", 140.0, 4.8, true, true, "5 mins", "https://images.unsplash.com/photo-1578985545062-69928b1d9587");
            addMenu(con, rId, "Cakes & Pastries", "Signature Khara Bun", "Spicy baked onion and chili bun loaded with herb butter.", 45.0, 4.9, true, true, "5 mins", "https://images.unsplash.com/photo-1509440159596-0249088772ff");
            addMenu(con, rId, "Shakes & Beverages", "Thick Nutella Shake", "Rich and creamy milkshake blended with pure hazelnut Nutella spread and whipped cream.", 160.0, 4.7, true, false, "8 mins", "https://images.unsplash.com/photo-1563805042-7684c019e1cb");
        } else if (rId == 8 || rId == 25 || rId == 28 || rId == 38 || rId == 56 || rId == 61 || rId == 67 || rId == 74 || rId == 88 || rId == 104) {
            // Burgers, Pizzas, Continental & Cafe
            addMenu(con, rId, "Gourmet Burgers", "All American Cheese Chicken Burger", "Juicy grilled chicken patty with melted cheddar, gherkins, caramelized onions, and secret sauce.", 240.0, 4.8, false, true, "15 mins", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd");
            addMenu(con, rId, "Gourmet Burgers", "Crispy Veg Paneer Crunch Burger", "Spiced crispy cottage cheese patty layered with lettuce, tomatoes, and spicy chipotle mayo.", 190.0, 4.6, true, false, "15 mins", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd");
            addMenu(con, rId, "Wood-Fired Pizzas", "Margherita Basilico Pizza (10 inch)", "Hand-stretched sourdough pizza with San Marzano tomato sauce, fresh mozzarella, and basil.", 340.0, 4.8, true, true, "20 mins", "https://images.unsplash.com/photo-1513104890138-7c749659a591");
            addMenu(con, rId, "Wood-Fired Pizzas", "Barbecue Chicken Sourdough Pizza", "Smoked barbecue chicken strips, red onions, jalapeños, and melted mozzarella.", 420.0, 4.9, false, true, "20 mins", "https://images.unsplash.com/photo-1513104890138-7c749659a591");
            addMenu(con, rId, "Sides & Starters", "Peri-Peri Seasoned Fries", "Crispy potato french fries tossed in spicy African peri-peri herb seasoning.", 120.0, 4.7, true, false, "10 mins", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd");
            addMenu(con, rId, "Sides & Starters", "Cheesy Garlic Breadsticks", "Freshly baked herb sourdough breadsticks brushed with garlic butter and melted mozzarella.", 150.0, 4.7, true, true, "12 mins", "https://images.unsplash.com/photo-1513104890138-7c749659a591");
            addMenu(con, rId, "Beverages", "Iced Cold Brew Coffee", "Steeped single-origin Arabica coffee served chilled over crystal ice.", 140.0, 4.7, true, false, "5 mins", "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb");
        } else {
            // Multi-Cuisine / Asian / North Indian / Street Food
            addMenu(con, rId, "Starters & Kebabs", "Paneer Tikka Angara", "Charcoal-grilled cottage cheese cubes marinated in yogurt and tandoori spices.", 220.0, 4.7, true, true, "18 mins", "https://images.unsplash.com/photo-1544025162-d76694265947");
            addMenu(con, rId, "Starters & Kebabs", "Chicken Reshmi Kebab", "Melt-in-mouth chicken skewers marinated in cream, cashew paste, and aromatic spices.", 280.0, 4.8, false, true, "20 mins", "https://images.unsplash.com/photo-1544025162-d76694265947");
            addMenu(con, rId, "Main Course Curries", "Paneer Butter Masala", "Cottage cheese cubes simmered in rich creamy tomato cashew gravy with fenugreek.", 230.0, 4.8, true, true, "20 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
            addMenu(con, rId, "Main Course Curries", "Murgh Makhani (Butter Chicken)", "Tandoori chicken pieces cooked in a silky, rich butter-infused tomato gravy.", 310.0, 4.9, false, true, "22 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
            addMenu(con, rId, "Rice & Noodles", "Hakka Veg Noodles", "Wok-tossed stir fry noodles with crunchy shredded vegetables and soy sauce.", 180.0, 4.5, true, false, "15 mins", "https://images.unsplash.com/photo-1541832676-9b763b0239ab");
            addMenu(con, rId, "Rice & Noodles", "Butter Garlic Naan", "Tandoor-baked leavened flatbread brushed with fresh garlic and melted butter.", 60.0, 4.8, true, true, "10 mins", "https://images.unsplash.com/photo-1546833999-b9f581a1996d");
            addMenu(con, rId, "Beverages", "Fresh Mango Lassi", "Thick churned sweet yogurt drink blended with Alphonso mango pulp.", 90.0, 4.8, true, true, "5 mins", "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd");
        }
    }

    private static void addMenu(Connection con, int rId, String cat, String name, String desc, double price, double rating, boolean veg, boolean pop, String time, String img) {
        String checkSql = "SELECT menu_id FROM menu WHERE restaurant_id = ? AND item_name = ?";
        try (PreparedStatement psCheck = con.prepareStatement(checkSql)) {
            psCheck.setInt(1, rId);
            psCheck.setString(2, name);
            try (ResultSet rs = psCheck.executeQuery()) {
                if (rs.next()) {
                    // Update existing
                    int menuId = rs.getInt(1);
                    String updateSql = "UPDATE menu SET category_name=?, description=?, price=?, rating=?, is_available=TRUE, is_veg=?, is_popular=?, preparation_time=?, image_path=? WHERE menu_id=?";
                    try (PreparedStatement psUp = con.prepareStatement(updateSql)) {
                        psUp.setString(1, cat);
                        psUp.setString(2, desc);
                        psUp.setDouble(3, price);
                        psUp.setDouble(4, rating);
                        psUp.setBoolean(5, veg);
                        psUp.setBoolean(6, pop);
                        psUp.setString(7, time);
                        psUp.setString(8, img);
                        psUp.setInt(9, menuId);
                        psUp.executeUpdate();
                    }
                    return;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        String sql = "INSERT INTO menu (restaurant_id, category_name, item_name, description, price, rating, is_available, is_veg, is_popular, preparation_time, image_path) " +
            "VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?)";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, rId);
            ps.setString(2, cat);
            ps.setString(3, name);
            ps.setString(4, desc);
            ps.setDouble(5, price);
            ps.setDouble(6, rating);
            ps.setBoolean(7, veg);
            ps.setBoolean(8, pop);
            ps.setString(9, time);
            ps.setString(10, img);
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
