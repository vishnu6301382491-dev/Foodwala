let argon2 = null;
try {
  argon2 = require('@node-rs/argon2');
} catch (e) {
  console.warn('[Security] @node-rs/argon2 native binary could not be loaded, using PBKDF2 fallback:', e.message);
}
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
 * Hash a password using Argon2id (or PBKDF2 fallback if native module unavailable)
 */
async function hashPassword(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  if (argon2 && typeof argon2.hash === 'function') {
    return await argon2.hash(plainText, ARGON2_OPTIONS);
  }
  // Safe PBKDF2-SHA512 fallback
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(plainText, salt, 100000, 32, 'sha512').toString('hex');
  return `$pbkdf2$${salt}$${derived}`;
}

/**
 * Verify a password against stored Argon2id or legacy SHA-256 hash
 */
async function verifyPassword(plainText, storedHash) {
  if (!plainText || !storedHash) return false;

  // Case 1: Standard Argon2id
  if (storedHash.startsWith('$argon2id$')) {
    try {
      if (argon2 && typeof argon2.verify === 'function') {
        return await argon2.verify(storedHash, plainText);
      }
    } catch (e) {
      return false;
    }
  }

  // Case 1b: PBKDF2 Fallback
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
