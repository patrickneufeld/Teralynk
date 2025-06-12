// ✅ FILE: /frontend/src/utils/tokenUtils.js

// Description: Browser-safe token utility module for managing access, refresh, and ID tokens.
// Includes LRU caching, token decoding, expiration checks, and blacklist handling.

import { LRUCache } from "lru-cache";

// In-memory cache for validated tokens
const tokenCache = new LRUCache({ max: 1000 });
const tokenBlacklist = new Set();

// Frontend-safe token storage using sessionStorage
const storage = {
  get accessToken() {
    return sessionStorage.getItem("accessToken");
  },
  set accessToken(token) {
    sessionStorage.setItem("accessToken", token);
    tokenCache.set(token, true);
  },
  get idToken() {
    return sessionStorage.getItem("idToken");
  },
  set idToken(token) {
    sessionStorage.setItem("idToken", token);
  },
  get refreshToken() {
    return sessionStorage.getItem("refreshToken");
  },
  set refreshToken(token) {
    sessionStorage.setItem("refreshToken", token);
  },
  clear() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("idToken");
    sessionStorage.removeItem("refreshToken");
  },
};

// ⛏️ Decode JWT (safe for browser)
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("decodeToken failed:", err);
    return null;
  }
};

// ⏱️ Check token expiration
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

export const getTimeUntilExpiry = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return 0;
  return decoded.exp * 1000 - Date.now();
};

// 🪪 Return auth header
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 🔐 Token management
export const getToken = () => storage.accessToken;
export const setToken = (token) => {
  storage.accessToken = token;
};

export const getIdToken = () => storage.idToken;
export const setIdToken = (token) => {
  storage.idToken = token;
};

export const getRefreshToken = () => storage.refreshToken;
export const setRefreshToken = (token) => {
  storage.refreshToken = token;
};

export const removeTokens = () => {
  storage.clear();
};

// 🚫 Blacklist support
export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

export const clearTokenBlacklist = () => {
  tokenBlacklist.clear();
};

export const isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// 🔍 Token cache helpers
export const isCached = (token) => tokenCache.has(token);

// 👥 Extract user details from token
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    userId: decoded.sub,
    email: decoded.email,
    username: decoded["cognito:username"] || decoded.username || "",
    groups: decoded["cognito:groups"] || [],
    permissions: decoded["custom:permissions"]
      ? decoded["custom:permissions"].split(",")
      : [],
  };
};

// 📦 Grouped exports
export const tokenState = {
  getToken,
  setToken,
  getIdToken,
  setIdToken,
  getRefreshToken,
  setRefreshToken,
  removeTokens,
  getAuthHeader,
};

export const tokenUtils = {
  decode: decodeToken,
  isExpired: isTokenExpired,
  timeUntilExpiry: getTimeUntilExpiry,
  blacklist: blacklistToken,
  clearBlacklist: clearTokenBlacklist,
  isBlacklisted,
  getUserFromToken,
  isCached,
};

// 🌍 Default export for compatibility
export default {
  ...tokenState,
  ...tokenUtils,
};
