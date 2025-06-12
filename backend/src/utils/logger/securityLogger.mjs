// File: /backend/src/logger/securityLogger.mjs

import { logInfo, logError, logWarn } from '../logging/index.mjs';

/**
 * Logs a structured security event.
 * @param {string} eventType - A string identifier like 'auth.failure'
 * @param {object} details - Additional contextual metadata
 */
export function logSecurityEvent(eventType, details = {}) {
  try {
    const eventPayload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      ...details,
    };

    logInfo('[SecurityEvent]', eventPayload);
  } catch (err) {
    logError('[SecurityEvent] Logging failed', { original: details, error: err.message });
  }
}
