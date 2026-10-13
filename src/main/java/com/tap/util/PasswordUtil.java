package com.tap.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;
import org.mindrot.jbcrypt.BCrypt;

/**
 * Enterprise Secure Password Hashing & Authentication Utility.
 * Uses OWASP-recommended Argon2id with cryptographically secure random salts.
 * Provides transparent backward compatibility and automatic upgrade from legacy
 * SHA-256 and plaintext passwords.
 */
public final class PasswordUtil {

    // Argon2id Parameters (OWASP recommended)
    private static final int ARGON2_TYPE = Argon2Parameters.ARGON2_id;
    private static final int ARGON2_VERSION = Argon2Parameters.ARGON2_VERSION_13; // 0x13 = 19
    private static final int ARGON2_ITERATIONS = 3;
    private static final int ARGON2_MEMORY_KB = 19456; // 19 MiB
    private static final int ARGON2_PARALLELISM = 1;
    private static final int ARGON2_HASH_LENGTH = 32; // 32 bytes (256 bits)
    private static final int SALT_LENGTH = 16;        // 16 bytes (128 bits)

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // Regex pattern to parse standard PHC Argon2 string: $argon2id$v=19$m=19456,t=3,p=1$salt$hash
    private static final Pattern ARGON2_PATTERN = Pattern.compile(
        "^\\$argon2id\\$(?:v=(\\d+)\\$)?m=(\\d+),t=(\\d+),p=(\\d+)\\$([A-Za-z0-9+/=]+)\\$([A-Za-z0-9+/=]+)$"
    );

    private PasswordUtil() {
    }

    public static class ValidationResult {
        public final boolean valid;
        public final String message;

        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }
    }

    /**
     * Enforces FoodWala Password Policy:
     * - Minimum 8 characters, maximum 128 characters
     * - Cannot be null or blank
     * - Must contain at least one letter and at least one digit
     * - The raw password is NOT trimmed or altered
     */
    public static ValidationResult validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            return new ValidationResult(false, "Password cannot be empty.");
        }
        if (password.length() < 8) {
            return new ValidationResult(false, "Password must be at least 8 characters long.");
        }
        if (password.length() > 128) {
            return new ValidationResult(false, "Password cannot exceed 128 characters.");
        }
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isLetter(c)) hasLetter = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasLetter || !hasDigit) {
            return new ValidationResult(false, "Password must contain at least one letter and one number.");
        }
        return new ValidationResult(true, null);
    }

    /**
     * Hashes password using Argon2id with a unique 16-byte random salt.
     * Returns standard PHC string: $argon2id$v=19$m=19456,t=3,p=1$<b64salt>$<b64hash>
     */
    public static String hash(String password) {
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }

        byte[] salt = new byte[SALT_LENGTH];
        SECURE_RANDOM.nextBytes(salt);

        Argon2Parameters params = new Argon2Parameters.Builder(ARGON2_TYPE)
                .withVersion(ARGON2_VERSION)
                .withIterations(ARGON2_ITERATIONS)
                .withMemoryAsKB(ARGON2_MEMORY_KB)
                .withParallelism(ARGON2_PARALLELISM)
                .withSalt(salt)
                .build();

        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(params);

        byte[] hash = new byte[ARGON2_HASH_LENGTH];
        generator.generateBytes(password.getBytes(StandardCharsets.UTF_8), hash, 0, hash.length);

        String b64Salt = Base64.getEncoder().withoutPadding().encodeToString(salt);
        String b64Hash = Base64.getEncoder().withoutPadding().encodeToString(hash);

        return String.format("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
                ARGON2_VERSION, ARGON2_MEMORY_KB, ARGON2_ITERATIONS, ARGON2_PARALLELISM, b64Salt, b64Hash);
    }

    /**
     * Hashes password using BCrypt with 10 rounds of salt generation.
     */
    public static String hashBcrypt(String password) {
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        return BCrypt.hashpw(password, BCrypt.gensalt(10));
    }

    /**
     * Verifies raw password against stored hash with constant-time equality checks.
     * Supports:
     * 1. Argon2id ($argon2id$...)
     * 2. BCrypt ($2a$..., $2b$..., $2y$...)
     * 3. Legacy SHA-256 (64 hex characters)
     * 4. Legacy Plaintext (for seamless safe upgrade)
     */
    public static boolean verify(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null || storedHash.isEmpty()) {
            return false;
        }

        try {
            // Case 1: Argon2id
            if (storedHash.startsWith("$argon2id$")) {
                return verifyArgon2id(rawPassword, storedHash);
            }

            // Case 2: BCrypt ($2a$, $2b$, $2y$)
            if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
                return BCrypt.checkpw(rawPassword, storedHash);
            }

            // Case 3: Legacy SHA-256 (64 hex chars)
            if (storedHash.length() == 64 && storedHash.matches("^[0-9a-fA-F]{64}$")) {
                String computedSha256 = legacySha256(rawPassword);
                return constantTimeEquals(computedSha256.toLowerCase(), storedHash.toLowerCase());
            }

            // Case 4: Legacy Plaintext (fallback during migration)
            return constantTimeEquals(rawPassword, storedHash);

        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Determines whether the stored password representation needs to be upgraded
     * to the latest Argon2id configuration.
     */
    public static boolean needsRehash(String storedHash) {
        if (storedHash == null || !storedHash.startsWith("$argon2id$")) {
            return true;
        }
        Matcher matcher = ARGON2_PATTERN.matcher(storedHash);
        if (!matcher.matches()) {
            return true;
        }
        try {
            int memory = Integer.parseInt(matcher.group(2));
            int iterations = Integer.parseInt(matcher.group(3));
            int parallelism = Integer.parseInt(matcher.group(4));
            return memory < ARGON2_MEMORY_KB || iterations < ARGON2_ITERATIONS || parallelism != ARGON2_PARALLELISM;
        } catch (Exception e) {
            return true;
        }
    }

    private static boolean verifyArgon2id(String rawPassword, String storedHash) {
        Matcher matcher = ARGON2_PATTERN.matcher(storedHash);
        if (!matcher.matches()) {
            return false;
        }

        int version = matcher.group(1) != null ? Integer.parseInt(matcher.group(1)) : ARGON2_VERSION;
        int memory = Integer.parseInt(matcher.group(2));
        int iterations = Integer.parseInt(matcher.group(3));
        int parallelism = Integer.parseInt(matcher.group(4));
        byte[] salt = Base64.getDecoder().decode(matcher.group(5));
        byte[] expectedHash = Base64.getDecoder().decode(matcher.group(6));

        Argon2Parameters params = new Argon2Parameters.Builder(ARGON2_TYPE)
                .withVersion(version)
                .withIterations(iterations)
                .withMemoryAsKB(memory)
                .withParallelism(parallelism)
                .withSalt(salt)
                .build();

        Argon2BytesGenerator generator = new Argon2BytesGenerator();
        generator.init(params);

        byte[] computedHash = new byte[expectedHash.length];
        generator.generateBytes(rawPassword.getBytes(StandardCharsets.UTF_8), computedHash, 0, computedHash.length);

        return MessageDigest.isEqual(computedHash, expectedHash);
    }

    private static String legacySha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(aBytes, bBytes);
    }
}
