CREATE DATABASE IF NOT EXISTS fudwala;
USE fudwala;

DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS restaurant;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER'
);

CREATE TABLE restaurant (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    cuisine_type VARCHAR(100) NOT NULL,
    delivery_time INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    admin_user_id INT,
    rating DOUBLE DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_path VARCHAR(500),
    CONSTRAINT fk_restaurant_user FOREIGN KEY (admin_user_id)
        REFERENCES `user`(user_id)
);

CREATE TABLE menu (
    menu_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    price DOUBLE NOT NULL,
    rating DOUBLE DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    image_path VARCHAR(500),
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id)
        REFERENCES restaurant(restaurant_id)
        ON DELETE CASCADE
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    user_id INT NOT NULL,
    total_amount DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLACED',
    payment_mode VARCHAR(50) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id)
        REFERENCES restaurant(restaurant_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES `user`(user_id)
);

CREATE TABLE order_item (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_id INT NOT NULL,
    quantity INT NOT NULL,
    total_price DOUBLE NOT NULL,
    item_total DOUBLE NOT NULL DEFAULT 0,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_item_menu FOREIGN KEY (menu_id)
        REFERENCES menu(menu_id)
);

INSERT INTO `user` (username,password,email,phone,address,role) VALUES
('rahul','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','rahul@gmail.com','9876543210','Koramangala, Bangalore','CUSTOMER'),
('suresh','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','suresh@gmail.com','9876543211','HSR Layout, Bangalore','CUSTOMER'),
('admin1','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','admin1@fudwala.com','9876543212','Indiranagar, Bangalore','RESTAURANT_ADMIN');

INSERT INTO restaurant
(name,cuisine_type,delivery_time,address,admin_user_id,rating,is_active,image_path)
VALUES
('Namma Meals','South Indian',30,'Koramangala, Bangalore',3,4.5,TRUE,'https://images.unsplash.com/photo-1601050690597-df0568f70950'),
('Bangalore Biryani House','Biryani',40,'HSR Layout, Bangalore',3,4.3,TRUE,'https://images.unsplash.com/photo-1563379091339-03246963d51a'),
('Udupi Garden','Indian',25,'Jayanagar, Bangalore',3,4.4,TRUE,'https://images.unsplash.com/photo-1585937421612-70a008356fbe'),
('Pizza Corner','Italian',35,'Indiranagar, Bangalore',3,4.2,TRUE,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002'),
('Andhra Spice','Andhra',35,'BTM Layout, Bangalore',3,4.6,TRUE,'https://images.unsplash.com/photo-1547573854-74d2a71d0826');

INSERT INTO menu
(restaurant_id,item_name,description,price,rating,is_available,image_path)
VALUES
(1,'Masala Dosa','Crispy dosa served with chutney and sambar',90,4.5,TRUE,'https://images.unsplash.com/photo-1668236543090-82eba5ee5976'),
(1,'Idli Vada','Soft idli and crispy vada with sambar',110,4.4,TRUE,'https://images.unsplash.com/photo-1589302168068-964664d93dc0'),
(1,'Paneer Dosa','Dosa filled with spicy paneer masala',150,4.3,TRUE,'https://images.unsplash.com/photo-1601050690597-df0568f70950'),
(2,'Chicken Biryani','Hyderabadi style chicken biryani',220,4.6,TRUE,'https://images.unsplash.com/photo-1563379091339-03246963d51a'),
(2,'Mutton Biryani','Aromatic mutton dum biryani',280,4.7,TRUE,'https://images.unsplash.com/photo-1633945274309-2c16e48d8b9e'),
(2,'Chicken 65','Spicy crispy chicken bites',190,4.4,TRUE,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d'),
(3,'Paneer Butter Masala','Paneer cooked in rich tomato gravy',190,4.4,TRUE,'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7'),
(3,'Veg Thali','Complete South Indian vegetarian thali',180,4.5,TRUE,'https://images.unsplash.com/photo-1546833999-b9f581a1996d'),
(4,'Margherita Pizza','Classic tomato, mozzarella and basil pizza',220,4.3,TRUE,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002'),
(4,'Farmhouse Pizza','Loaded vegetable farmhouse pizza',280,4.5,TRUE,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38'),
(5,'Andhra Chicken Curry','Spicy Andhra style chicken curry',240,4.6,TRUE,'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398'),
(5,'Gutti Vankaya','Stuffed brinjal Andhra special',170,4.4,TRUE,'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7');

-- Sample orders are intentionally not inserted; they are created by checkout.
