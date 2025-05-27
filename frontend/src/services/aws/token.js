// File: /frontend/src/services/aws/token.js

/**
 * Token Storage Utilities for AWS Cognito
 * Handles Access Token, Refresh Token, ID Token, Expiry Management
 */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ID_TOKEN_KEY = "idToken";
const USERNAME_KEY = "username";
const EXPIRATION_KEY = "tokenExpiration";

/**
 * Save token with expiry timestamp
 * @param {string} token
 * @param {number} expiresIn - Time in seconds
 */
export const setToken = (token, expiresIn) => {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(EXPIRATION_KEY, String(Date.now() + expiresIn * 1000));
  } catch (err) {
    console.error("❌ Error setting access token:", err);
  }
};

/**
 * Get valid token or null if expired/missing
 * @returns {string|null}
 */
export const getToken = () => {
  try {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const expiration = parseInt(sessionStorage.getItem(EXPIRATION_KEY), 10);
    if (!token || !expiration || Date.now() > expiration) return null;
    return token;
  } catch (err) {
    console.error("❌ Error retrieving token:", err);
    return null;
  }
};

/**
 * Remove access token and expiration
 */
export const removeToken = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(EXPIRATION_KEY);
};

/**
 * Save refresh token
 * @param {string} refreshToken
 */
export const setRefreshToken = (refreshToken) => {
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (err) {
    console.error("❌ Error setting refresh token:", err);
  }
};

/**
 * Get refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error("❌ Error retrieving refresh token:", err);
    return null;
  }
};

/**
 * Save Cognito username (used for generating secret hash)
 * @param {string} username
 */
export const setUsername = (username) => {
  sessionStorage.setItem(USERNAME_KEY, username);
};

/**
 * Get Cognito username
 * @returns {string|null}
 */
export const getUsername = () => {
  return sessionStorage.getItem(USERNAME_KEY);
};

/**
 * Save ID token
 * @param {string} idToken
 */
export const setIdToken = (idToken) => {
  try {
    sessionStorage.setItem(ID_TOKEN_KEY, idToken);
  } catch (err) {
    console.error("❌ Error saving ID token:", err);
  }
};

/**
 * Clear all token-related session items
 */
export const removeAllTokens = () => {
  [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    ID_TOKEN_KEY,
    USERNAME_KEY,
    EXPIRATION_KEY,
  ].forEach((key) => sessionStorage.removeItem(key));
};

export default {
  setToken,
  getToken,
  removeToken,
  setRefreshToken,
  getRefreshToken,
  setIdToken,
  setUsername,
  getUsername,
  removeAllTokens,
};
