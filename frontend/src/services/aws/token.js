// ================================================
// ✅ FILE: /frontend/src/services/aws/token.js
// Token Storage Utilities for AWS Cognito (No default export)
// ================================================

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const ID_TOKEN_KEY = 'idToken';
const USERNAME_KEY = 'username';
const EXPIRATION_KEY = 'tokenExpiration';

/**
 * Save access token with calculated expiration time.
 * @param {string} token - Access token.
 * @param {number} expiresIn - Token expiry in seconds.
 */
export function setToken(token, expiresIn) {
  try {
    const expiration = Date.now() + expiresIn * 1000;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.setItem(EXPIRATION_KEY, String(expiration));
  } catch (err) {
    console.error('❌ Error setting access token:', err);
  }
}

/**
 * Retrieve the current valid access token, or null if expired.
 * @returns {string|null}
 */
export function getToken() {
  try {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const expiration = parseInt(sessionStorage.getItem(EXPIRATION_KEY), 10);
    if (!token || isNaN(expiration) || Date.now() > expiration) return null;
    return token;
  } catch (err) {
    console.error('❌ Error retrieving token:', err);
    return null;
  }
}

/**
 * Remove access token and expiration timestamp.
 */
export function removeToken() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(EXPIRATION_KEY);
  } catch (err) {
    console.error('❌ Error removing access token:', err);
  }
}

/**
 * Save refresh token to sessionStorage.
 * @param {string} refreshToken
 */
export function setRefreshToken(refreshToken) {
  try {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (err) {
    console.error('❌ Error setting refresh token:', err);
  }
}

/**
 * Retrieve refresh token.
 * @returns {string|null}
 */
export function getRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.error('❌ Error retrieving refresh token:', err);
    return null;
  }
}

/**
 * Save Cognito ID token.
 * @param {string} idToken
 */
export function setIdToken(idToken) {
  try {
    sessionStorage.setItem(ID_TOKEN_KEY, idToken);
  } catch (err) {
    console.error('❌ Error saving ID token:', err);
  }
}

/**
 * Save Cognito username.
 * @param {string} username
 */
export function setUsername(username) {
  try {
    sessionStorage.setItem(USERNAME_KEY, username);
  } catch (err) {
    console.error('❌ Error saving username:', err);
  }
}

/**
 * Retrieve Cognito username.
 * @returns {string|null}
 */
export function getUsername() {
  try {
    return sessionStorage.getItem(USERNAME_KEY);
  } catch (err) {
    console.error('❌ Error retrieving username:', err);
    return null;
  }
}

/**
 * Remove all stored tokens and session values.
 */
export function removeAllTokens() {
  try {
    [
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      ID_TOKEN_KEY,
      USERNAME_KEY,
      EXPIRATION_KEY,
    ].forEach((key) => sessionStorage.removeItem(key));
  } catch (err) {
    console.error('❌ Error clearing tokens:', err);
  }
}
