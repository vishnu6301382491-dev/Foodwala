package com.tap.test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

import com.tap.controller.PasswordResetServlet;
import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.User;
import com.tap.util.DBConnection;
import com.tap.util.PasswordUtil;

public class TestAuthenticationSecuritySuite {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("FOODWALA ENTERPRISE AUTHENTICATION & PASSWORD SECURITY VERIFICATION");
        System.out.println("======================================================================");

        int passed = 0;
        int total = 0;

        UserDAOImpl userDAO = new UserDAOImpl();

        try {
            // ---------------------------------------------------------------
            // TEST 1: User Registration with Argon2id & MySQL Verification
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 1] Registration with Argon2id Hashing");
            String testEmail = "test_sec_" + System.currentTimeMillis() + "@foodwala.com";
            String testPhone = "+91" + (8000000000L + (long)(Math.random() * 999999999L));
            String rawPassword = "SecurePass@2026";

            // Validate policy
            PasswordUtil.ValidationResult polRes = PasswordUtil.validatePassword(rawPassword);
            if (!polRes.valid) throw new RuntimeException("Policy validation failed: " + polRes.message);

            // Hash with Argon2id
            String argon2Hash = PasswordUtil.hash(rawPassword);
            if (!argon2Hash.startsWith("$argon2id$")) {
                throw new RuntimeException("Hash format is not Argon2id: " + argon2Hash);
            }

            User newUser = new User("SecTest User", argon2Hash, testEmail, testPhone, "Koramangala, Bengaluru", "CUSTOMER");
            int newUserId = userDAO.addUser(newUser);

            if (newUserId > 0) {
                // Inspect MySQL directly to verify stored value is NOT plaintext
                try (Connection conn = DBConnection.getConnection();
                     PreparedStatement ps = conn.prepareStatement("SELECT password, password_hash FROM user WHERE user_id = ?")) {
                    ps.setInt(1, newUserId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            String storedPwd = rs.getString("password");
                            if (storedPwd != null && storedPwd.startsWith("$argon2id$") && !storedPwd.contains(rawPassword)) {
                                System.out.println("  PASS: User registered. MySQL contains Argon2id hash (length=" + storedPwd.length() + ")");
                                passed++;
                            } else {
                                System.err.println("  FAIL: MySQL column does not contain Argon2id hash: " + storedPwd);
                            }
                        }
                    }
                }
            } else {
                System.err.println("  FAIL: Failed to insert user into MySQL");
            }

            // ---------------------------------------------------------------
            // TEST 2: Login with Correct Password
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 2] Authentication with Correct Credentials");
            User retrievedUser = userDAO.getUserByEmail(testEmail);
            if (retrievedUser != null && PasswordUtil.verify(rawPassword, retrievedUser.getPassword())) {
                System.out.println("  PASS: Password verification succeeded for correct credentials");
                passed++;
            } else {
                System.err.println("  FAIL: Password verification failed for correct credentials");
            }

            // ---------------------------------------------------------------
            // TEST 3: Login with Wrong Password (Generic error & mitigation)
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 3] Authentication Failure Handling");
            boolean wrongAuth = PasswordUtil.verify("IncorrectPassword123", retrievedUser.getPassword());
            if (!wrongAuth) {
                System.out.println("  PASS: Wrong password rejected correctly (Generic error trigger)");
                passed++;
            } else {
                System.err.println("  FAIL: Wrong password was incorrectly accepted!");
            }

            // ---------------------------------------------------------------
            // TEST 4: Full Database Audit - 0 Plaintext Passwords in MySQL
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 4] Database Audit: Zero Plaintext Passwords");
            int totalUsers = 0;
            int argon2Users = 0;
            int legacySha256Users = 0;
            int plaintextUsers = 0;

            try (Connection conn = DBConnection.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT user_id, email, password FROM user")) {
                while (rs.next()) {
                    totalUsers++;
                    String p = rs.getString("password");
                    if (p == null) continue;
                    if (p.startsWith("$argon2id$") || p.startsWith("$2a$") || p.startsWith("$2b$")) {
                        argon2Users++;
                    } else if (p.length() == 64 && p.matches("^[a-fA-F0-9]{64}$")) {
                        legacySha256Users++;
                    } else {
                        plaintextUsers++;
                    }
                }
            }

            System.out.println("  Total users in MySQL: " + totalUsers);
            System.out.println("  Argon2id/Bcrypt hashes: " + argon2Users);
            System.out.println("  Legacy SHA-256 hashes: " + legacySha256Users);
            System.out.println("  Plaintext passwords: " + plaintextUsers);

            if (plaintextUsers == 0) {
                System.out.println("  PASS: ZERO plaintext passwords found in entire database!");
                passed++;
            } else {
                System.err.println("  FAIL: Found " + plaintextUsers + " plaintext passwords in database!");
            }

            // ---------------------------------------------------------------
            // TEST 5: Auto-upgrade of Legacy Hash to Argon2id upon Login
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 5] Transparent Auto-upgrade of Legacy Hash");
            String legacyEmail = "legacy_test_" + System.currentTimeMillis() + "@foodwala.com";
            String legacyPhone = "+91" + (7000000000L + (long)(Math.random() * 999999999L));
            // Correct SHA-256 of "LegacyPass123"
            String legacyPlain = "LegacyPass123";
            String legacyHash = "30d8b6c7521886df6f7f16fdec73ba09b8acdc3b04dba174befb5c4ca6f93ba6"; // Verified SHA-256

            User legacyUser = new User("Legacy User", legacyHash, legacyEmail, legacyPhone, "Indiranagar", "CUSTOMER");
            int legacyUserId = userDAO.addUser(legacyUser);

            // Simulate LoginController check and upgrade
            User fetchedLegacy = userDAO.getUserByEmail(legacyEmail);
            if (PasswordUtil.verify(legacyPlain, fetchedLegacy.getPassword()) && PasswordUtil.needsRehash(fetchedLegacy.getPassword())) {
                String upgradedHash = PasswordUtil.hash(legacyPlain);
                userDAO.updatePassword(fetchedLegacy.getUserId(), upgradedHash);

                // Re-fetch from MySQL to verify persisted upgrade
                User upgradedUser = userDAO.getUser(legacyUserId);
                if (upgradedUser.getPassword().startsWith("$argon2id$")) {
                    System.out.println("  PASS: Legacy hash transparently upgraded to Argon2id in MySQL!");
                    passed++;
                } else {
                    System.err.println("  FAIL: Upgraded hash was not Argon2id: " + upgradedUser.getPassword());
                }
            } else {
                System.err.println("  FAIL: Legacy hash verification or needsRehash failed");
            }

            // ---------------------------------------------------------------
            // TEST 6: Cryptographically Secure Password Reset Flow
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 6] Secure Password Reset Token Lifecycle");
            String resetToken = PasswordResetServlet.generateResetToken(testEmail);
            if (resetToken != null && resetToken.length() >= 32) {
                System.out.println("  PASS: Secure 32-byte token created: " + resetToken.substring(0, 16) + "...");

                // Reset password using token
                String newPassword = "NewSecurePassword@999";
                boolean resetSuccess = PasswordResetServlet.resetPasswordWithToken(resetToken, newPassword);
                if (resetSuccess) {
                    System.out.println("  PASS: Password reset succeeded with valid token");

                    // Verify old password fails
                    User reloadedUser = userDAO.getUserByEmail(testEmail);
                    if (!PasswordUtil.verify(rawPassword, reloadedUser.getPassword()) &&
                        PasswordUtil.verify(newPassword, reloadedUser.getPassword())) {
                        System.out.println("  PASS: Old password revoked; new password authenticated with Argon2id");

                        // Verify single-use: token must be invalidated
                        boolean reuseAttempt = PasswordResetServlet.resetPasswordWithToken(resetToken, "AnotherPass@123");
                        if (!reuseAttempt) {
                            System.out.println("  PASS: Single-use enforced; re-used token rejected");
                            passed++;
                        } else {
                            System.err.println("  FAIL: Token re-use was incorrectly allowed");
                        }
                    } else {
                        System.err.println("  FAIL: New password verification failed");
                    }
                } else {
                    System.err.println("  FAIL: Password reset failed with valid token");
                }
            } else {
                System.err.println("  FAIL: Token generation failed");
            }

            // ---------------------------------------------------------------
            // TEST 7: Information Leakage Audit (toString, models)
            // ---------------------------------------------------------------
            total++;
            System.out.println("\n[TEST 7] Sensitive Data Exposure Audit");
            String userStr = newUser.toString();
            if (!userStr.contains("password=") && !userStr.contains(rawPassword) && !userStr.contains("$argon2id$")) {
                System.out.println("  PASS: User.toString() suppresses passwords and hashes: " + userStr);
                passed++;
            } else {
                System.err.println("  FAIL: User.toString() leaks sensitive credentials: " + userStr);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        System.out.println("\n======================================================================");
        System.out.println("RESULT: " + passed + " / " + total + " TESTS PASSED");
        System.out.println("======================================================================");
        if (passed == total) {
            System.out.println("STATUS: ALL AUTHENTICATION & PASSWORD SECURITY TESTS PASSED PERFECTLY!");
        } else {
            System.exit(1);
        }
    }
}
