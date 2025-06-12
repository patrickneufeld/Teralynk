// ✅ FILE: /backend/src/utils/telemetryUtils.mjs

import { v4 as uuidv4 } from 'uuid';
import os from 'os';

/**
 * ✅ Generate a trace ID for telemetry
 * @param {string} prefix
 * @returns {string}
 */
export function generateTraceId(prefix = 'trace') {
  return `${prefix}_${Date.now()}_${uuidv4()}`;
}

/**
 * ✅ Format telemetry data into a standard event structure
 * @param {string} eventName
 * @param {object} data
 * @returns {object}
 */
export function formatTelemetryEvent(eventName, data = {}) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    traceId: generateTraceId(),
    hostname: os.hostname(),
    eventName,
    data
  };
}

/**
 * ✅ Emit telemetry by formatting and logging the event
 * NOTE: This is for backend internal use only. Do not import into frontend!
 * @param {string} eventName
 * @param {object} data
 * @returns {object}
 */
export function emitTelemetry(eventName, data = {}) {
  const event = formatTelemetryEvent(eventName, data);
  console.log(`[📡 TELEMETRY] ${event.eventName}`, event);
  return event;
}

/**
 * ✅ Validate a telemetry POST payload from frontend
 * @param {object} payload
 * @returns {boolean}
 */
export function validateTelemetryPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (!Array.isArray(payload.events)) return false;

  return payload.events.every(event =>
    typeof event.eventName === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.id === 'string'
  );
}
