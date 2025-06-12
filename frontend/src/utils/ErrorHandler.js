// File: /frontend/src/utils/ErrorHandler.js

// Keep your existing code and add these auth-specific additions:

/**
 * Auth-specific error codes
 */
export const AUTH_ERROR_CODES = {
  TOKEN_INVALID: 'auth/token-invalid',
  TOKEN_EXPIRED: 'auth/token-expired',
  SESSION_TIMEOUT: 'auth/session-timeout',
  REFRESH_FAILED: 'auth/refresh-failed',
  LOGIN_FAILED: 'auth/login-failed',
  DEVICE_VERIFICATION: 'auth/device-verification-failed',
  SECURITY_VIOLATION: 'auth/security-violation',
  RATE_LIMIT: 'auth/rate-limit-exceeded',
  STORAGE_ERROR: 'auth/storage-error',
  NETWORK_ERROR: 'auth/network-error'
};

/**
 * Custom AuthError class for auth-specific errors
 */
export class AuthError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }

  /**
   * Creates a user-friendly error message
   */
  toUserMessage() {
    switch (this.code) {
      case AUTH_ERROR_CODES.TOKEN_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case AUTH_ERROR_CODES.SESSION_TIMEOUT:
        return 'Your session timed out due to inactivity.';
      case AUTH_ERROR_CODES.LOGIN_FAILED:
        return 'Login failed. Please check your credentials.';
      case AUTH_ERROR_CODES.DEVICE_VERIFICATION:
        return 'Device verification failed. Please try again.';
      case AUTH_ERROR_CODES.RATE_LIMIT:
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return this.message || 'An authentication error occurred.';
    }
  }
}

/**
 * Auth-specific error handler
 * @param {Error|AuthError} error 
 * @param {Object} options
 */
export const handleAuthError = (error, options = {}) => {
  const {
    context = 'Auth',
    silent = false,
    throwError = true,
    emitEvent = null
  } = options;

  // Convert to AuthError if needed
  const authError = error instanceof AuthError ? error : new AuthError(
    getErrorMessage(error),
    error.code || AUTH_ERROR_CODES.NETWORK_ERROR,
    { originalError: error }
  );

  // Log error
  if (!silent) {
    logError(authError, `[${context}] ${authError.code}`);
  }

  // Emit security event if provided
  if (emitEvent) {
    emitEvent('auth:error', {
      code: authError.code,
      message: authError.message,
      timestamp: authError.timestamp,
      context
    });
  }

  if (throwError) {
    throw authError;
  }

  return authError;
};

/**
 * Wrapper for auth operations with error handling
 */
export const withAuthErrorHandling = (fn, options = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleAuthError(error, options);
    }
  };
};

// Extend your existing getErrorMessage function
export const getErrorMessage = (error) => {
  // Add auth-specific error handling
  if (error instanceof AuthError) {
    return error.toUserMessage();
  }

  // Your existing error message logic...
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;

  // AWS Cognito-specific errors
  switch (error.name) {
    case "NotAuthorizedException":
      return "Your session has expired. Please log in again.";
    case "UserNotFoundException":
      return "User not found. Please check your credentials.";
    case "CodeMismatchException":
      return "Invalid confirmation code.";
    default:
      break;
  }

  // Rest of your existing code...
};

/**
 * Rate limiting error handler
 */
export const handleRateLimit = (error, retryAfter = 1000) => {
  if (error.code === AUTH_ERROR_CODES.RATE_LIMIT) {
    return new Promise(resolve => setTimeout(resolve, retryAfter));
  }
  throw error;
};

/**
 * Security violation handler
 */
export const handleSecurityViolation = (violation, options = {}) => {
  const authError = new AuthError(
    'Security violation detected',
    AUTH_ERROR_CODES.SECURITY_VIOLATION,
    { violation, ...options }
  );
  
  handleAuthError(authError, {
    context: 'Security',
    silent: false,
    throwError: true,
    ...options
  });
};
