// ✅ FILE: /frontend/src/utils/errors.js

export class SecurityError extends Error {
    constructor(message, code = 'SECURITY_ERROR') {
      super(message);
      this.name = 'SecurityError';
      this.code = code;
      Error.captureStackTrace?.(this, SecurityError);
    }
  }
  
  export class AuthError extends Error {
    constructor(message, code = 'AUTH_ERROR') {
      super(message);
      this.name = 'AuthError';
      this.code = code;
      Error.captureStackTrace?.(this, AuthError);
    }
  }
  
  export class TokenError extends Error {
    constructor(message, code = 'TOKEN_ERROR') {
      super(message);
      this.name = 'TokenError';
      this.code = code;
      Error.captureStackTrace?.(this, TokenError);
    }
  }
  