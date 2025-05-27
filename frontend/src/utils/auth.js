// File: /frontend/src/services/aws/auth.js

import apiClient from "../../api/apiClient";
import { logError, logInfo } from "../../utils/logging";

/**
 * Authenticate a user via backend
 * @param {string} email - User email (used as username)
 * @param {string} password
 * @returns {Promise<Object>} Auth result with tokens
 */
export const login = async (email, password) => {
  try {
    const payload = { username: email.trim(), password };
    const res = await apiClient.post("/auth/login", payload);
    logInfo("Login success", { email });
    return res.data;
  } catch (err) {
    logError("Login failed", err);
    throw err;
  }
};

/**
 * Logout user via backend
 */
export const logout = async () => {
  try {
    await apiClient.post("/auth/logout");
    logInfo("Logout success");
  } catch (err) {
    logError("Logout failed", err);
    throw err;
  }
};

/**
 * Request a password reset link/code
 * @param {string} email
 */
export const forgotPassword = async (email) => {
  try {
    const res = await apiClient.post("/auth/forgot-password", { email });
    logInfo("Forgot password initiated", { email });
    return res.data;
  } catch (err) {
    logError("Forgot password failed", err);
    throw err;
  }
};

/**
 * Confirm password reset with verification code
 * @param {string} email
 * @param {string} verificationCode
 * @param {string} newPassword
 */
export const confirmForgotPassword = async (email, verificationCode, newPassword) => {
  try {
    const res = await apiClient.post("/auth/confirm-forgot-password", {
      email,
      verificationCode,
      newPassword,
    });
    logInfo("Password reset confirmed", { email });
    return res.data;
  } catch (err) {
    logError("Confirm forgot password failed", err);
    throw err;
  }
};

/**
 * Refresh token
 */
export const refreshSession = async () => {
  try {
    const res = await apiClient.post("/auth/refresh");
    logInfo("Session refreshed");
    return res.data;
  } catch (err) {
    logError("Session refresh failed", err);
    throw err;
  }
};

/**
 * Fetch current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const res = await apiClient.get("/auth/me");
    logInfo("Fetched current user");
    return res.data;
  } catch (err) {
    logError("Get current user failed", err);
    throw err;
  }
};

export default {
  login,
  logout,
  forgotPassword,
  confirmForgotPassword,
  refreshSession,
  getCurrentUser,
};
