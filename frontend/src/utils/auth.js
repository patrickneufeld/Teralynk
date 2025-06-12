// ✅ FILE: /frontend/src/services/aws/auth.js
// AWS Authentication Service - Hardened & Complete

import apiClient from "@/api/apiClient";
import { logError, logInfo, logDebug, logWarning } from "@/utils/logging";
import { SecurityEventEmitter } from "@/utils/security/eventEmitter";
import { validateInput, sanitizeEmail } from "@/utils/validation";
import {
  encryptPayload,
  generateDeviceFingerprint,
  validateDeviceBinding,
  generateSecurityHash
} from "@/utils/security";
import { getSecurityContext, validateSecurityContext } from "@/utils/authUtils";
import { secureStorage } from "@/utils/security/secureStorage";

// === Auth Constants ===
const AUTH_EVENTS = {
  LOGIN: "auth:login",
  LOGIN_FAILED: "auth:login:failed",
  LOGOUT: "auth:logout",
  MFA_SUCCESS: "auth:mfa:success",
  MFA_FAILED: "auth:mfa:failed",
  TOKEN_REFRESH: "auth:token:refresh",
  SESSION_EXPIRED: "auth:session:expired",
  SECURITY_VIOLATION: "auth:security:violation",
  BRUTE_FORCE_DETECTED: "auth:brute:detected",
  SUSPICIOUS_ACTIVITY: "auth:suspicious:activity"
};

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: { code: 401, message: "Invalid email or password" },
  ACCOUNT_LOCKED: { code: 423, message: "Account locked due to too many failed attempts" },
  SECURITY_VIOLATION: { code: 403, message: "Security violation detected" }
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth.accessToken",
  ACCESS_EXPIRY: "auth.accessTokenExpiry",
  SESSION_ID: "auth.sessionId",
  USER: "auth.user",
  SECURITY_CONTEXT: "auth.securityContext"
};

// === Permission Loader ===
const processUserPermissions = async (user) => {
  try {
    if (!user || !user.role) throw new Error("Invalid user object");
    const { PERMISSION_SETS } = await import("@/constants/permissionSets");
    const rolePerms = PERMISSION_SETS[user.role.toUpperCase()] || [];
    const customPerms = user.permissions || [];
    const all = [...new Set([...rolePerms, ...customPerms])];
    return {
      ...user,
      permissions: all,
      role: user.role.toLowerCase(),
      hasPermission: (perm) => all.includes(perm),
      hasRole: (r) => user.role.toLowerCase() === r.toLowerCase()
    };
  } catch (err) {
    logError("Permission resolution failed", err);
    throw err;
  }
};

const securityEvents = new SecurityEventEmitter();
let currentSecurityContext = null;
let sessionRefreshTimer = null;
let activityCheckTimer = null;

const getSecurityPolicy = async () => {
  const { SECURITY_POLICIES } = await import("@/constants/permissionSets");
  return SECURITY_POLICIES.DEFAULT;
};

// === Rate Limiter ===
const rateLimiter = {
  attempts: new Map(),
  maxAttempts: 5,
  resetTimeout: 15 * 60 * 1000,

  async init() {
    const policy = await getSecurityPolicy();
    this.maxAttempts = policy.maxLoginAttempts;
    this.resetTimeout = policy.lockoutDuration;
  },

  async checkLimit(id) {
    const attempts = this.attempts.get(id) || 0;
    if (attempts >= this.maxAttempts) {
      securityEvents.emit(AUTH_EVENTS.BRUTE_FORCE_DETECTED, { id, attempts, timestamp: Date.now() });
      throw new Error(AUTH_ERRORS.ACCOUNT_LOCKED.message);
    }
  },

  async incrementAttempts(id) {
    const attempts = (this.attempts.get(id) || 0) + 1;
    this.attempts.set(id, attempts);
    if (attempts >= this.maxAttempts) {
      securityEvents.emit(AUTH_EVENTS.SUSPICIOUS_ACTIVITY, { id, attempts, timestamp: Date.now() });
      setTimeout(() => this.attempts.delete(id), this.resetTimeout);
    }
    return attempts;
  },

  async resetAttempts(id) {
    this.attempts.delete(id);
  }
};

await rateLimiter.init();

// === Auth Core Functions ===

export const login = async ({ email, password }) => {
  const sanitizedEmail = sanitizeEmail(email);
  if (!validateInput.email(sanitizedEmail) || !password?.length) {
    throw new Error("Invalid credentials");
  }

  await rateLimiter.checkLimit(sanitizedEmail);

  try {
    const fingerprint = await generateDeviceFingerprint();
    const payload = await encryptPayload({ email: sanitizedEmail, password, fingerprint });

    const { data } = await apiClient.post("/auth/login", payload);
    const userWithPermissions = await processUserPermissions(data.user);

    const sessionId = data.sessionId || generateSecurityHash();
    const expiry = Date.now() + (data.expiresIn || 3600) * 1000;

    secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, data.token, { ttl: expiry });
    secureStorage.set(STORAGE_KEYS.ACCESS_EXPIRY, expiry);
    secureStorage.set(STORAGE_KEYS.SESSION_ID, sessionId);
    secureStorage.set(STORAGE_KEYS.USER, userWithPermissions);

    securityEvents.emit(AUTH_EVENTS.LOGIN, { user: userWithPermissions });
    logInfo("User logged in", { email: sanitizedEmail, sessionId });

    return {
      ...userWithPermissions,
      token: data.token,
      sessionId,
      expiresAt: expiry
    };
  } catch (err) {
    await rateLimiter.incrementAttempts(sanitizedEmail);
    securityEvents.emit(AUTH_EVENTS.LOGIN_FAILED, {
      email: sanitizedEmail,
      error: err?.message || "Login failed"
    });
    throw err;
  }
};

export const logout = () => {
  secureStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  secureStorage.remove(STORAGE_KEYS.ACCESS_EXPIRY);
  secureStorage.remove(STORAGE_KEYS.SESSION_ID);
  secureStorage.remove(STORAGE_KEYS.USER);
  secureStorage.remove(STORAGE_KEYS.SECURITY_CONTEXT);

  clearInterval(sessionRefreshTimer);
  clearInterval(activityCheckTimer);

  currentSecurityContext = null;
  securityEvents.emit(AUTH_EVENTS.LOGOUT, { timestamp: Date.now() });
};

export const isTokenValid = () => {
  const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
  const expiry = parseInt(secureStorage.get(STORAGE_KEYS.ACCESS_EXPIRY) || 0, 10);
  return !!token && Date.now() < expiry;
};

export const refreshSession = async () => {
  const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) throw new Error("Missing token");

  try {
    const { data } = await apiClient.post("/auth/refresh", { token });
    const newExpiry = Date.now() + (data.expiresIn || 3600) * 1000;

    secureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, data.token, { ttl: newExpiry });
    secureStorage.set(STORAGE_KEYS.ACCESS_EXPIRY, newExpiry);

    securityEvents.emit(AUTH_EVENTS.TOKEN_REFRESH, { newExpiry });
    logInfo("Token refreshed", { newExpiry });

    return true;
  } catch (err) {
    securityEvents.emit(AUTH_EVENTS.SESSION_EXPIRED, { reason: err?.message });
    logout();
    throw err;
  }
};

export const verifyMFA = async (code) => {
  try {
    const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const payload = await encryptPayload({ code });

    const { data } = await apiClient.post("/auth/verify-mfa", payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    securityEvents.emit(AUTH_EVENTS.MFA_SUCCESS, { timestamp: Date.now() });
    logInfo("MFA verified successfully");
    return data;
  } catch (err) {
    securityEvents.emit(AUTH_EVENTS.MFA_FAILED, { message: err?.message });
    logError("MFA verification failed", err);
    throw err;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const { data } = await apiClient.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const processed = await processUserPermissions(data.user);
    secureStorage.set(STORAGE_KEYS.USER, processed);

    logDebug("Fetched user profile", { id: processed.id });
    return processed;
  } catch (err) {
    logError("Failed to get user", err);
    throw err;
  }
};

export const validateSession = async () => {
  try {
    const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const { data } = await apiClient.post("/auth/validate-session", { token });

    const updated = await processUserPermissions(data.user);
    secureStorage.set(STORAGE_KEYS.USER, updated);

    logDebug("Session validated", { id: updated.id });
    return true;
  } catch (err) {
    logError("Session validation failed", err);
    logout();
    throw err;
  }
};

// === User Management ===

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post("/auth/signup", userData);
    logInfo("User created", response.data);
    return response.data;
  } catch (error) {
    logError("Create user failed", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    logInfo("User updated", response.data);
    return response.data;
  } catch (error) {
    logError("Update user failed", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/auth/users/${userId}`);
    logInfo("User deleted", response.data);
    return response.data;
  } catch (error) {
    logError("Delete user failed", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await apiClient.get("/auth/users");
    logInfo("Fetched all users", response.data);
    return response.data;
  } catch (error) {
    logError("Fetch all users failed", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/auth/users/${userId}`);
    logInfo("Fetched user by ID", response.data);
    return response.data;
  } catch (error) {
    logError("Fetch user by ID failed", error);
    throw error;
  }
};

// === Export ===

export default {
  login,
  logout,
  refreshSession,
  verifyMFA,
  getCurrentUser,
  validateSession,
  isTokenValid,

  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,

  isAuthenticated: () => {
    const token = secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const user = secureStorage.get(STORAGE_KEYS.USER);
    return !!token && !!user;
  },

  getUser: () => secureStorage.get(STORAGE_KEYS.USER),

  getAccessToken: () => secureStorage.get(STORAGE_KEYS.ACCESS_TOKEN),

  hasPermission: (perm) => {
    const user = secureStorage.get(STORAGE_KEYS.USER);
    return user?.permissions?.includes(perm) || false;
  },

  hasRole: (role) => {
    const user = secureStorage.get(STORAGE_KEYS.USER);
    return user?.role?.toLowerCase() === role.toLowerCase();
  },

  onSecurityEvent: (event, cb) => {
    securityEvents.on(event, cb);
    return () => securityEvents.off(event, cb);
  }
};
