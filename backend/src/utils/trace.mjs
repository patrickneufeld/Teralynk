// /backend/src/utils/trace.js

import { randomUUID } from 'crypto';

const TRACE_HEADER_KEY = 'x-trace-id';

/**
 * Returns a new secure UUID-based trace ID
 */
export function generateTraceId() {
  return `trace-${randomUUID()}`;
}

// Legacy alias for backwards compatibility
export const getTraceId = generateTraceId;

/**
 * Middleware to attach a trace ID to the request and response headers
 */
export function attachTraceId(req, res, next) {
  const traceId = req.headers[TRACE_HEADER_KEY] || generateTraceId();
  req.traceId = traceId;
  res.setHeader(TRACE_HEADER_KEY, traceId);
  next();
}

/**
 * Extracts trace ID from a request or generates a fallback
 */
export function getTraceIdFromRequest(req) {
  return req?.traceId || req?.headers?.[TRACE_HEADER_KEY] || generateTraceId();
}

/**
 * Wraps a log function with trace context
 */
export function withTrace(logFn, traceId) {
  return (message, data = {}) => {
    logFn(`[${traceId}] ${message}`, { traceId, ...data });
  };
}
