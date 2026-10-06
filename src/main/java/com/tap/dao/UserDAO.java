package com.tap.dao;

import com.tap.model.User;

public interface UserDAO {
    int addUser(User user);
    User getUser(int userId);
    User getUserByEmail(String email);
    int updateUser(User user);
    int deleteUser(int userId);
}
