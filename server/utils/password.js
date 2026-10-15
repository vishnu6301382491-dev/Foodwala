const { hash, verify } = require('@node-rs/argon2');
const crypto = require('crypto');

/**
 * Enterprise Password Hashing Utility using OWASP-recommended Argon2id.
 * Transparently verifies legacy SHA-256 hashes and indicates when re-hashing is needed.
 */

// Argon2id options matching Java PasswordUtil and OWASP recommendations
const ARGON2_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 lane
  outputLen: 32      // 32-byte key length
};

/**
 * Hash a password using Argon2id
 */
async function hashPassword(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await hash(plainText, ARGON2_OPTIONS);
}

/**
 * Verify a password against stored Argon2id or legacy SHA-256 hash
 */
async function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;

  // Case 1: Standard Argon2id
  if (storedHash.startsWith('$argon2id$')) {
    try {
      return await verify(storedHash, plainText);
    } catch (e) {
      return false;
    }
  }

  // Case 2: Legacy SHA-256 (64 hex characters)
  if (storedHash.length === 64 && /^[0-9a-fA-F]{64}$/.test(storedHash)) {
    const computed = crypto.createHash('sha256').update(plainText).digest('hex');
    const bufA = Buffer.from(computed.toLowerCase(), 'utf8');
    const bufB = Buffer.from(storedHash.toLowerCase(), 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  // Case 3: Plaintext fallback
  const bufA = Buffer.from(plainText, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Check if the stored hash is legacy and should be upgraded to Argon2id
 */
function needsRehash(storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return true;
  return !storedHash.startsWith('$argon2id$');
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
