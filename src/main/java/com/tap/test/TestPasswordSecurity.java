package com.tap.test;

import com.tap.util.PasswordUtil;
import com.tap.util.PasswordUtil.ValidationResult;

public class TestPasswordSecurity {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("TESTING FOODWALA SECURE PASSWORD STORAGE (ARGON2ID)");
        System.out.println("==================================================");

        int passed = 0;
        int total = 0;

        // 1. Password Policy: Empty
        total++;
        ValidationResult v1 = PasswordUtil.validatePassword("");
        if (!v1.valid && v1.message.contains("empty")) {
            System.out.println("PASS: Empty password rejected");
            passed++;
        } else {
            System.err.println("FAIL: Empty password not rejected properly");
        }

        // 2. Password Policy: < 8 chars
        total++;
        ValidationResult v2 = PasswordUtil.validatePassword("Pass1");
        if (!v2.valid && v2.message.contains("at least 8")) {
            System.out.println("PASS: Short password (<8) rejected");
            passed++;
        } else {
            System.err.println("FAIL: Short password not rejected");
        }

        // 3. Password Policy: Letters only
        total++;
        ValidationResult v3 = PasswordUtil.validatePassword("OnlyLettersHere");
        if (!v3.valid && v3.message.contains("at least one letter and one number")) {
            System.out.println("PASS: Letters-only password rejected");
            passed++;
        } else {
            System.err.println("FAIL: Letters-only password not rejected");
        }

        // 4. Password Policy: Numbers only
        total++;
        ValidationResult v4 = PasswordUtil.validatePassword("1234567890");
        if (!v4.valid && v4.message.contains("at least one letter and one number")) {
            System.out.println("PASS: Numbers-only password rejected");
            passed++;
        } else {
            System.err.println("FAIL: Numbers-only password not rejected");
        }

        // 5. Password Policy: Valid password
        total++;
        ValidationResult v5 = PasswordUtil.validatePassword("SecretPass123");
        if (v5.valid) {
            System.out.println("PASS: Strong password accepted");
            passed++;
        } else {
            System.err.println("FAIL: Strong password rejected: " + v5.message);
        }

        // 6. Argon2id Hash Generation
        total++;
        String raw = "FoodWala@2026";
        String hash1 = PasswordUtil.hash(raw);
        String hash2 = PasswordUtil.hash(raw);
        if (hash1.startsWith("$argon2id$") && !hash1.equals(hash2)) {
            System.out.println("PASS: Argon2id generated with unique random salt: " + hash1.substring(0, 30) + "...");
            passed++;
        } else {
            System.err.println("FAIL: Argon2id salt generation error");
        }

        // 7. Argon2id Verification
        total++;
        if (PasswordUtil.verify(raw, hash1) && !PasswordUtil.verify("WrongPass123", hash1)) {
            System.out.println("PASS: Argon2id verification succeeds for correct password and fails for wrong password");
            passed++;
        } else {
            System.err.println("FAIL: Argon2id verify error");
        }

        // 8. Argon2id needsRehash returns false for fresh hash
        total++;
        if (!PasswordUtil.needsRehash(hash1)) {
            System.out.println("PASS: Fresh Argon2id hash does not need rehash");
            passed++;
        } else {
            System.err.println("FAIL: Fresh hash flagged as needing rehash");
        }

        // 9. Legacy SHA-256 verification and needsRehash
        total++;
        // SHA-256("123456") = 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
        String sha256 = "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
        if (PasswordUtil.verify("123456", sha256) && !PasswordUtil.verify("wrong", sha256) && PasswordUtil.needsRehash(sha256)) {
            System.out.println("PASS: Legacy SHA-256 hash verified and correctly flagged for upgrade");
            passed++;
        } else {
            System.err.println("FAIL: Legacy SHA-256 handling failed");
        }

        // 10. Legacy Plaintext verification and needsRehash
        total++;
        String plain = "password123";
        if (PasswordUtil.verify("password123", plain) && !PasswordUtil.verify("wrong", plain) && PasswordUtil.needsRehash(plain)) {
            System.out.println("PASS: Legacy Plaintext verified and correctly flagged for upgrade");
            passed++;
        } else {
            System.err.println("FAIL: Legacy Plaintext handling failed");
        }

        // 11. BCrypt verification
        total++;
        String bcrypt = PasswordUtil.hashBcrypt("BcryptPass123");
        if (bcrypt.startsWith("$2a$") && PasswordUtil.verify("BcryptPass123", bcrypt) && !PasswordUtil.verify("wrong", bcrypt)) {
            System.out.println("PASS: BCrypt hashing and verification successful");
            passed++;
        } else {
            System.err.println("FAIL: BCrypt handling failed");
        }

        System.out.println("==================================================");
        System.out.println("RESULTS: " + passed + "/" + total + " PASSED");
        System.out.println("==================================================");
    }
}
