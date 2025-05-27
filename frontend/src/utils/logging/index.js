// File: /frontend/src/utils/logging/index.js

import { v4 as uuidv4 } from 'uuid';

const LOG_LEVELS = {
  DEBUG: { name: 'debug', priority: 0 },
  INFO: { name: 'info', priority: 1 },
  WARN: { name: 'warn', priority: 2 },
  ERROR: { name: 'error', priority: 3 },
  CRITICAL: { name: 'critical', priority: 4 },
};

const DEFAULT_CONFIG = {
  minLevel: LOG_LEVELS.INFO.name,
  enableConsole: true,
  enableRemote: true,
  remoteLogLevels: [LOG_LEVELS.ERROR.name, LOG_LEVELS.CRITICAL.name],
  errorRateLimit: {
    maxErrors: 5,
    timeWindow: 60000,
    perErrorType: true,
  },
};

let config = { ...DEFAULT_CONFIG };
const errorCounts = {};
let remoteLoggingFailedFlag = false;

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

// ─────────────────────────────
// 🧠 Client + Session Utilities
// ─────────────────────────────
const getClientId = () => localStorage.getItem('teralynk_client_instance_id') || 'unknown-client';
const getSessionId = () => sessionStorage.getItem('teralynk_session_id') || 'unknown-session';
const getSessionDuration = () => {
  const start = localStorage.getItem('teralynk_session_start');
  return start ? Math.floor((Date.now() - parseInt(start, 10)) / 1000) : 0;
};

const shouldLog = (level) => {
  const levelObj = Object.values(LOG_LEVELS).find((l) => l.name === level);
  const minLevelObj = Object.values(LOG_LEVELS).find((l) => l.name === config.minLevel);
  return levelObj && minLevelObj && levelObj.priority >= minLevelObj.priority;
};

const shouldSendError = (errorKey) => {
  const { maxErrors, timeWindow, perErrorType } = config.errorRateLimit;
  const key = perErrorType ? errorKey : 'global';
  const now = Date.now();

  if (!errorCounts[key]) {
    errorCounts[key] = { count: 1, timestamp: now };
    return true;
  }

  if (now - errorCounts[key].timestamp > timeWindow) {
    errorCounts[key] = { count: 1, timestamp: now };
    return true;
  }

  if (errorCounts[key].count < maxErrors) {
    errorCounts[key].count++;
    return true;
  }

  if (!errorCounts[key].limitReached) {
    errorCounts[key].limitReached = true;
    warn(`Logging rate limit reached for ${key}`);
  }

  return false;
};

export const resetRateLimits = () => {
  Object.keys(errorCounts).forEach((key) => delete errorCounts[key]);
};

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

export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred.';
  if (typeof error === 'string') return error;

  switch (error.name) {
    case 'NotAuthorizedException': return 'Your session has expired. Please log in again.';
    case 'UserNotFoundException': return 'User not found. Please check your credentials.';
    case 'CodeMismatchException': return 'Invalid confirmation code.';
    case 'InvalidPasswordException': return 'Password does not meet requirements.';
    case 'LimitExceededException': return 'Too many attempts. Please try again later.';
    case 'ExpiredCodeException': return 'Verification code has expired.';
  }

  if (error.response) {
    if (error.response.data?.message) return error.response.data.message;
    if (error.response.data?.error) return error.response.data.error;
    switch (error.response.status) {
      case 400: return 'The request was invalid. Please check your input.';
      case 401: return 'You need to log in.';
      case 403: return 'You don\'t have permission to access this resource.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'This operation couldn\'t be completed.';
      case 429: return 'Too many requests. Please try again.';
      case 500: return 'An internal server error occurred.';
      default: return `Server error: ${error.response.status}`;
    }
  }

  if (error.message === 'Network Error') return 'Unable to connect. Check your internet connection.';
  if (error.status && error.statusText) return `Server responded with ${error.status}: ${error.statusText}`;
  if (error.message) return error.message;

  return 'An unexpected error occurred.';
};

const createLogEntry = (level, message, data = {}, context = '') => {
  const requestId = data?.requestId || uuidv4();
  return {
    level,
    message,
    data,
    context,
    timestamp: new Date().toISOString(),
    requestId,
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

const sendRemoteLog = async (logEntry) => {
  if (!config.enableRemote || !config.remoteLogLevels.includes(logEntry.level)) return;
  if ((logEntry.level === 'error' || logEntry.level === 'critical') && !shouldSendError(logEntry.errorKey)) return;

  try {
    if (remoteLoggingFailedFlag) return;

    const apiUrl = import.meta.env.PROD
      ? import.meta.env.VITE_API_URL || 'https://api.teralynk.com'
      : '/api';

    const response = await fetch(`${apiUrl}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(logEntry),
    });

    if (response.status === 401) {
      logWarn('Unauthorized to send remote log, skipping further attempts for now.');
      remoteLoggingFailedFlag = true;
      setTimeout(() => {
        remoteLoggingFailedFlag = false;
      }, 15000);
    }
  } catch {
    remoteLoggingFailedFlag = true;
    setTimeout(() => {
      remoteLoggingFailedFlag = false;
    }, 5000);
  }
};

const log = (level, message, data = {}, context = '') => {
  if (!shouldLog(level)) return data?.requestId || uuidv4();
  const logEntry = createLogEntry(level, message, data, context);
  const { requestId } = logEntry;

  if (config.enableConsole) {
    const method = {
      debug: originalConsole.debug,
      info: originalConsole.info,
      warn: originalConsole.warn,
      error: originalConsole.error,
      critical: originalConsole.error,
    }[level] || originalConsole.log;

    method(`[${context || 'APP'}] [${level.toUpperCase()}]`, message, data);
  }

  sendRemoteLog(logEntry);
  return requestId;
};

export const configure = (options = {}) => {
  config = { ...DEFAULT_CONFIG, ...options };
};

export const debug = (msg, data = {}, ctx = '') => log('debug', msg, data, ctx);
export const info = (msg, data = {}, ctx = '') => log('info', msg, data, ctx);
export const warn = (msg, data = {}, ctx = '') => log('warn', msg, data, ctx);
export const error = (err, ctx = '', data = {}) => {
  const errObj = formatError(err);
  const payload = {
    ...errObj,
    ...data,
    errorKey: `${errObj.name}${errObj.code ? `:${errObj.code}` : ''}`,
  };
  return log('error', errObj.message, payload, ctx);
};

export const critical = (err, ctx = '', data = {}) => {
  const errObj = formatError(err);
  const payload = {
    ...errObj,
    ...data,
    errorKey: `${errObj.name}${errObj.code ? `:${errObj.code}` : ''}`,
  };
  return log('critical', errObj.message, payload, ctx);
};

export const logInfo = info;
export const logWarn = warn;
export const logError = error;

export const logSecurityEvent = (eventType, details = {}) =>
  logInfo(`[SECURITY EVENT] ${eventType}`, details, 'SECURITY');

export const createLogger = (ctx) => ({
  debug: (msg, data = {}) => debug(msg, data, ctx),
  info: (msg, data = {}) => info(msg, data, ctx),
  warn: (msg, data = {}) => warn(msg, data, ctx),
  error: (err, data = {}) => error(err, ctx, data),
  critical: (err, data = {}) => critical(err, ctx, data),
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
    const auditData = { event, timestamp: new Date().toISOString(), data };
    info(`Audit: ${event}`, auditData, 'AUDIT');

    const apiUrl = import.meta.env.PROD
      ? import.meta.env.VITE_API_URL || 'https://api.teralynk.com'
      : '/api';

    await fetch(`${apiUrl}/audit/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export const formatLogToCSV = (logs) => {
  return [
    'timestamp,level,traceId,message',
    ...logs.map((l) =>
      `${l.timestamp},${l.level},${l.traceId},"${l.message.replace(/"/g, '""')}"`
    )
  ].join('\n');
};

export default {
  debug,
  info,
  warn,
  error,
  critical,
  logInfo,
  logWarn,
  logError,
  logSecurityEvent,
  configure,
  createLogger,
  handleWithErrorLogging,
  getErrorMessage,
  logAudit,
  formatValidationErrors,
  formatLogToCSV,
  LOG_LEVELS,
};
