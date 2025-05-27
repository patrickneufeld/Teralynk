// backend/src/utils/logging/loggingConstants.js

export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace'
};

export const LOG_COLORS = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'gray'
};

export const LOG_SETTINGS = {
    // File settings
    FILE: {
        SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
        MAX_FILES: 5,
        DATE_PATTERN: 'YYYY-MM-DD',
        RETENTION_DAYS: 30
    },
    
    // Directory settings
    PATHS: {
        BASE_DIR: 'logs',
        ERROR_LOG: 'error.log',
        COMBINED_LOG: 'combined.log',
        ACCESS_LOG: 'access.log',
        AUDIT_LOG: 'audit.log'
    },

    // Format settings
    FORMAT: {
        TIMESTAMP: 'YYYY-MM-DD HH:mm:ss.SSS',
        TIMEZONE: 'UTC'
    },

    // Performance thresholds (in ms)
    PERFORMANCE: {
        SLOW_REQUEST: 1000,
        VERY_SLOW_REQUEST: 3000,
        TIMEOUT: 10000
    }
};

export const LOG_CATEGORIES = {
    AUTH: 'auth',
    API: 'api',
    DATABASE: 'database',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    SYSTEM: 'system',
    AUDIT: 'audit'
};

export const LOG_ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test'
};

// Sensitive fields that should be redacted in logs
export const SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'creditCard',
    'ssn'
];

export default {
    LOG_LEVELS,
    LOG_COLORS,
    LOG_SETTINGS,
    LOG_CATEGORIES,
    LOG_ENVIRONMENTS,
    SENSITIVE_FIELDS
};
