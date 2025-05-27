// /Users/patrick/Projects/Teralynk/backend/src/utils/telemetryUtils.js

/**
 * Telemetry Utilities
 * Handles trace propagation, event formatting, and integration with remote sinks.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generates or propagates a secure trace ID.
 * Prefixes all UUIDs with 'trace-' for consistent backend filtering.
 * @param {string} [incomingTraceId] - Optional externally provided trace ID.
 * @returns {string} - A valid trace ID.
 */
export function getTraceId(incomingTraceId) {
  return typeof incomingTraceId === 'string' && incomingTraceId.trim() !== ''
    ? incomingTraceId
    : `trace-${uuidv4()}`;
}

/**
 * Formats telemetry event data for structured logging.
 * Ensures consistent payload shape and ISO 8601 timestamps.
 * @param {string} eventType - A short label for the event (e.g., "UserLogin", "FileDownload").
 * @param {object} data - Optional payload to include with the event.
 * @param {string} [traceId] - Optional traceId to maintain correlation.
 * @returns {object} - Structured telemetry event.
 */
export function formatTelemetryEvent(eventType, data = {}, traceId = null) {
  return {
    eventType,
    timestamp: new Date().toISOString(),
    traceId: getTraceId(traceId),
    payload: data,
  };
}

/**
 * Sends a telemetry event to a remote sink or logs it locally.
 * Can be extended to support async dispatch, bulk queues, etc.
 * @param {object} event - A telemetry event formatted via formatTelemetryEvent.
 */
export function sendTelemetry(event) {
  try {
    if (!event || typeof event !== 'object' || !event.eventType) {
      console.warn('[Telemetry] Skipped malformed event:', event);
      return;
    }

    // Placeholder for integration with Loki, CloudWatch, or custom sinks
    console.log(`[Telemetry] ${event.eventType}`, JSON.stringify(event, null, 2));

    // Example future sink: await axios.post('/telemetry', event);
  } catch (error) {
    console.error('[Telemetry] Failed to send event:', error);
  }
}

/**
 * Legacy alias for backward compatibility across systems.
 * @type {Function}
 */
export const emitTelemetry = sendTelemetry;
