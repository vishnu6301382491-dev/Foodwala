package com.tap.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public final class DBConnection {

    private static String getEnvOrProp(String key, String fallback) {
        String val = System.getenv(key);
        if (val != null && !val.isBlank()) return val.trim();
        val = System.getProperty(key);
        if (val != null && !val.isBlank()) return val.trim();
        return fallback;
    }

    public static String getUrl() {
        String host = getEnvOrProp("DB_HOST", "localhost");
        String port = getEnvOrProp("DB_PORT", "3306");
        String dbName = getEnvOrProp("DB_NAME", "fudwala");
        return "jdbc:mysql://" + host + ":" + port + "/" + dbName + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    }

    public static String getUsername() {
        return getEnvOrProp("DB_USER", getEnvOrProp("DB_USERNAME", "root"));
    }

    public static String getPassword() {
        return getEnvOrProp("DB_PASSWORD", "");
    }

    private DBConnection() {
    }

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("Warning: Class.forName(com.mysql.cj.jdbc.Driver) failed. Falling back to DriverManager SPI lookup: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(getUrl(), getUsername(), getPassword());
    }
}
