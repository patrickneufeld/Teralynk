import { MetricsCollector } from '@/utils/metrics/MetricsCollector';
import crypto from 'crypto';

const metrics = new MetricsCollector('security_validation');

/**
 * Custom Error class for Validation Failures.
 */
class ValidationError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Validate security context for operations.
 * @param {Object} context Security context to validate
 * @param {string} context.userId User ID
 * @param {string} context.orgId Organization ID
 * @param {number} [depth=1] Validation depth level
 * @returns {Promise<boolean>} Returns true if valid
 * @throws {ValidationError} Throws if validation fails
 */
export const validateSecurityContext = async (context = {}, depth = 1) => {
  const startTime = Date.now();

  try {
    // Required fields check
    const requiredFields = ['userId', 'orgId'];
    const missing = requiredFields.filter(field => !context[field]);

    if (missing.length > 0) {
      throw new ValidationError(
        `Missing required security fields: ${missing.join(', ')}`,
        'MISSING_REQUIRED_FIELDS',
        { missing }
      );
    }

    // Format validation: Ensure userId and orgId are valid strings
    if (typeof context.userId !== 'string' || context.userId.length < 3) {
      throw new ValidationError(
        'Invalid userId format: Must be a string with at least 3 characters.',
        'INVALID_USER_ID',
        { userId: context.userId }
      );
    }

    if (typeof context.orgId !== 'string' || context.orgId.length < 3) {
      throw new ValidationError(
        'Invalid orgId format: Must be a string with at least 3 characters.',
        'INVALID_ORG_ID',
        { orgId: context.orgId }
      );
    }

    // Timestamp validation: Ensure timestamp is valid number (milliseconds)
    if (isNaN(context.timestamp) || context.timestamp <= 0) {
      throw new ValidationError(
        'Invalid timestamp format: Timestamp must be a positive number.',
        'INVALID_TIMESTAMP',
        { timestamp: context.timestamp }
      );
    }

    // Source validation: Ensure source is 'trusted' or 'internal'
    const validSources = ['trusted', 'internal'];
    if (!validSources.includes(context.source)) {
      throw new ValidationError(
        `Invalid source: Source must be one of [${validSources.join(', ')}].`,
        'INVALID_SOURCE',
        { source: context.source }
      );
    }

    // Deep validation if requested (example: roles, permissions)
    if (depth > 1) {
      // Example for deeper checks (can be extended for more complex validation)
      // If you expect roles or permission checks, they can be added here.
    }

    // Record metrics on successful validation
    metrics.recordLatency('validation_time', Date.now() - startTime);
    metrics.incrementCounter('successful_validations');

    return true;

  } catch (error) {
    // Track metrics for validation failures
    metrics.incrementCounter('validation_failures');
    metrics.recordEvent('validation_error', {
      error: error.message,
      code: error.code,
      context: error.context,
      duration: Date.now() - startTime
    });

    // Log detailed error info but mask sensitive data like userId
    secureLogging('Context validation failed', {
      ...error.context,
      userId: 'REDACTED', // Mask sensitive data
    });

    // Throw error to propagate failure
    throw error;
  }
};

/**
 * Get validation service health
 */
export const getValidationHealth = () => ({
  metrics: metrics.getMetrics(),
  timestamp: new Date().toISOString()
});

export default {
  validateSecurityContext,
  getValidationHealth,
  ValidationError
};

/**
 * Additional Helpers to Harden the Security
 * - Secure logging: Mask sensitive fields
 * - Secure timestamp parsing
 * - Extendable source validation
 */
function secureLogging(message, context = {}) {
  // Mask sensitive fields from the context
  const sensitiveFields = ['userId', 'token', 'password'];
  const sanitizedContext = { ...context };

  sensitiveFields.forEach(field => {
    if (sanitizedContext[field]) sanitizedContext[field] = 'REDACTED';
  });

  metrics.recordEvent('secure_log', { message, context: sanitizedContext });
}

function parseTimestamp(timestamp) {
  // More robust timestamp parsing
  if (typeof timestamp === 'number') return timestamp;
  const parsed = new Date(timestamp).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Context normalization function for inbound requests (optional).
 */
export const normalizeContext = (req, res, next) => {
  try {
    req.context = {
      timestamp: parseTimestamp(req.headers['x-timestamp']),
      userId: req.headers['x-user-id'] || 'system',
      source: validateSource(req.headers['x-source']),
      traceId: req.headers['x-trace-id'] || crypto.randomUUID(),
    };
    next();
  } catch (err) {
    secureLogging('Context normalization failed', { error: err.message });
    res.status(400).json({ error: 'Invalid request context' });
  }
};

function validateSource(source) {
  // Default to internal if not trusted
  return ['trusted', 'internal'].includes(source) ? source : 'internal';
}

/**
 * Context validation middleware
 */
export const validateRequestContext = async (req, res, next) => {
  try {
    const violations = [];

    if (!req.context?.userId) {
      violations.push({ ruleId: 'userIdRequired', message: 'User ID is required' });
    }

    if (isNaN(req.context?.timestamp)) {
      violations.push({ ruleId: 'timestampValid', message: 'Timestamp must be valid' });
    }

    if (!['trusted', 'internal'].includes(req.context?.source)) {
      violations.push({ ruleId: 'sourceValid', message: 'Invalid source' });
    }

    if (violations.length > 0) {
      secureLogging('Context validation failed', { violations });
      return res.status(400).json({
        error: 'Context validation failed',
        violations
      });
    }

    next();
  } catch (err) {
    secureLogging('Validation error', { error: err.message });
    res.status(500).json({ error: 'Internal validation error' });
  }
};
