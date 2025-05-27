// ✅ FILE: /frontend/src/api/authApi.js

import {
  loginUser,
  registerUser,
  logoutUser,
  refreshSession,
  sendPasswordResetCode,
  confirmPasswordReset,
} from "../services/aws/auth"; // ✅ Fixed: use correct named exports
import { getClientId } from "../utils/authUtils"; // ✅ Use env or utils, not secrets

/**
 * ✅ User Signup using backend-auth flow
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - Full name or given name
 */
export const signup = async (email, password, name) => {
  try {
    const result = await registerUser({ email, password, name });
    return result;
  } catch (error) {
    console.error("❌ Signup Error:", error);
    throw new Error(error.message || "Signup failed.");
  }
};

/**
 * ✅ Confirm User Signup (typically via backend or Cognito hosted UI)
 * NOTE: repurposed to confirm password reset if using code flow
 * @param {string} email - User email
 * @param {string} confirmationCode - Verification code
 * @param {string} newPassword - New password to set
 */
export const confirmSignup = async (email, confirmationCode, newPassword) => {
  try {
    return await confirmPasswordReset(email, confirmationCode, newPassword);
  } catch (error) {
    console.error("❌ Confirm Signup Error:", error);
    throw new Error(error.message || "Signup confirmation failed.");
  }
};

/**
 * ✅ User Login
 * @param {string} email - User email
 * @param {string} password - User password
 */
export const login = async (email, password) => {
  try {
    const result = await loginUser(email, password);
    return result;
  } catch (error) {
    console.error("❌ Login Error:", error);
    throw new Error(error.message || "Login failed. Please check your credentials.");
  }
};

/**
 * ✅ Logout User
 */
export const logout = async () => {
  try {
    await logoutUser();
  } catch (error) {
    console.error("❌ Logout Error:", error);
    throw new Error(error.message || "Logout failed.");
  }
};

/**
 * ✅ Get Authentication Status (silent refresh)
 */
export const getStatus = async () => {
  try {
    return await refreshSession();
  } catch (error) {
    console.error("❌ Auth Status Error:", error);
    throw new Error("Failed to validate session.");
  }
};

/**
 * ✅ Refresh Authentication Token
 */
export const refreshAuthToken = async () => {
  try {
    return await refreshSession();
  } catch (error) {
    console.error("❌ Token Refresh Error:", error);
    throw new Error("Token refresh failed.");
  }
};

/**
 * ✅ Send Password Reset Email
 * @param {string} email - User email
 */
export const forgotPassword = async (email) => {
  try {
    return await sendPasswordResetCode(email);
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    throw new Error(error.message || "Failed to send reset code.");
  }
};

/**
 * ✅ Confirm Password Reset
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @param {string} newPassword - New password to set
 */
export const confirmForgotPassword = async (email, code, newPassword) => {
  try {
    return await confirmPasswordReset(email, code, newPassword);
  } catch (error) {
    console.error("❌ Confirm Forgot Password Error:", error);
    throw new Error(error.message || "Failed to reset password.");
  }
};
