// File: /frontend/src/utils/telemetry.js

import { logInfo, logError } from './logging';
import { MetricsCollector } from './metrics/MetricsCollector';

// Initialize metrics collector for telemetry
const metrics = new MetricsCollector('telemetry');

// Telemetry state management
let currentTraceId = null;
let currentSessionId = null;

// Telemetry event types
const TELEMETRY_EVENTS = {
  AUTH: 'auth',
  TOKEN: 'token',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  USER: 'user',
  SYSTEM: 'system',
  MFA: 'mfa'
};

// Configuration
const TELEMETRY_CONFIG = {
  enabled: import.meta.env.VITE_ENABLE_TELEMETRY !== 'false',
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT || '/api/telemetry',
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  retryAttempts: 3,
  maxQueueSize: 100,
  traceIdPrefix: 'tr_'
};

// Queue for batching telemetry events
let eventQueue = [];
let flushTimeout = null;

/**
 * Generate or retrieve the current trace ID
 * @returns {string} Trace ID
 */
export const getTraceId = () => {
  if (!currentTraceId) {
    currentTraceId = `${TELEMETRY_CONFIG.traceIdPrefix}${Date.now()}-${crypto.randomUUID()}`;
  }
  return currentTraceId;
};

/**
 * Reset the current trace ID
 * @returns {string} New trace ID
 */
export const resetTraceId = () => {
  currentTraceId = `${TELEMETRY_CONFIG.traceIdPrefix}${Date.now()}-${crypto.randomUUID()}`;
  return currentTraceId;
};

/**
 * Get or generate session ID
 * @returns {string} Session ID
 */
export const getSessionId = () => {
  if (!currentSessionId) {
    currentSessionId = `session_${Date.now()}-${crypto.randomUUID()}`;
  }
  return currentSessionId;
};

/**
 * Emit a telemetry event
 * @param {string} eventName - Name of the event
 * @param {Object} data - Event data
 * @returns {Promise<void>}
 */
export const emitTelemetry = async (eventName, data = {}) => {
  if (!TELEMETRY_CONFIG.enabled) return;

  try {
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      traceId: getTraceId(),
      sessionId: getSessionId(),
      eventName,
      data: {
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent,
        path: window.location.pathname
      }
    };

    eventQueue.push(event);
    metrics.incrementCounter('events_queued');

    if (!flushTimeout) {
      flushTimeout = setTimeout(flushEvents, TELEMETRY_CONFIG.flushInterval);
    }

    if (eventQueue.length >= TELEMETRY_CONFIG.batchSize) {
      await flushEvents();
    }

    logInfo(`Telemetry event emitted: ${eventName}`, { eventId: event.id, traceId: event.traceId });
    return event;
  } catch (error) {
    logError('Failed to emit telemetry', { error, eventName });
    metrics.incrementCounter('emit_failures');
  }
};

/**
 * Flush queued events to the telemetry endpoint
 * @returns {Promise<void>}
 */
async function flushEvents() {
  if (!eventQueue.length) return;

  clearTimeout(flushTimeout);
  flushTimeout = null;

  const events = [...eventQueue];
  eventQueue = [];

  try {
    const response = await fetch(TELEMETRY_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-ID': getTraceId()
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    metrics.incrementCounter('successful_flushes');
    metrics.recordValue('flushed_events', events.length);
  } catch (error) {
    logError('Failed to flush telemetry events', { error, traceId: getTraceId() });
    metrics.incrementCounter('flush_failures');
    
    eventQueue = [...events, ...eventQueue].slice(0, TELEMETRY_CONFIG.maxQueueSize);
  }
}

/**
 * Get telemetry system status
 * @returns {Object} System status
 */
export const getTelemetryStatus = () => ({
  enabled: TELEMETRY_CONFIG.enabled,
  queueSize: eventQueue.length,
  metrics: metrics.getMetrics(),
  config: TELEMETRY_CONFIG,
  currentTraceId: currentTraceId,
  currentSessionId: currentSessionId
});

// MFA-specific telemetry functions
export const emitMFAEvent = (action, data = {}) => {
  return emitTelemetry(`mfa_${action}`, {
    ...data,
    traceId: getTraceId(),
    timestamp: new Date().toISOString()
  });
};

// Ensure events are flushed before page unload
window.addEventListener('beforeunload', () => {
  if (eventQueue.length) {
    flushEvents();
  }
});

// Export everything needed by other modules
export default {
  emitTelemetry,
  emitMFAEvent,
  getTraceId,
  resetTraceId,
  getSessionId,
  getTelemetryStatus,
  TELEMETRY_EVENTS
};
