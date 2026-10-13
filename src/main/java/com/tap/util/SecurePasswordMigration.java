package com.tap.util;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Safe database migration to upgrade FoodWala user passwords to Argon2id.
 * - Ensures password and password_hash columns are VARCHAR(255)
 * - Safely hashes any legacy plaintext passwords to Argon2id
 * - Upgrades known SHA-256 seed passwords to Argon2id
 * - NEVER prints plaintext passwords in logs or output
 */
public class SecurePasswordMigration {

    public static void main(String[] args) {
        migratePasswords();
    }

    public static void migratePasswords() {
        System.out.println("==================================================");
        System.out.println("STARTING FOODWALA SECURE PASSWORD STORAGE MIGRATION");
        System.out.println("==================================================");

        try (Connection con = DBConnection.getConnection();
             Statement st = con.createStatement()) {

            // 1. Ensure password column is VARCHAR(255)
            st.executeUpdate("ALTER TABLE `user` MODIFY COLUMN `password` VARCHAR(255) NOT NULL");
            System.out.println("[Migration] Verified column `password` is VARCHAR(255)");

            // 2. Add password_hash column if not already present
            addColumnIfNotExists(st, "user", "password_hash", "VARCHAR(255) NULL");

            // 3. Scan and upgrade existing user passwords
            int migratedCount = 0;
            int totalUsers = 0;

            String selectSql = "SELECT user_id, password FROM `user`";
            String updateSql = "UPDATE `user` SET password = ?, password_hash = ? WHERE user_id = ?";

            try (PreparedStatement selectPs = con.prepareStatement(selectSql);
                 PreparedStatement updatePs = con.prepareStatement(updateSql);
                 ResultSet rs = selectPs.executeQuery()) {

                while (rs.next()) {
                    totalUsers++;
                    int userId = rs.getInt("user_id");
                    String currentVal = rs.getString("password");

                    if (currentVal == null || currentVal.isBlank()) {
                        continue;
                    }

                    // Already Argon2id?
                    if (currentVal.startsWith("$argon2id$")) {
                        // Just ensure password_hash is mirrored
                        updatePs.setString(1, currentVal);
                        updatePs.setString(2, currentVal);
                        updatePs.setInt(3, userId);
                        updatePs.executeUpdate();
                        continue;
                    }

                    String newSecureHash = null;

                    // Known demo seed SHA-256 for '123456'
                    if ("8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92".equalsIgnoreCase(currentVal)) {
                        newSecureHash = PasswordUtil.hash("123456");
                    } else if (currentVal.length() == 64 && currentVal.matches("^[0-9a-fA-F]{64}$")) {
                        // Other legacy SHA-256 hashes will be upgraded upon user's next login
                        // Keep mirrored
                        updatePs.setString(1, currentVal);
                        updatePs.setString(2, currentVal);
                        updatePs.setInt(3, userId);
                        updatePs.executeUpdate();
                        continue;
                    } else {
                        // Plaintext password detected: hash with Argon2id immediately
                        newSecureHash = PasswordUtil.hash(currentVal);
                    }

                    if (newSecureHash != null) {
                        updatePs.setString(1, newSecureHash);
                        updatePs.setString(2, newSecureHash);
                        updatePs.setInt(3, userId);
                        updatePs.executeUpdate();
                        migratedCount++;
                    }
                }
            }

            System.out.println("[Migration] Total users inspected: " + totalUsers);
            System.out.println("[Migration] Users upgraded to Argon2id: " + migratedCount);
            System.out.println("==================================================");
            System.out.println("SECURE PASSWORD MIGRATION COMPLETED SUCCESSFULLY!");
            System.out.println("==================================================");

        } catch (Exception e) {
            System.err.println("[Migration Error] " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void addColumnIfNotExists(Statement st, String table, String column, String definition) {
        try {
            st.executeUpdate("ALTER TABLE `" + table + "` ADD COLUMN `" + column + "` " + definition);
            System.out.println("[Migration] Added column `" + column + "` to table `" + table + "`");
        } catch (Exception e) {
            // Column already exists
        }
    }
}
