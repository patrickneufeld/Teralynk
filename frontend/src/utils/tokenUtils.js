// ✅ /frontend/src/utils/tokenUtils.js

import CryptoJS from "crypto-js";

// 🔍 Secure storage key prefix
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRY_KEY = "token_expiry";
const STORAGE_MODE = "localStorage"; // Change to "sessionStorage" if needed
const ENCRYPTION_SECRET = "super-secure-key"; // Change this to a secure key

/**
 * 🔒 Encrypts token before storing (AES Encryption)
 */
const encryptToken = (token) => {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_SECRET).toString();
};

/**
 * 🔓 Decrypts stored token
 */
const decryptToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("🔴 Token decryption failed", error);
    return null;
  }
};

/**
 * 📌 Get the correct storage method (localStorage or sessionStorage)
 */
const getStorage = () => {
  return STORAGE_MODE === "sessionStorage" ? sessionStorage : localStorage;
};

/**
 * 🔑 Stores a token securely with expiration
 * @param {string} token - The authentication token
 * @param {number} expiresIn - Expiry time in seconds
 */
export const setToken = (token, expiresIn = 3600) => {
  const encryptedToken = encryptToken(token);
  const expiryTimestamp = Date.now() + expiresIn * 1000;
  const storage = getStorage();

  storage.setItem(TOKEN_KEY, encryptedToken);
  storage.setItem(EXPIRY_KEY, expiryTimestamp.toString());
  dispatchTokenUpdate();
};

/**
 * 🔑 Retrieves the stored token (if not expired)
 * @returns {string|null} Token or null if expired
 */
export const getToken = () => {
  const storage = getStorage();
  const encryptedToken = storage.getItem(TOKEN_KEY);
  const expiryTimestamp = parseInt(storage.getItem(EXPIRY_KEY), 10);

  if (!encryptedToken || isNaN(expiryTimestamp)) return null;

  // Check if expired
  if (Date.now() > expiryTimestamp) {
    removeToken();
    return null;
  }

  return decryptToken(encryptedToken);
};

/**
 * 🕒 Checks if the stored token is still valid
 * @returns {boolean} True if token is valid, otherwise false
 */
export const isTokenValid = () => {
  return getToken() !== null;
};

/**
 * 🗑️ Removes the stored token
 */
export const removeToken = () => {
  const storage = getStorage();
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(EXPIRY_KEY);
  dispatchTokenUpdate();
};

/**
 * 🔄 Stores a refresh token securely
 * @param {string} refreshToken - The refresh token
 */
export const setRefreshToken = (refreshToken) => {
  const encryptedToken = encryptToken(refreshToken);
  getStorage().setItem(REFRESH_TOKEN_KEY, encryptedToken);
};

/**
 * 🔄 Retrieves the stored refresh token
 * @returns {string|null} Refresh token or null
 */
export const getRefreshToken = () => {
  const encryptedToken = getStorage().getItem(REFRESH_TOKEN_KEY);
  return encryptedToken ? decryptToken(encryptedToken) : null;
};

/**
 * 🔄 Removes the stored refresh token
 */
export const removeRefreshToken = () => {
  getStorage().removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 📡 Dispatches an event when the token is updated
 */
const dispatchTokenUpdate = () => {
  const event = new Event("tokenUpdated");
  window.dispatchEvent(event);
};

/**
 * 📡 Adds a listener for token updates
 * @param {function} callback - Function to execute on token update
 */
export const onTokenUpdate = (callback) => {
  window.addEventListener("tokenUpdated", callback);
};
