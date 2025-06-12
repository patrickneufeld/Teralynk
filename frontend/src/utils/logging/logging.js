///Users/patrick/Projects/Teralynk/frontend/src/utils/logging/logging.js
/**
 * 🧠 Unified Logging System for Teralynk Frontend
 * Environment-aware, toggleable, rate-limited, and scoped for production-grade observability.
 */

import { emitTelemetry } from '../telemetry';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'critical'];

const DEBUG_ENABLED = import.meta.env.VITE_DEBUG_LOG === 'true';
const IS_DEV = import.meta.env.MODE === 'development';

const DEFAULT_CONFIG = {
  minLevel: DEBUG_ENABLED ? 'debug' : IS_DEV ? 'info' : 'warn',
  enableConsole: true,
  errorRateLimit: {
    maxErrors: 5,
    timeWindow: 60000,
    perErrorType: true,
  },
};

const state = {
  config: { ...DEFAULT_CONFIG },
  errorCounts: new Map(),
};

const shouldLog = (level) => {
  const { minLevel } = state.config;
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(minLevel);
};

const formatMessage = (level, context, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
};

const rateLimitErrors = (errorType) => {
  const { maxErrors, timeWindow, perErrorType } = state.config.errorRateLimit;
  const now = Date.now();
  const key = perErrorType ? errorType : 'global';

  const timestamps = (state.errorCounts.get(key) || []).filter((t) => now - t <= timeWindow);
  timestamps.push(now);
  state.errorCounts.set(key, timestamps);

  return timestamps.length <= maxErrors;
};

// 🚨 Core logger
const log = (level, message, metadata = {}, context = 'General', rawError = null) => {
  if (!shouldLog(level) || !state.config.enableConsole) return;

  if ((level === 'error' || level === 'critical') && rawError) {
    const errorType = rawError?.name || message;
    if (!rateLimitErrors(errorType)) return;
  }

  const formatted = formatMessage(level, context, message);
  const consoleFn = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
    critical: console.error,
  }[level] || console.log;

  try {
    consoleFn(formatted, metadata, rawError || '');
  } catch (err) {
    if (level !== 'error') console.warn('[Logger] Internal logging failure:', err);
  }
};

// ✅ Standard log levels
const logDebug = (msg, meta = {}, ctx = 'General') => log('debug', msg, meta, ctx);
const logInfo = (msg, meta = {}, ctx = 'General') => log('info', msg, meta, ctx);
const logWarn = (msg, meta = {}, ctx = 'General') => log('warn', msg, meta, ctx);
const logError = (err, ctx = 'General', meta = {}) => {
  const msg = err instanceof Error ? err.message : String(err);
  log('error', msg, meta, ctx, err);
};
const logCritical = (err, ctx = 'General', meta = {}) => {
  const msg = err instanceof Error ? err.message : String(err);
  log('critical', msg, meta, ctx, err);
  if (IS_DEV) alert(`🚨 Critical error occurred:\n\n${msg}`);
};

// 🧪 Log only once per message
const onceCache = new Set();
const logOnce = (msg, meta = {}, ctx = 'General') => {
  const key = `${ctx}::${msg}`;
  if (!onceCache.has(key)) {
    onceCache.add(key);
    logWarn(`[ONCE] ${msg}`, meta, ctx);
  }
};

// 🛠 Logger Configuration
const configureLogger = (overrides = {}) => {
  state.config = {
    ...DEFAULT_CONFIG,
    ...overrides,
    errorRateLimit: {
      ...DEFAULT_CONFIG.errorRateLimit,
      ...(overrides.errorRateLimit || {}),
    },
  };
};

const getLoggerConfig = () => ({ ...state.config });

// 🔖 Named Logger
const createLogger = (scope = 'App') => ({
  debug: (msg, meta = {}) => logDebug(msg, meta, scope),
  info: (msg, meta = {}) => logInfo(msg, meta, scope),
  warn: (msg, meta = {}) => logWarn(msg, meta, scope),
  error: (err, meta = {}) => logError(err, scope, meta),
  critical: (err, meta = {}) => logCritical(err, scope, meta),
  once: (msg, meta = {}) => logOnce(msg, meta, scope),
});

// 🧩 Event Logger (🔥 DEV-safe)
const logEvent = (type, payload = {}, context = 'Event') => {
  try {
    if (!IS_DEV) {
      emitTelemetry(type, payload);
    }
  } catch (err) {
    logError(err, 'TelemetryEmit');
  }

  if (shouldLog('info')) {
    logInfo(`[Event: ${type}]`, payload, context);
  }
};

// ✅ EXPORTS
export {
  createLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logCritical,
  logOnce,
  configureLogger,
  getLoggerConfig,
  logEvent,
};

export default {
  createLogger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logCritical,
  logOnce,
  configureLogger,
  getLoggerConfig,
  logEvent,
};
