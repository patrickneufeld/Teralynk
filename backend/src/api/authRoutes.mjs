// ================================================
// ✅ FILE: /backend/src/api/authRoutes.mjs
// Secure Authentication Routes with Enhanced Security
// Version: 2.2.0
// ================================================

import express from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.mjs';
import { validateSchema } from '../middleware/validateSchema.mjs';
import { sanitizeInput } from '../utils/security/inputSanitizer.mjs';
import { SECURITY_EVENTS, emitSecurityEvent } from '../utils/security/eventEmitter.mjs';

import {
  authenticateUser,
  signUpUser,
  refreshUserToken,
  logoutUser,
  changeUserPassword,
  requestPasswordReset,
  resetUserPassword,
  verifyCognitoToken
} from '../services/auth/authService.js';

import rbacMiddleware from '../middleware/rbacMiddleware.mjs';

const logger = createLogger('AuthRoutes');

const router = express.Router();

// ✅ Constants
const RATE_LIMIT_WINDOWS = {
  DEFAULT: 15 * 60 * 1000, // 15 minutes
  STRICT: 60 * 60 * 1000,  // 1 hour
};

const MAX_ATTEMPTS = {
  LOGIN: 5,
  PASSWORD_RESET: 3,
  GENERAL: 50,
};

// ✅ Enhanced Rate Limiters
const createLimiter = (windowMs, max, options = {}) => rateLimit({
  windowMs,
  max,
  message: { 
    success: false, 
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...options
});

const authLimiter = createLimiter(RATE_LIMIT_WINDOWS.DEFAULT, MAX_ATTEMPTS.LOGIN, {
  keyGenerator: (req) => req.body.email || req.ip,
});

const resetLimiter = createLimiter(RATE_LIMIT_WINDOWS.STRICT, MAX_ATTEMPTS.PASSWORD_RESET);
const generalLimiter = createLimiter(RATE_LIMIT_WINDOWS.DEFAULT, MAX_ATTEMPTS.GENERAL);

// ✅ Enhanced Request Validation
const validateRequestBody = (requiredFields) => (req, res, next) => {
  try {
    const sanitizedBody = sanitizeInput(req.body);
    req.body = sanitizedBody;

    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: missingFields,
        code: 'INVALID_REQUEST'
      });
    }

    next();
  } catch (error) {
    logger.error('Request validation error', { error });
    return res.status(400).json({
      success: false,
      error: 'Invalid request format',
      code: 'VALIDATION_ERROR'
    });
  }
};

// ✅ Error Handler Wrapper
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Route error', { 
      path: req.path, 
      error,
      requestId: req.id 
    });
    
    const statusCode = error.statusCode || 500;
    const errorResponse = {
      success: false,
      error: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      requestId: req.id
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
  });
};

// ✅ Routes with Enhanced Security and Error Handling

// Get Current User
router.get('/me', generalLimiter, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw { 
      statusCode: 401, 
      message: 'Missing authorization token',
      code: 'MISSING_TOKEN' 
    };
  }

  const user = await verifyCognitoToken(token);
  if (!user?.sub) {
    throw { 
      statusCode: 401, 
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN' 
    };
  }

  return res.json({
    success: true,
    data: {
      user: {
        id: user.sub,
        email: user.email,
        name: user.name || '',
        roles: user['custom:roles']?.split(',') || [],
        cognito: user
      }
    }
  });
}));

// Login
router.post(
  '/login',
  authLimiter,
  validateRequestBody(['email', 'password']),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const authResult = await authenticateUser(email, password);

    emitSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
      email,
      timestamp: new Date(),
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken: authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn,
        tokenType: authResult.TokenType
      }
    });
  })
);

// Register
router.post(
  '/register',
  generalLimiter,
  rbacMiddleware(['admin']),
  validateRequestBody(['email', 'password']),
  asyncHandler(async (req, res) => {
    const result = await signUpUser(req.body.email, req.body.password);
    
    emitSecurityEvent(SECURITY_EVENTS.USER_REGISTERED, {
      email: req.body.email,
      timestamp: new Date(),
      requestId: req.id
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  })
);

// Refresh Token
router.post(
  '/refresh',
  generalLimiter,
  validateRequestBody(['refreshToken', 'username']),
  asyncHandler(async (req, res) => {
    const result = await refreshUserToken(
      req.body.refreshToken,
      req.body.username
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.AccessToken,
        idToken: result.IdToken,
        expiresIn: result.ExpiresIn,
        tokenType: result.TokenType
      }
    });
  })
);

// Logout
router.post(
  '/logout',
  generalLimiter,
  validateRequestBody(['accessToken']),
  asyncHandler(async (req, res) => {
    await logoutUser(req.body.accessToken);
    
    emitSecurityEvent(SECURITY_EVENTS.LOGOUT, {
      timestamp: new Date(),
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

// Verify Token
router.get(
  '/verify',
  generalLimiter,
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw {
        statusCode: 400,
        message: 'Authorization token is required',
        code: 'MISSING_TOKEN'
      };
    }

    const result = await verifyCognitoToken(token);
    
    res.json({
      success: true,
      message: 'Token verified successfully',
      data: result
    });
  })
);

// Change Password
router.post(
  '/change-password',
  authLimiter,
  rbacMiddleware(['user']),
  validateRequestBody(['accessToken', 'previousPassword', 'proposedPassword']),
  asyncHandler(async (req, res) => {
    const { accessToken, previousPassword, proposedPassword } = req.body;
    const result = await changeUserPassword(
      accessToken,
      previousPassword,
      proposedPassword
    );

    emitSecurityEvent(SECURITY_EVENTS.PASSWORD_CHANGED, {
      timestamp: new Date(),
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: result
    });
  })
);

// Request Password Reset
router.post(
  '/request-password-reset',
  resetLimiter,
  validateRequestBody(['email']),
  asyncHandler(async (req, res) => {
    const result = await requestPasswordReset(req.body.email);
    
    emitSecurityEvent(SECURITY_EVENTS.PASSWORD_RESET_REQUESTED, {
      email: req.body.email,
      timestamp: new Date(),
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Password reset code sent',
      data: result
    });
  })
);

// Reset Password
router.post(
  '/reset-password',
  resetLimiter,
  validateRequestBody(['email', 'confirmationCode', 'newPassword']),
  asyncHandler(async (req, res) => {
    const { email, confirmationCode, newPassword } = req.body;
    const result = await resetUserPassword(
      email,
      confirmationCode,
      newPassword
    );

    emitSecurityEvent(SECURITY_EVENTS.PASSWORD_RESET_COMPLETED, {
      email,
      timestamp: new Date(),
      requestId: req.id
    });

    res.json({
      success: true,
      message: 'Password reset successful',
      data: result
    });
  })
);

export default router;
