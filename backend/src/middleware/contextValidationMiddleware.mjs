// ================================================
// File: /backend/src/middleware/contextValidationMiddleware.mjs
// ================================================

import { logInfo, logError, logWarn, logDebug } from '../utils/logger.mjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Constants for validation rules
 */
const VALIDATION_RULES = {
  INVALID_USER_IDS: ['default-user-id', '123'],
  REQUIRED_SOURCE: 'trusted',
  MAX_TIMESTAMP_DIFF_MS: 5 * 60 * 1000 // 5 minutes
};

/**
 * Generates consistent request metadata
 */
const generateRequestMetadata = () => ({
  uniqueId: uuidv4(),
  timestamp: Date.now().toString(),
});

/**
 * Header normalization middleware
 */
export const normalizeHeaders = (req, res, next) => {
  try {
    const { uniqueId, timestamp } = generateRequestMetadata();

    // Set required headers if not present
    req.headers['x-user-id'] = req.headers['x-user-id'] || `user-${uniqueId.slice(0, 8)}`;
    req.headers['x-trace-id'] = req.headers['x-trace-id'] || uniqueId;
    req.headers['x-session-id'] = req.headers['x-session-id'] || req.sessionID || uniqueId;
    req.headers['x-source'] = req.headers['x-source'] || VALIDATION_RULES.REQUIRED_SOURCE;
    req.headers['x-request-time'] = req.headers['x-request-time'] || timestamp;

    logDebug('Headers normalized', {
      userId: req.headers['x-user-id'],
      traceId: req.headers['x-trace-id'],
      sessionId: req.headers['x-session-id'],
      source: req.headers['x-source'],
      requestTime: req.headers['x-request-time']
    });

    next();
  } catch (error) {
    logError('Header normalization failed', { error: error.message });
    next(error);
  }
};

/**
 * Validates the request context including user identity, timestamp, and source
 */
export const validateRequestContext = (req, res, next) => {
  try {
    const context = {
      userId: req.headers['x-user-id'],
      timestamp: parseInt(req.headers['x-request-time'], 10),
      source: req.headers['x-source'],
      traceId: req.headers['x-trace-id'],
      sessionId: req.headers['x-session-id']
    };

    const violations = validateContext(context);

    if (violations.length > 0) {
      logWarn('Context validation failed', { 
        violations, 
        traceId: context.traceId 
      });
      
      return res.status(400).json({ 
        error: 'Context Validation Failed', 
        violations 
      });
    }

    // Attach validated context to request
    req.context = context;
    logDebug('Context validated successfully', context);
    next();
  } catch (error) {
    logError('Context validation error', { error: error.message });
    next(error);
  }
};

/**
 * Validates the context object against defined rules
 */
const validateContext = (context) => {
  const violations = [];

  // Validate User ID
  if (!context.userId) {
    violations.push({
      field: 'userId',
      code: 'MISSING_USER_ID',
      message: 'User ID is required'
    });
  } else if (VALIDATION_RULES.INVALID_USER_IDS.includes(context.userId)) {
    violations.push({
      field: 'userId',
      code: 'INVALID_USER_ID',
      message: 'Invalid user ID provided'
    });
  }

  // Validate Timestamp
  if (isNaN(context.timestamp)) {
    violations.push({
      field: 'timestamp',
      code: 'INVALID_TIMESTAMP',
      message: 'Invalid timestamp format'
    });
  } else {
    const timeDiff = Math.abs(Date.now() - context.timestamp);
    if (timeDiff > VALIDATION_RULES.MAX_TIMESTAMP_DIFF_MS) {
      violations.push({
        field: 'timestamp',
        code: 'TIMESTAMP_OUT_OF_RANGE',
        message: 'Request timestamp is too old or future dated'
      });
    }
  }

  // Validate Source
  if (context.source !== VALIDATION_RULES.REQUIRED_SOURCE) {
    violations.push({
      field: 'source',
      code: 'INVALID_SOURCE',
      message: `Request source must be '${VALIDATION_RULES.REQUIRED_SOURCE}'`
    });
  }

  // Validate Trace ID
  if (!context.traceId) {
    violations.push({
      field: 'traceId',
      code: 'MISSING_TRACE_ID',
      message: 'Trace ID is required'
    });
  }

  // Validate Session ID
  if (!context.sessionId) {
    violations.push({
      field: 'sessionId',
      code: 'MISSING_SESSION_ID',
      message: 'Session ID is required'
    });
  }

  return violations;
};

/**
 * Logs detailed diagnostic information about the request
 */
export const logRequestDiagnostics = (req, res, next) => {
  const diagnostics = {
    method: req.method,
    path: req.originalUrl,
    headers: {
      userId: req.headers['x-user-id'],
      traceId: req.headers['x-trace-id'],
      sessionId: req.headers['x-session-id'],
      source: req.headers['x-source'],
      requestTime: req.headers['x-request-time']
    },
    timestamp: new Date().toISOString()
  };

  logInfo('Request diagnostics', diagnostics);
  next();
};

/**
 * Combined middleware stack for complete context processing
 */
export const contextMiddleware = [
  normalizeHeaders,
  validateRequestContext,
  logRequestDiagnostics
];

export default {
  normalizeHeaders,
  validateRequestContext,
  logRequestDiagnostics,
  contextMiddleware
};
