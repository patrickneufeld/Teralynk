// ================================================
// ✅ [Validated & Hardened] FILE: /frontend/src/utils/logging/index.js
// Contextual Logging System for Teralynk Frontend
// ESM: Full default and named export compatibility
// ================================================

// ===============================
// Base Logging Utilities
// ===============================
export const logInfo = (message, meta = {}) => {
  try { console.info(`[INFO] ${message}`, meta); }
  catch { console.log(`[INFO] ${message}`); }
};

export const logWarn = (message, meta = {}) => {
  try { console.warn(`[WARN] ${message}`, meta); }
  catch { console.log(`[WARN] ${message}`); }
};

export const logDebug = (message, meta = {}) => {
  if (import.meta?.env?.MODE === 'development') {
    try { console.debug(`[DEBUG] ${message}`, meta); }
    catch { console.log(`[DEBUG] ${message}`); }
  }
};

export const logError = (error, meta = {}) => {
  try {
    const msg = error?.message || error;
    const stack = error?.stack || null;
    console.error(`[ERROR] ${msg}`, { ...(stack && { stack }), ...meta });
  } catch {
    console.log(`[ERROR] ${error?.message || error}`);
  }
};

// ===============================
// Remote Logger
// ===============================
export const sendRemoteLog = async ({ level, message, meta = {} }) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, meta }),
    });
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.warn('⚠️ Remote log failed:', err.message);
    }
  }
};

// ===============================
// Scoped Logger Factory
// ===============================
export const createLogger = (scope = 'default') => ({
  info: (msg, meta = {}) => logInfo(`[${scope}] ${msg}`, meta),
  warn: (msg, meta = {}) => logWarn(`[${scope}] ${msg}`, meta),
  debug: (msg, meta = {}) => logDebug(`[${scope}] ${msg}`, meta),
  error: (err, meta = {}) => logError(err, { scope, ...meta }),
  remote: (level, msg, meta = {}) => sendRemoteLog({ level, message: `[${scope}] ${msg}`, meta }),
});

// ===============================
// React Context Support (Optional, for provider use)
// ===============================
import React, { createContext, useContext } from 'react';

export const LoggingContext = createContext({
  logInfo,
  logWarn,
  logDebug,
  logError,
  sendRemoteLog,
  withContext: (ctx = {}) => ({
    logInfo: (msg, meta = {}) => logInfo(msg, { ...ctx, ...meta }),
    logWarn: (msg, meta = {}) => logWarn(msg, { ...ctx, ...meta }),
    logDebug: (msg, meta = {}) => logDebug(msg, { ...ctx, ...meta }),
    logError: (err, meta = {}) => logError(err, { ...ctx, ...meta }),
    sendRemoteLog: (entry) => sendRemoteLog({ ...entry, meta: { ...ctx, ...(entry.meta || {}) } }),
  }),
});

export const LoggingProvider = ({ children, context = {} }) => {
  const logger = {
    logInfo: (msg, meta = {}) => logInfo(msg, { ...context, ...meta }),
    logWarn: (msg, meta = {}) => logWarn(msg, { ...context, ...meta }),
    logDebug: (msg, meta = {}) => logDebug(msg, { ...context, ...meta }),
    logError: (err, meta = {}) => logError(err, { ...context, ...meta }),
    sendRemoteLog: (entry) => sendRemoteLog({ ...entry, meta: { ...context, ...(entry.meta || {}) } }),
    withContext: (ctx = {}) => ({
      logInfo: (msg, meta = {}) => logInfo(msg, { ...context, ...ctx, ...meta }),
      logWarn: (msg, meta = {}) => logWarn(msg, { ...context, ...ctx, ...meta }),
      logDebug: (msg, meta = {}) => logDebug(msg, { ...context, ...ctx, ...meta }),
      logError: (err, meta = {}) => logError(err, { ...context, ...ctx, ...meta }),
      sendRemoteLog: (entry) =>
        sendRemoteLog({ ...entry, meta: { ...context, ...ctx, ...(entry.meta || {}) } }),
    }),
  };

  return (
    <LoggingContext.Provider value={logger}>
      {children}
    </LoggingContext.Provider>
  );
};

LoggingProvider.displayName = 'LoggingProvider';

export const useLogger = () => useContext(LoggingContext);

// ===============================
// All-in-one Logger Object (Default Export)
// ===============================
const logger = {
  logInfo,
  logWarn,
  logDebug,
  logError,
  sendRemoteLog,
  createLogger,
  LoggingContext,
  LoggingProvider,
  useLogger,
};

export default logger;
