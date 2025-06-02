// ================================================
// ✅ FILE: /frontend/src/utils/logging/logStub.js
// Safe Logging Stubs with Error Handling
// Version: 2.0.0
// ================================================

// ==============================
// 📊 Constants
// ==============================

const LOG_LEVELS = Object.freeze({
  DEBUG: { name: 'debug', color: '#7F7F7F', icon: '🔍' },
  INFO: { name: 'info', color: '#0066CC', icon: 'ℹ️' },
  WARN: { name: 'warn', color: '#CC9900', icon: '⚠️' },
  ERROR: { name: 'error', color: '#CC0000', icon: '❌' },
  CRITICAL: { name: 'critical', color: '#990000', icon: '🚨' }
});

const MAX_LOG_SIZE = 10000; // Characters
const MAX_DEPTH = 3; // Object nesting depth
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'auth'];

// ==============================
// 🛠️ Utility Functions
// ==============================

/**
 * Safely stringifies objects with circular refs
 * @param {any} obj - Object to stringify
 * @param {number} depth - Current depth
 * @returns {string} Safe string representation
 */
function safeStringify(obj, depth = 0) {
  try {
    if (depth > MAX_DEPTH) return '[Max Depth Exceeded]';
    if (!obj) return String(obj);
    
    if (typeof obj === 'object') {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        // Handle sensitive data
        if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
          return '[REDACTED]';
        }

        // Handle circular references
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }

        return value;
      }, 2);
    }

    return String(obj);
  } catch (err) {
    return '[Stringify Failed]';
  }
}

/**
 * Formats log entry with metadata
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} Formatted log entry
 */
function formatLogEntry(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;

  return {
    timestamp,
    level: logLevel.name,
    message: String(message).slice(0, MAX_LOG_SIZE),
    context: safeStringify(context, 0),
    metadata: {
      browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'non-browser',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.VITE_APP_VERSION || 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'non-browser'
    }
  };
}

/**
 * Safely logs to console with formatting
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 */
function safeLog(level, message, context = {}) {
  try {
    const entry = formatLogEntry(level, message, context);
    const logLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    
    // Create console styling
    const styles = [
      `color: ${logLevel.color}`,
      'font-weight: bold',
      'padding: 2px 4px',
      'border-radius: 2px'
    ].join(';');

    // Log with styling
    console.log(
      `%c${logLevel.icon} [${entry.level.toUpperCase()}]`,
      styles,
      entry
    );

    // Store in session for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      while (logs.length > 100) logs.shift(); // Keep last 100 logs
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch {}

  } catch (err) {
    // Fallback to basic logging
    console.log('[LOGGING_FAILED]', {
      timestamp: new Date().toISOString(),
      message,
      error: err.message
    });
  }
}

// ==============================
// 📤 Export Safe Logging Functions
// ==============================

export function safeLogDebug(message, context = {}) {
  safeLog('debug', message, context);
}

export function safeLogInfo(message, context = {}) {
  safeLog('info', message, context);
}

export function safeLogWarn(message, context = {}) {
  safeLog('warn', message, context);
}

export function safeLogError(message, context = {}) {
  safeLog('error', message, context);
}

export function safeLogCritical(message, context = {}) {
  safeLog('critical', message, context);
}

// ==============================
// 🔧 Utility Exports
// ==============================

export const getStoredLogs = () => {
  try {
    return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
  } catch {
    return [];
  }
};

export const clearStoredLogs = () => {
  try {
    sessionStorage.removeItem('app_logs');
  } catch {}
};

export const exportLogsAsCSV = () => {
  try {
    const logs = getStoredLogs();
    const headers = ['timestamp', 'level', 'message', 'context'];
    const csv = [
      headers.join(','),
      ...logs.map(log => headers.map(key => 
        JSON.stringify(log[key] || '')
      ).join(','))
    ].join('\n');
    return csv;
  } catch (err) {
    safeLogError('Failed to export logs as CSV', { error: err });
    return '';
  }
};

// ==============================
// 📤 Default Export
// ==============================

export default {
  debug: safeLogDebug,
  info: safeLogInfo,
  warn: safeLogWarn,
  error: safeLogError,
  critical: safeLogCritical,
  getStoredLogs,
  clearStoredLogs,
  exportLogsAsCSV,
  LOG_LEVELS
};
