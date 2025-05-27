import React, { createContext, useContext } from "react";

// Utility: Detect dev mode
const isDev = import.meta?.env?.MODE === "development";

/**
 * Core structured loggers with context and meta support
 */
export const logInfo = (message, meta = {}) => {
  try {
    console.info(`[INFO] ${message}`, meta);
  } catch (e) {
    console.log(`[INFO] ${message}`);
  }
};

export const logWarn = (message, meta = {}) => {
  try {
    console.warn(`[WARN] ${message}`, meta);
  } catch (e) {
    console.log(`[WARN] ${message}`);
  }
};

export const logDebug = (message, meta = {}) => {
  if (isDev) {
    try {
      console.debug(`[DEBUG] ${message}`, meta);
    } catch (e) {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

export const logError = (error, meta = {}) => {
  try {
    const msg = error?.message || error;
    const stack = error?.stack || null;
    console.error(`[ERROR] ${msg}`, { ...(stack && { stack }), ...meta });
  } catch (e) {
    console.log(`[ERROR] ${error?.message || error}`);
  }
};

/**
 * Remote logger: Optional integration with backend or third-party
 */
export const sendRemoteLog = async ({ level, message, meta = {} }) => {
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, meta }),
    });
  } catch (err) {
    if (isDev) {
      console.warn("⚠️ Remote log failed:", err.message);
    }
  }
};

/**
 * LoggingContext: React context with scoped logger helpers
 */
const LoggingContext = createContext({
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
    sendRemoteLog: (entry) =>
      sendRemoteLog({ ...entry, meta: { ...ctx, ...(entry.meta || {}) } }),
  }),
});

/**
 * LoggingProvider — Wrap any component tree to inject contextual metadata
 */
export const LoggingProvider = ({ children, context = {} }) => {
  const logger = {
    logInfo: (msg, meta = {}) => logInfo(msg, { ...context, ...meta }),
    logWarn: (msg, meta = {}) => logWarn(msg, { ...context, ...meta }),
    logDebug: (msg, meta = {}) => logDebug(msg, { ...context, ...meta }),
    logError: (err, meta = {}) => logError(err, { ...context, ...meta }),
    sendRemoteLog: (entry) =>
      sendRemoteLog({ ...entry, meta: { ...context, ...(entry.meta || {}) } }),
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

LoggingProvider.displayName = "LoggingProvider";

/**
 * Hook to use logging in React components
 */
export const useLogger = () => useContext(LoggingContext);
