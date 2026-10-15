const bcrypt = require('bcryptjs');
let argon2 = null;
try {
  argon2 = require('@node-rs/argon2');
} catch (e) {
  // Optional native module for verifying existing Argon2id records
}
const crypto = require('crypto');

/**
 * Enterprise Password Hashing Utility using bcrypt (12 rounds) as required by specifications.
 * Transparently verifies legacy Argon2id, PBKDF2, SHA-256, and plaintext passwords,
 * and automatically triggers upgrading to bcrypt (12 rounds) on successful authentication.
 */

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with 12 salt rounds
 */
async function hashPassword(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS);
}

/**
 * Verify a password against stored bcrypt, Argon2id, PBKDF2, or legacy SHA-256 hash
 */
async function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;

  // Case 1: Standard bcrypt ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(plainText, storedHash);
    } catch (e) {
      return false;
    }
  }

  // Case 2: Legacy Argon2id
  if (storedHash.startsWith('$argon2id$')) {
    try {
      if (argon2 && typeof argon2.verify === 'function') {
        return await argon2.verify(storedHash, plainText);
      }
    } catch (e) {
      return false;
    }
  }

  // Case 3: PBKDF2
  if (storedHash.startsWith('$pbkdf2$')) {
    try {
      const parts = storedHash.split('$');
      const salt = parts[2];
      const hashVal = parts[3];
      const derived = crypto.pbkdf2Sync(plainText, salt, 100000, 32, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(derived, 'utf8'), Buffer.from(hashVal, 'utf8'));
    } catch (e) {
      return false;
    }
  }

  // Case 4: Legacy SHA-256 (64 hex characters)
  if (storedHash.length === 64 && /^[0-9a-fA-F]{64}$/.test(storedHash)) {
    const computed = crypto.createHash('sha256').update(plainText).digest('hex');
    const bufA = Buffer.from(computed.toLowerCase(), 'utf8');
    const bufB = Buffer.from(storedHash.toLowerCase(), 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  // Case 5: Plaintext legacy fallback (safe constant-time comparison)
  try {
    const bufA = Buffer.from(plainText, 'utf8');
    const bufB = Buffer.from(storedHash, 'utf8');
    if (bufA.length === bufB.length) {
      return crypto.timingSafeEqual(bufA, bufB);
    }
  } catch (e) {}

  return false;
}

/**
 * Check if the stored hash is not modern bcrypt with 12 rounds and should be upgraded
 */
function needsRehash(storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return true;
  // If it's already bcrypt with 12 rounds ($2b$12$ or $2a$12$), no upgrade needed
  return !(storedHash.startsWith('$2b$12$') || storedHash.startsWith('$2a$12$'));
}

/**
 * Validate FoodWala password policy (8-128 chars, 1 letter, 1 number)
 */
function validatePasswordPolicy(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 8 || password.length > 128) {
    return { valid: false, message: 'Password must be between 8 and 128 characters long.' };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter and at least one number.' };
  }
  return { valid: true };
}

module.exports = {
  hashPassword,
  verifyPassword,
  needsRehash,
  validatePasswordPolicy
};
