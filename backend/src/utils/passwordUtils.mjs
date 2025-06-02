// ✅ FILE: /backend/src/utils/passwordUtils.js

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plaintext password to a bcrypt hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>} match result
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
