// ================================================
// ✅ FILE: /frontend/src/constants/auth.js
// Core authentication and security constants
// Version: 1.0.0
// ================================================

/**
 * @fileoverview Core authentication and security constants
 * @version 1.0.0
 * @license MIT
 */

// ==============================
// 🔐 Core Permission Definitions
// ==============================

const CORE_PERMISSIONS = {
  // System Level
  SYSTEM: {
    ALL: 'system:*',
    READ: 'system:read',
    WRITE: 'system:write',
    EXECUTE: 'system:execute',
    MANAGE: 'system:manage'
  },

  // Security Level
  SECURITY: {
    ALL: 'security:*',
    READ: 'security:read',
    MANAGE: 'security:manage',
    AUDIT: 'security:audit'
  },

  // User Management
  USER: {
    ALL: 'user:*',
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE: 'user:manage'
  },

  // Profile Management
  PROFILE: {
    READ: 'profile:read',
    UPDATE: 'profile:update',
    DELETE: 'profile:delete'
  },

  // Document Management
  DOCUMENT: {
    ALL: 'document:*',
    READ: 'document:read',
    CREATE: 'document:create',
    UPDATE: 'document:update',
    DELETE: 'document:delete',
    SHARE: 'document:share'
  },

  // Settings Management
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
    MANAGE: 'settings:manage'
  },

  // Analytics
  ANALYTICS: {
    VIEW: 'analytics:view',
    EXPORT: 'analytics:export',
    MANAGE: 'analytics:manage'
  }
};

// ==============================
// 🛡️ Permission Sets
// ==============================

export const PERMISSION_SETS = {};

PERMISSION_SETS.GUEST = [
  CORE_PERMISSIONS.DOCUMENT.READ
];

PERMISSION_SETS.USER = [
  CORE_PERMISSIONS.PROFILE.READ,
  CORE_PERMISSIONS.PROFILE.UPDATE,
  CORE_PERMISSIONS.DOCUMENT.READ,
  CORE_PERMISSIONS.DOCUMENT.CREATE,
  CORE_PERMISSIONS.DOCUMENT.UPDATE,
  CORE_PERMISSIONS.DOCUMENT.DELETE,
  CORE_PERMISSIONS.SETTINGS.READ
];

PERMISSION_SETS.MODERATOR = [
  ...PERMISSION_SETS.USER,
  CORE_PERMISSIONS.USER.READ,
  CORE_PERMISSIONS.DOCUMENT.ALL,
  CORE_PERMISSIONS.SETTINGS.READ
];

PERMISSION_SETS.ADMIN = [
  ...PERMISSION_SETS.MODERATOR,
  CORE_PERMISSIONS.USER.ALL,
  CORE_PERMISSIONS.SETTINGS.MANAGE,
  CORE_PERMISSIONS.ANALYTICS.VIEW,
  CORE_PERMISSIONS.SECURITY.READ
];

PERMISSION_SETS.SUPER_ADMIN = [
  CORE_PERMISSIONS.SYSTEM.ALL,
  CORE_PERMISSIONS.SECURITY.ALL,
  CORE_PERMISSIONS.USER.ALL,
  CORE_PERMISSIONS.DOCUMENT.ALL,
  CORE_PERMISSIONS.SETTINGS.MANAGE,
  CORE_PERMISSIONS.ANALYTICS.MANAGE
];


// ==============================
// 📊 Authentication Events
// ==============================

export const AUTH_EVENTS = {
  // Core Auth Events
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  
  // Session Events
  SESSION_STARTED: "SESSION_STARTED",
  SESSION_RENEWED: "SESSION_RENEWED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_TERMINATED: "SESSION_TERMINATED",
  
  // Token Events
  TOKEN_ISSUED: "TOKEN_ISSUED",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_REVOKED: "TOKEN_REVOKED",
  
  // Security Events
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  BRUTE_FORCE_DETECTED: "BRUTE_FORCE_DETECTED",
  
  // MFA Events
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_SUCCESS: "MFA_SUCCESS",
  MFA_FAILED: "MFA_FAILED",
  MFA_RESET: "MFA_RESET",
  
  // Device Events
  DEVICE_VERIFIED: "DEVICE_VERIFIED",
  DEVICE_REJECTED: "DEVICE_REJECTED",
  DEVICE_BINDING_FAILED: "DEVICE_BINDING_FAILED",
  
  // Profile Events
  PROFILE_UPDATE: "PROFILE_UPDATE",
  SETTINGS_UPDATE: "SETTINGS_UPDATE",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  
  // Permission Events
  PERMISSION_GRANTED: "PERMISSION_GRANTED",
  PERMISSION_REVOKED: "PERMISSION_REVOKED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  ROLE_CHANGED: "ROLE_CHANGED"
};

// ==============================
// 👤 Role Definitions
// ==============================

export const AUTH_ROLES = {
  GUEST: "guest",
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  SYSTEM: "system"
};

// ==============================
// 🔄 Authentication States
// ==============================

export const AUTH_STATUS = {
  // Core States
  IDLE: "IDLE",
  INITIALIZING: "INITIALIZING",
  AUTHENTICATING: "AUTHENTICATING",
  AUTHENTICATED: "AUTHENTICATED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  
  // Session States
  EXPIRED: "EXPIRED",
  LOCKED: "LOCKED",
  SUSPENDED: "SUSPENDED",
  
  // Process States
  REFRESHING: "REFRESHING",
  CHECKING: "CHECKING",
  LOADING: "LOADING",
  
  // Security States
  COMPROMISED: "COMPROMISED",
  BLOCKED: "BLOCKED",
  
  // MFA States
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_PENDING: "MFA_PENDING",
  MFA_VERIFIED: "MFA_VERIFIED",
  
  // Error States
  ERROR: "ERROR",
  FATAL_ERROR: "FATAL_ERROR"
};

// ==============================
// 📈 Security Levels
// ==============================

export const SECURITY_LEVELS = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
  MAXIMUM: 5
};

// ==============================
// 🎯 Permission Levels
// ==============================

export const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
  SYSTEM: 5
};

// ==============================
// 🔑 Storage Keys
// ==============================

export const STORAGE_KEYS = {
  // Auth Data
  USER: "user",
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ACCESS_EXPIRY: "accessToken_expires",
  
  // Token Metadata
  TOKEN_TYPE: "token_type",
  TOKEN_SCOPE: "token_scope",
  TOKEN_SIGNATURE: "token_signature",
  
  // Session Data
  CLIENT_ID: "teralynk_client_instance_id",
  SESSION_ID: "teralynk_session_id",
  SESSION_START: "teralynk_session_start",
  SESSION_SIGNATURE: "teralynk_session_signature",
  
  // Security Context
  LAST_ACTIVITY: "teralynk_last_activity",
  SECURITY_CONTEXT: "security_ctx",
  DEVICE_ID: "device_id",
  SECURITY_HASH: "security_hash",
  
  // Encryption Keys
  PUBLIC_KEY: "public_key",
  KEY_VERSION: "key_version"
};

// ==============================
// ⚙️ Security Policies
// ==============================

export const SECURITY_POLICIES = {
  DEFAULT: {
    // Token Settings
    tokenIssuer: "teralynk",
    tokenAudience: "teralynk_users",
    maxRefreshAttempts: 5,
    tokenExpiryGracePeriod: 60 * 1000,
    requiredTokenClaims: ["sub", "iat", "exp", "aud", "iss"],
    
    // Session Settings
    sessionTimeout: 30 * 60 * 1000,
    activityCheckInterval: 5 * 60 * 1000,
    warningThreshold: 25 * 60 * 1000,
    
    // Security Features
    strictMode: false,
    enforceDeviceBinding: false,
    requireMFA: false,
    
    // Rate Limiting
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    
    // Encryption
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 24 * 60 * 60 * 1000,
    
    // Headers
    securityHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000'
    }
  },
  
  STRICT: {
    // Token Settings
    tokenIssuer: "teralynk",
    tokenAudience: "teralynk_users",
    maxRefreshAttempts: 3,
    tokenExpiryGracePeriod: 30 * 1000,
    requiredTokenClaims: ["sub", "iat", "exp", "aud", "iss", "device_id", "security_context"],
    
    // Session Settings
    sessionTimeout: 15 * 60 * 1000,
    activityCheckInterval: 2 * 60 * 1000,
    warningThreshold: 12 * 60 * 1000,
    
    // Security Features
    strictMode: true,
    enforceDeviceBinding: true,
    requireMFA: true,
    validateFingerprint: true,
    
    // Rate Limiting
    maxLoginAttempts: 3,
    lockoutDuration: 30 * 60 * 1000,
    
    // Password Policies
    passwordPolicies: {
      minLength: 12,
      requireNumbers: true,
      requireSpecialChars: true,
      requireUppercase: true,
      requireLowercase: true,
      preventReuse: 5,
      expiryDays: 90
    },
    
    // Encryption
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationInterval: 12 * 60 * 60 * 1000,
    
    // Headers
    securityHeaders: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'",
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
};

// ==============================
// ❌ Error Types
// ==============================

export const AUTH_ERRORS = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    code: 'AUTH001',
    message: 'Invalid username or password'
  },
  SESSION_EXPIRED: {
    code: 'AUTH002',
    message: 'Your session has expired'
  },
  TOKEN_EXPIRED: {
    code: 'AUTH003',
    message: 'Authentication token expired'
  },
  INVALID_TOKEN: {
    code: 'AUTH004',
    message: 'Invalid authentication token'
  },
  
  // MFA Errors
  MFA_REQUIRED: {
    code: 'MFA001',
    message: 'Multi-factor authentication required'
  },
  MFA_FAILED: {
    code: 'MFA002',
    message: 'Multi-factor authentication failed'
  },
  
  // Security Errors
  DEVICE_NOT_RECOGNIZED: {
    code: 'SEC001',
    message: 'Unrecognized device detected'
  },
  PERMISSION_DENIED: {
    code: 'SEC002',
    message: 'Insufficient permissions'
  },
  ACCOUNT_LOCKED: {
    code: 'SEC003',
    message: 'Account locked due to suspicious activity'
  },
  SECURITY_VIOLATION: {
    code: 'SEC004',
    message: 'Security policy violation detected'
  },
  
  // System Errors
  NETWORK_ERROR: {
    code: 'SYS001',
    message: 'Network connection error'
  },
  SERVER_ERROR: {
    code: 'SYS002',
    message: 'Internal server error'
  },
  ENCRYPTION_ERROR: {
    code: 'SYS003',
    message: 'Encryption operation failed'
  }
};

// ==============================
// 📝 Validation Rules
// ==============================

export const VALIDATION_RULES = {
  PASSWORD: {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    preventCommonWords: true,
    preventSequential: true,
    preventRepeating: true
  },
  EMAIL: {
    maxLength: 255,
    requireValidDomain: true,
    preventDisposable: true
  },
  USERNAME: {
    minLength: 3,
    maxLength: 32,
    allowedChars: /^[a-zA-Z0-9_.-]*$/,
    preventReserved: true
  }
};

// ==============================
// 🔄 Default Export
// ==============================

export default {
  AUTH_EVENTS,
  AUTH_ROLES,
  AUTH_STATUS,
  SECURITY_LEVELS,
  PERMISSION_LEVELS,
  PERMISSION_SETS,
  STORAGE_KEYS,
  SECURITY_POLICIES,
  AUTH_ERRORS,
  VALIDATION_RULES,
  CORE_PERMISSIONS
};
