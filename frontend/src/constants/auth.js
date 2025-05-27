// ✅ FILE: /frontend/src/constants/auth.js

// 📘 Event Types for Logging & Analytics
export const AUTH_EVENTS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  PROFILE_UPDATE: "PROFILE_UPDATE",
  SETTINGS_UPDATE: "SETTINGS_UPDATE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  MFA_REQUIRED: "MFA_REQUIRED",
  DEVICE_BINDING_FAILED: "DEVICE_BINDING_FAILED"
};

// 🛡️ Role Definitions for Permission Checks
export const AUTH_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};

// 📊 Authentication Lifecycle States
export const AUTH_STATUS = {
  IDLE: "IDLE",
  AUTHENTICATING: "AUTHENTICATING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  EXPIRED: "EXPIRED",
  ERROR: "ERROR",
  REFRESHING: "REFRESHING",
  CHECKING: "CHECKING"  // Added for RequireAuth.jsx
};

// 🔒 Authentication Tiers / Levels
export const AUTH_LEVELS = {
  BASIC: 1,
  ELEVATED: 2,
  ADMIN: 3,
  SUPERADMIN: 4
};

// 🎯 Permission Levels (Added for RequireAuth.jsx)
export const PERMISSION_LEVELS = {
  NONE: 0,
  BASIC: 1,
  ELEVATED: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

// ⚙️ Storage Keys
export const STORAGE_KEYS = {
  USER: "user",
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ACCESS_EXPIRY: "accessToken_expires",
  TOKEN_TYPE: "token_type",
  TOKEN_SCOPE: "token_scope",
  CLIENT_ID: "teralynk_client_instance_id",
  SESSION_ID: "teralynk_session_id",
  SESSION_START: "teralynk_session_start",
  LAST_ACTIVITY: "teralynk_last_activity",
  SECURITY_CONTEXT: "security_ctx"
};

// ✅ Security Enforcement Policies
export const SECURITY_POLICIES = {
  REQUIRE_MFA: true,
  ENFORCE_DEVICE_BINDING: true,
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_REFRESH_ATTEMPTS: 5,
  VALIDATION_INTERVAL_MS: 5 * 60 * 1000,
  ACTIVITY_WARNING_THRESHOLD_MS: 25 * 60 * 1000,
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,
  DEFAULT: {
    tokenIssuer: "teralynk",
    tokenAudience: "teralynk_users",
    maxRefreshAttempts: 5,
    sessionTimeout: 30 * 60 * 1000,
    tokenExpiryGracePeriod: 60 * 1000,
    requiredTokenClaims: ["sub", "iat", "exp", "aud", "iss"],
    strictMode: false
  },
  STRICT: {
    tokenIssuer: "teralynk",
    tokenAudience: "teralynk_users",
    maxRefreshAttempts: 3,
    sessionTimeout: 15 * 60 * 1000,
    tokenExpiryGracePeriod: 30 * 1000,
    requiredTokenClaims: ["sub", "iat", "exp", "aud", "iss", "device_id"],
    strictMode: true,
    enforceDeviceBinding: true,
    requireMFA: true,
    maxFailedAttempts: 3,
    lockoutDuration: 15 * 60 * 1000,
    passwordPolicies: {
      minLength: 12,
      requireNumbers: true,
      requireSpecialChars: true,
      requireUppercase: true,
      requireLowercase: true,
      preventReuse: 5
    }
  }
};

// 🔑 Permission Sets
export const PERMISSION_SETS = {
  USER: [
    'read:profile',
    'update:profile',
    'read:settings'
  ],
  ADMIN: [
    'read:profile',
    'update:profile',
    'read:settings',
    'update:settings',
    'read:users',
    'update:users',
    'read:logs'
  ],
  SUPER_ADMIN: [
    'read:profile',
    'update:profile',
    'read:settings',
    'update:settings',
    'read:users',
    'update:users',
    'delete:users',
    'read:logs',
    'read:system',
    'update:system'
  ]
};

// 🚫 Error Types
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_FAILED: 'MFA_FAILED',
  DEVICE_NOT_RECOGNIZED: 'DEVICE_NOT_RECOGNIZED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};
