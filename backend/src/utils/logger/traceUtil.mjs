// File: /backend/src/utils/logger/traceUtil.mjs

import crypto from 'crypto';

/**
 * ✅ Generates a trace ID for correlating logs and events
 * @returns {string} A unique trace ID
 */
export function generateTraceId() {
  try {
    // Use crypto.randomUUID if available (Node 15.6+)
    return typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');
  } catch (err) {
    console.error('[Trace] ❌ Failed to generate trace ID:', err.message);
    return `trace-${Date.now()}`;
  }
}
