// ✅ FILE: /frontend/src/utils/logger.js

import React from 'react';
import { MetricsCollector } from './metrics/MetricsCollector';

// Constants & Configuration
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const CONFIG = {
  enableConsole: import.meta.env.MODE !== 'production',
  logLevel: import.meta.env.VITE_LOG_LEVEL || LOG_LEVELS.INFO,
  maxLogSize: 10000,
  remoteLogging: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT || '/api/logs',
  batchSize: 50,
  flushInterval: 5000,
};

// State Management
let currentTraceId = null;
const metrics = new MetricsCollector('logger');

// Logger State Class
class LoggerState {
  constructor() {
    this.logs = [];
    this.errorCount = 0;
    this.lastReset = Date.now();
    this.sessionId = this.generateSessionId();
    this.batchQueue = [];
    this.flushTimeout = null;
  }

  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomUUID()}`;
  }

  addLog(log) {
    this.logs.unshift(log);
    if (this.logs.length > CONFIG.maxLogSize) this.logs.pop();
    if (log.level === LOG_LEVELS.ERROR) this.errorCount++;
    if (CONFIG.remoteLogging) {
      this.batchQueue.push(log);
      this.scheduleBatchFlush();
    }
  }

  scheduleBatchFlush() {
    if (!this.flushTimeout && this.batchQueue.length > 0) {
      this.flushTimeout = setTimeout(() => this.flushBatch(), CONFIG.flushInterval);
    }
    if (this.batchQueue.length >= CONFIG.batchSize) {
      this.flushBatch();
    }
  }

  async flushBatch() {
    if (this.batchQueue.length === 0) return;
    clearTimeout(this.flushTimeout);
    this.flushTimeout = null;
    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await fetch(CONFIG.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-ID': getTraceId(),
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({ logs: batch })
      });
      metrics.incrementCounter('remote_logs_sent', batch.length);
    } catch (err) {
      metrics.incrementCounter('remote_logging_failures');
      console.error('Remote logging failed:', err);
      this.batchQueue = [...batch, ...this.batchQueue].slice(0, CONFIG.maxLogSize);
    }
  }

  reset() {
    this.logs = [];
    this.errorCount = 0;
    this.lastReset = Date.now();
    this.sessionId = this.generateSessionId();
    this.batchQueue = [];
    clearTimeout(this.flushTimeout);
    this.flushTimeout = null;
  }
}

const state = new LoggerState();

const originalConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  error: console.error,
};

console.error = function (...args) {
  try {
    if (args?.[0]?.toString?.().includes('Console error:')) return;
    originalConsole.error(...args);
  } catch (e) {
    originalConsole.warn('console.error failed:', e);
  }
};

// Utilities
const getClientId = () => localStorage.getItem('teralynk_client_instance_id') || 'unknown-client';
const getSessionId = () => sessionStorage.getItem('teralynk_session_id') || 'unknown-session';
const getSessionDuration = () => {
  const start = localStorage.getItem('teralynk_session_start');
  return start ? Math.floor((Date.now() - parseInt(start, 10)) / 1000) : 0;
};

const LOG_PRIORITY = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const shouldLog = (level) => LOG_PRIORITY[level] >= LOG_PRIORITY[CONFIG.logLevel];

export const resetRateLimits = () => errorCounts.clear();

const errorCounts = new Map();

export const formatError = (error) => {
  if (!error) return { message: 'Unknown error', name: 'Error' };
  if (typeof error === 'string') return { message: error, name: 'Error' };
  return {
    message: error.message || String(error),
    name: error.name || 'Error',
    stack: error.stack,
    code: error.code,
  };
};

export const getErrorMessage = (error) => formatError(error).message;

const createLogEntry = (level, message, data = {}, context = '') => {
  const traceId = getTraceId();
  const requestId = data?.requestId || crypto.randomUUID();
  return {
    level,
    message,
    data,
    context,
    timestamp: new Date().toISOString(),
    requestId,
    traceId,
    client_id: getClientId(),
    session_id: getSessionId(),
    session_duration: getSessionDuration(),
    environment: import.meta.env.MODE || 'development',
    user_agent: navigator.userAgent,
    app_version: import.meta.env.VITE_APP_VERSION || 'unknown',
    url: window.location.href,
    errorKey: data?.errorKey || message,
  };
};

const log = (level, message, data = {}, context = '') => {
  if (!shouldLog(level)) return data?.requestId || crypto.randomUUID();
  const logEntry = createLogEntry(level, message, data, context);
  const { requestId, traceId } = logEntry;

  if (CONFIG.enableConsole) {
    const method = {
      debug: originalConsole.debug,
      info: originalConsole.info,
      warn: originalConsole.warn,
      error: originalConsole.error,
      critical: originalConsole.error,
    }[level] || originalConsole.log;

    const logStyle = level === LOG_LEVELS.ERROR ? 'color: red; font-weight: bold' :
                     level === LOG_LEVELS.WARN ? 'color: orange' :
                     level === LOG_LEVELS.INFO ? 'color: blue' :
                     'color: gray';

    method(
      `%c[${level}]%c [${traceId}] [${context || 'APP'}]:`,
      logStyle,
      'color: inherit',
      message,
      data
    );
  }

  state.addLog(logEntry);
  metrics.incrementCounter(`log_level_${level.toLowerCase()}`);
  return requestId;
};

// Exposed Logger Functions
export const debug = (msg, data = {}, ctx = '') => log(LOG_LEVELS.DEBUG, msg, data, ctx);
export const info = (msg, data = {}, ctx = '') => log(LOG_LEVELS.INFO, msg, data, ctx);
export const warn = (msg, data = {}, ctx = '') => log(LOG_LEVELS.WARN, msg, data, ctx);
export const error = (err, ctx = '', data = {}) => {
  const errObj = formatError(err);
  const payload = {
    ...errObj,
    ...data,
    errorKey: `${errObj.name}${errObj.code ? `:${errObj.code}` : ''}`,
  };
  return log(LOG_LEVELS.ERROR, errObj.message, payload, ctx);
};
export const critical = (err, ctx = '', data = {}) => error(err, ctx, data);

// Alias
export const logError = error;
export const logInfo = info;
export const logWarn = warn;
export const logDebug = debug;

// Helpers
export const logSecurityEvent = (eventType, details = {}) =>
  logInfo(`[SECURITY EVENT] ${eventType}`, details, 'SECURITY');

export const createLogger = (ctx) => ({
  debug: (msg, data = {}) => debug(msg, data, ctx),
  info: (msg, data = {}) => info(msg, data, ctx),
  warn: (msg, data = {}) => warn(msg, data, ctx),
  error: (err, data = {}) => error(err, ctx, data),
  critical: (err, data = {}) => critical(err, ctx, data),
  getContext: () => ctx
});

export const handleWithErrorLogging = async (fn, ctx = 'Unknown') => {
  try {
    return await fn();
  } catch (err) {
    const errorId = error(err, ctx);
    throw new Error(`${getErrorMessage(err)} (Error ID: ${errorId})`);
  }
};

export const logAudit = async (event, data = {}) => {
  try {
    const auditData = { 
      event, 
      timestamp: new Date().toISOString(), 
      data,
      traceId: getTraceId()
    };

    info(`Audit: ${event}`, auditData, 'AUDIT');

    const apiUrl = import.meta.env.PROD
      ? import.meta.env.VITE_API_URL || 'https://api.teralynk.com'
      : '/api';

    await fetch(`${apiUrl}/audit/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-ID': getTraceId()
      },
      credentials: 'include',
      body: JSON.stringify(auditData),
    });
  } catch (err) {
    error(err, 'AUDIT', { event, data });
  }
};

export const formatValidationErrors = (errors) => {
  if (!errors) return {};
  if (errors.inner) {
    return errors.inner.reduce((acc, e) => {
      acc[e.path] = e.message;
      return acc;
    }, {});
  }

  if (typeof errors === 'object') {
    return Object.entries(errors).reduce((acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value[0] : value;
      return acc;
    }, {});
  }

  return {};
};

export const generateTraceId = () => `trace_${Date.now()}_${crypto.randomUUID()}`;
export const getTraceId = () => currentTraceId ||= generateTraceId();

export default {
  debug,
  info,
  warn,
  error,
  critical,
  logError,
  logInfo,
  logWarn,
  logDebug,
  logSecurityEvent,
  createLogger,
  handleWithErrorLogging,
  getErrorMessage,
  logAudit,
  formatValidationErrors,
  generateTraceId,
  getTraceId,
  LOG_LEVELS,
  metrics,
  getClientId,
  getSessionId,
  getSessionDuration,
  resetRateLimits,
  createLogEntry,
};
