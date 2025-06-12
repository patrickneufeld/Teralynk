// ================================================
// ✅ FILE: /frontend/src/utils/errors.js
// Custom Error Classes for Security and Auth
// Version: 2.0.0
// ================================================

// ==============================
// 🔐 Security Error Codes
// ==============================

export const ERROR_CODES = Object.freeze({
  // Security Errors
  SECURITY_VIOLATION: 'SEC_001',
  CONTEXT_INVALID: 'SEC_002',
  FINGERPRINT_MISMATCH: 'SEC_003',
  DEVICE_MISMATCH: 'SEC_004',
  SESSION_INVALID: 'SEC_005',
  TAMPERING_DETECTED: 'SEC_006',
  ENCRYPTION_FAILED: 'SEC_007',
  STORAGE_ERROR: 'SEC_008',
  
  // Authentication Errors
  AUTH_FAILED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  SESSION_EXPIRED: 'AUTH_003',
  PERMISSION_DENIED: 'AUTH_004',
  MFA_REQUIRED: 'AUTH_005',
  MFA_FAILED: 'AUTH_006',
  ACCOUNT_LOCKED: 'AUTH_007',
  
  // Token Errors
  TOKEN_EXPIRED: 'TOKEN_001',
  TOKEN_INVALID: 'TOKEN_002',
  TOKEN_MISSING: 'TOKEN_003',
  TOKEN_REVOKED: 'TOKEN_004',
  REFRESH_FAILED: 'TOKEN_005',
  
  // Validation Errors
  VALIDATION_FAILED: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  SCHEMA_ERROR: 'VAL_003',
  
  // API Errors
  API_ERROR: 'API_001',
  NETWORK_ERROR: 'API_002',
  TIMEOUT_ERROR: 'API_003',
  RATE_LIMIT: 'API_004',
  
  // Generic Errors
  UNKNOWN_ERROR: 'ERR_001',
  INTERNAL_ERROR: 'ERR_002',
  NOT_IMPLEMENTED: 'ERR_003'
});

// ==============================
// 🛡️ Base Security Error
// ==============================

class BaseError extends Error {
  constructor(message, code, name, metadata = {}) {
    super(message);
    
    // Basic properties
    this.name = name;
    this.code = code;
    this.timestamp = Date.now();
    this.metadata = metadata;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Parse stack trace
    this.parseStackTrace();
  }

  parseStackTrace() {
    if (this.stack) {
      const stackLines = this.stack.split('\n');
      this.stackTrace = stackLines.map(line => line.trim());
      this.errorLocation = this.stackTrace[1] || 'unknown';
    } else {
      this.stackTrace = [];
      this.errorLocation = 'unknown';
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      location: this.errorLocation,
      metadata: this.metadata
    };
  }

  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

// ==============================
// 🔒 Security Error Classes
// ==============================

export class SecurityError extends BaseError {
  constructor(message, code = ERROR_CODES.SECURITY_VIOLATION, metadata = {}) {
    super(message, code, 'SecurityError', {
      severity: 'high',
      category: 'security',
      ...metadata
    });
  }
}

export class AuthError extends BaseError {
  constructor(message, code = ERROR_CODES.AUTH_FAILED, metadata = {}) {
    super(message, code, 'AuthError', {
      severity: 'high',
      category: 'auth',
      ...metadata
    });
  }
}

export class TokenError extends BaseError {
  constructor(message, code = ERROR_CODES.TOKEN_INVALID, metadata = {}) {
    super(message, code, 'TokenError', {
      severity: 'high',
      category: 'token',
      ...metadata
    });
  }
}

export class ValidationError extends BaseError {
  constructor(message, code = ERROR_CODES.VALIDATION_FAILED, metadata = {}) {
    super(message, code, 'ValidationError', {
      severity: 'medium',
      category: 'validation',
      ...metadata
    });
  }
}

export class APIError extends BaseError {
  constructor(message, code = ERROR_CODES.API_ERROR, metadata = {}) {
    super(message, code, 'APIError', {
      severity: 'high',
      category: 'api',
      ...metadata
    });
  }
}

// ==============================
// 🔧 Error Utilities
// ==============================

/**
 * Creates an error instance based on error type
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} metadata - Additional error metadata
 * @returns {BaseError} Appropriate error instance
 */
export const createError = (message, code = ERROR_CODES.UNKNOWN_ERROR, metadata = {}) => {
  const errorMap = {
    SEC_: SecurityError,
    AUTH_: AuthError,
    TOKEN_: TokenError,
    VAL_: ValidationError,
    API_: APIError
  };

  for (const [prefix, ErrorClass] of Object.entries(errorMap)) {
    if (code.startsWith(prefix)) {
      return new ErrorClass(message, code, metadata);
    }
  }

  return new BaseError(message, code, 'UnknownError', metadata);
};

/**
 * Wraps async function with error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      // Convert to appropriate error type
      const wrappedError = createError(
        error.message || 'An unexpected error occurred',
        ERROR_CODES.UNKNOWN_ERROR,
        {
          originalError: error,
          ...options
        }
      );

      throw wrappedError;
    }
  };
};

// ==============================
// 📤 Default Export
// ==============================

export default {
  SecurityError,
  AuthError,
  TokenError,
  ValidationError,
  APIError,
  ERROR_CODES,
  createError,
  withErrorHandling
};
