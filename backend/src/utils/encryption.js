// ================================================
// 🔐 FILE: /backend/src/utils/encryption.js
// Secure cryptographic utilities for Teralynk
// ================================================

import crypto from 'crypto';

/**
 * Hash a given string using SHA-256
 * @param {string} input - The input string to hash
 * @returns {Promise<string>} - The resulting SHA-256 hex digest
 */
export const hashSHA256 = async (input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Input to hashSHA256 must be a non-empty string');
  }

  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Generate a cryptographically secure random token
 * @param {number} length - Number of bytes (default: 32)
 * @returns {string} - Hex representation of secure random bytes
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Compare two SHA-256 hashes securely
 * @param {string} hashA - First hash
 * @param {string} hashB - Second hash
 * @returns {boolean} - True if equal, false otherwise
 */
export const compareHashes = (hashA, hashB) => {
  if (!hashA || !hashB || typeof hashA !== 'string' || typeof hashB !== 'string') {
    return false;
  }

  try {
    const bufA = Buffer.from(hashA, 'hex');
    const bufB = Buffer.from(hashB, 'hex');

    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    return false;
  }
};

/**
 * HMAC SHA-256 signer for secrets
 * @param {string} key - The HMAC key
 * @param {string} message - The message to sign
 * @returns {string} - Base64-encoded HMAC signature
 */
export const signHMACSHA256 = (key, message) => {
  if (!key || !message) throw new Error('Missing key or message for HMAC signing');
  return crypto.createHmac('sha256', key).update(message).digest('base64');
};
