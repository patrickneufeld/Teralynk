// /frontend/src/utils/tracing.js

import { v4 as uuidv4 } from 'uuid';
import { logDebug, logError } from './logger.js';

const TRACE_STORAGE_KEY = 'teralynk.trace.id';

/**
 * Generate a new trace ID (UUIDv4-based)
 */
export function generateTraceId(prefix = 'trc') {
  try {
    const id = `${prefix}-${uuidv4()}`;
    return id;
  } catch (err) {
    logError('tracing.generateTraceId.failure', { error: err.message });
    return `${prefix}-${Math.random().toString(36).substring(2, 12)}`;
  }
}

/**
 * Get current trace ID from sessionStorage or create a new one
 */
export function getOrCreateSessionTraceId() {
  let traceId = sessionStorage.getItem(TRACE_STORAGE_KEY);
  if (!traceId) {
    traceId = generateTraceId('sess');
    sessionStorage.setItem(TRACE_STORAGE_KEY, traceId);
    logDebug('tracing.newSessionTraceId.created', { traceId });
  }
  return traceId;
}

/**
 * Manually override the session trace ID (used in impersonation or debug)
 */
export function setSessionTraceId(traceId) {
  if (!traceId || typeof traceId !== 'string') return;
  sessionStorage.setItem(TRACE_STORAGE_KEY, traceId);
  logDebug('tracing.setSessionTraceId', { traceId });
}

/**
 * Inject trace ID into headers for API calls
 */
export function injectTraceHeaders(headers = {}, options = {}) {
  const traceId = options.traceId || getOrCreateSessionTraceId();
  return {
    ...headers,
    'x-trace-id': traceId,
  };
}

/**
 * Attach trace ID to a telemetry payload
 */
export function attachTraceToPayload(payload = {}, options = {}) {
  const traceId = options.traceId || getOrCreateSessionTraceId();
  return {
    ...payload,
    traceId,
    traceSource: options.source || 'frontend',
    timestamp: new Date().toISOString(),
  };
}
