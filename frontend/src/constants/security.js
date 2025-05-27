// File: /frontend/src/constants/security.js

export const SECURITY_LEVELS = Object.freeze({
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  });
  
  export const DEFAULT_SECURITY_LEVEL = SECURITY_LEVELS.MEDIUM;
  
  export const DEVICE_TRUST_THRESHOLDS = {
    fingerprintMatch: 0.9,
    tokenAgeLimitMs: 30 * 60 * 1000, // 30 min
  };
  