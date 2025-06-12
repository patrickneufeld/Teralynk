// ✅ FILE: /frontend/src/constants/security.js

/**
 * Security levels for role-based access, audit risk, and system criticality
 */
export const SECURITY_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

/**
 * Default fallback level if none is specified
 */
export const DEFAULT_SECURITY_LEVEL = SECURITY_LEVELS.MEDIUM;

/**
 * Trust thresholds for device and session validation
 */
export const DEVICE_TRUST_THRESHOLDS = {
  fingerprintMatch: 0.9,
  tokenAgeLimitMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * Utility function to validate if a timestamp is within valid bounds
 * @param {number|string} timestamp
 * @returns {boolean}
 */
export function isValidTimestamp(timestamp) {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  return (
    !isNaN(ts) &&
    ts > 0 &&
    ts < Date.now() + 1000 * 60 * 60 * 24 * 365 // within a year
  );
}

/**
 * Secure string generator using browser crypto
 * @param {number} length
 * @returns {string}
 */
export function generateSecureString(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
