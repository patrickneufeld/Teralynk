// ✅ FILE: /backend/src/constants/auth.js

export const AUTH_STATUS = {
    INITIALIZING: 'initializing',
    AUTHENTICATING: 'authenticating',
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    TWO_FACTOR_REQUIRED: 'two_factor_required',
    ERROR: 'error'
};

export const AUTH_ERRORS = {
    TOKEN_MISSING: 'TOKEN_MISSING',
    TOKEN_INVALID: 'TOKEN_INVALID',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS'
};

export const AUTH_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest'
};

export const AUTH_PERMISSIONS = {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    MANAGE_USERS: 'manage_users',
    MANAGE_ROLES: 'manage_roles',
    MANAGE_PERMISSIONS: 'manage_permissions',
    VIEW_LOGS: 'view_logs',
    MANAGE_SYSTEM: 'manage_system'
};

export const AUTH_EVENTS = {
    LOGIN: 'login',
    LOGOUT: 'logout',
    PASSWORD_RESET: 'password_reset',
    PASSWORD_CHANGE: 'password_change',
    PROFILE_UPDATE: 'profile_update',
    TOKEN_REFRESH: 'token_refresh',
    TWO_FACTOR_REQUIRED: 'two_factor_required',
    TWO_FACTOR_SUCCESS: 'two_factor_success',
    TWO_FACTOR_FAILURE: 'two_factor_failure'
};

export const AUTH_SETTINGS = {
    TOKEN_EXPIRY: 24 * 60 * 60, // 24 hours in seconds
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60, // 15 minutes in seconds
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SYMBOLS: true,
    SESSION_INACTIVITY_TIMEOUT: 30 * 60, // 30 minutes in seconds
    TWO_FACTOR_CODE_LENGTH: 6,
    TWO_FACTOR_CODE_EXPIRY: 5 * 60 // 5 minutes in seconds
};

export const AUTH_HEADERS = {
    TOKEN: 'Authorization',
    REFRESH_TOKEN: 'X-Refresh-Token',
    CLIENT_ID: 'X-Client-ID',
    DEVICE_ID: 'X-Device-ID'
};

export default {
    AUTH_STATUS,
    AUTH_ERRORS,
    AUTH_ROLES,
    AUTH_PERMISSIONS,
    AUTH_EVENTS,
    AUTH_SETTINGS,
    AUTH_HEADERS
};
