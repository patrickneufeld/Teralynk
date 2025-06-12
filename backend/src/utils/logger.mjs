// ✅ FILE: /backend/src/utils/logger.mjs

/**
 * Teralynk Backend Logger
 * ------------------------
 * Structured logging for all backend services.
 * Supports log levels with timestamp and optional context.
 */

const getTimestamp = () => new Date().toISOString();

export function logInfo(message, context = {}) {
  console.log('[INFO]', {
    timestamp: getTimestamp(),
    message,
    ...context,
  });
}

export function logWarn(message, context = {}) {
  console.warn('[WARN]', {
    timestamp: getTimestamp(),
    message,
    ...context,
  });
}

export function logError(message, context = {}) {
  console.error('[ERROR]', {
    timestamp: getTimestamp(),
    message,
    ...context,
  });
}

export function logDebug(message, context = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[DEBUG]', {
      timestamp: getTimestamp(),
      message,
      ...context,
    });
  }
}

export function logTrace(message, context = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.trace('[TRACE]', {
      timestamp: getTimestamp(),
      message,
      ...context,
    });
  }
}

export function logSecurityEvent(message, context = {}) {
  console.log('[SECURITY]', {
    timestamp: getTimestamp(),
    message,
    ...context,
  });
}

// Default export for destructured use
const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
  trace: logTrace,
  security: logSecurityEvent,
};

export default logger;
