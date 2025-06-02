// ✅ FILE: /frontend/src/constants/securityConstants.js
// Shared security constants for authUtils.js and secureStorage.js

export const SECURITY_LEVELS = Object.freeze({
  NONE: 0,
  STANDARD: 1,
  ELEVATED: 2,
  CRITICAL: 3,
  MAXIMUM: 4
});

export const STORAGE_KEYS = Object.freeze({
  SECURITY_CONTEXT: 'security_ctx',
  SESSION_ID: 'session_id',
  DEVICE_ID: 'device_id',
  CLIENT_ID: 'client_id',
  MFA_STATE: 'mfa_state',
  AUTH_STATE: 'auth_state',
  REFRESH_TOKEN: 'refresh_token',
  DEVICE_TOKEN: 'device_token',
  ENCRYPTION_KEY: 'encryption_key',
  LAST_ACTIVITY: 'last_activity',
  USER_CONTEXT: 'user_ctx',
  TOKEN_META: 'token_meta',
  ACCESS_TOKEN: 'access_token',
  USER: 'user'
});

export const SECURITY_CONFIG = Object.freeze({
  mfa: {
    requiredLevel: SECURITY_LEVELS.ELEVATED,
    allowedMethods: ['totp', 'sms', 'email', 'webauthn'],
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 3,
    cooldownPeriod: 300,
    backoffMultiplier: 2,
    verificationTimeout: 180,
    allowedTimeSkew: 30
  },
  idle: {
    checkInterval: 300000,
    warningThreshold: 240000,
    maxIdleTime: 900000,
    activityEvents: ['mousedown', 'keydown', 'touchstart', 'scroll'],
    graceTime: 60000,
    checkFrequency: 10000
  },
  token: {
    refreshThreshold: 300,
    maxRefreshAttempts: 3,
    refreshBackoffBase: 2000,
    minRefreshInterval: 60000,
    requiredClaims: ['sub', 'exp', 'iat', 'iss', 'aud'],
    allowedClockSkew: 60,
    refreshWindow: 300
  },
  security: {
    fingerprintTimeout: 3600000,
    contextTimeout: 86400000,
    maxFailedAttempts: 5,
    lockoutDuration: 900000,
    maxDevicesPerUser: 5,
    maxSessionsPerDevice: 3,
    minPasswordLength: 12,
    requireMixedCase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordHistory: 5,
    sessionRenewalWindow: 300,
    deviceVerificationInterval: 3600000
  }
});

export const SECURITY_EVENTS = Object.freeze({
  CONTEXT_INITIALIZED: 'security:context:initialized',
  CONTEXT_UPDATED: 'security:context:updated',
  CONTEXT_EXPIRED: 'security:context:expired',
  CONTEXT_INVALID: 'security:context:invalid',
  
  MFA_INITIATED: 'security:mfa:initiated',
  MFA_VERIFIED: 'security:mfa:verified',
  MFA_FAILED: 'security:mfa:failed',
  MFA_EXPIRED: 'security:mfa:expired',
  
  IDLE_WARNING: 'security:idle:warning',
  IDLE_TIMEOUT: 'security:idle:timeout',
  IDLE_RESET: 'security:idle:reset',
  
  SESSION_STARTED: 'security:session:started',
  SESSION_RENEWED: 'security:session:renewed',
  SESSION_EXPIRED: 'security:session:expired',
  SESSION_TERMINATED: 'security:session:terminated',
  
  TOKEN_REFRESH: 'security:token:refresh',
  TOKEN_EXPIRED: 'security:token:expired',
  TOKEN_INVALID: 'security:token:invalid',
  TOKEN_REVOKED: 'security:token:revoked',
  
  DEVICE_VERIFIED: 'security:device:verified',
  DEVICE_REJECTED: 'security:device:rejected',
  DEVICE_CHANGED: 'security:device:changed',
  
  SECURITY_VIOLATION: 'security:violation',
  SECURITY_WARNING: 'security:warning',
  SECURITY_ERROR: 'security:error',
  
  USER_VERIFIED: 'security:user:verified',
  USER_LOCKED: 'security:user:locked',
  USER_UNLOCKED: 'security:user:unlocked',
  
  VALIDATION_SUCCESS: 'security:validation:success',
  VALIDATION_FAILED: 'security:validation:failed'
});
