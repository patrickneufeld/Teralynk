// ================================================
// ✅ FILE: /frontend/src/utils/telemetry.js
// Centralized Telemetry Utility with Full Lifecycle and Valid Exports
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from './logging';
import { MetricsCollector } from './metrics/MetricsCollector';

// =====================================
// 📊 Telemetry Configuration
// =====================================

export const TELEMETRY_CONFIG = {
  enabled: import.meta.env.VITE_ENABLE_TELEMETRY !== 'false',
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT || 'http://localhost:5001/api/telemetry',
  batchSize: 10,
  flushInterval: 5000,
  maxQueueSize: 100,
  retryAttempts: 3,
  traceIdPrefix: 'trace_',
};

// =====================================
// 📌 Telemetry State
// =====================================

let currentTraceId = null;
let currentSessionId = null;
let eventQueue = [];
let flushTimeout = null;
let metrics;

try {
  metrics = new MetricsCollector('telemetry');
} catch (err) {
  metrics = {
    incrementCounter: () => {},
    recordValue: () => {},
    getMetrics: () => ({}),
  };
  console.warn('⚠️ MetricsCollector not available, using fallback metrics handler.');
}

// =====================================
// 🔖 Event Types
// =====================================

export const TELEMETRY_EVENTS = Object.freeze({
  AUTH: 'auth',
  TOKEN: 'token',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  USER: 'user',
  SYSTEM: 'system',
  MFA: 'mfa',
});

// =====================================
// 🔁 Trace & Session ID Helpers
// =====================================

export function getTraceId() {
  if (!currentTraceId) {
    currentTraceId = `${TELEMETRY_CONFIG.traceIdPrefix}${Date.now()}-${uuidv4()}`;
  }
  return currentTraceId;
}

export function resetTraceId() {
  currentTraceId = `${TELEMETRY_CONFIG.traceIdPrefix}${Date.now()}-${uuidv4()}`;
  return currentTraceId;
}

export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = `session_${Date.now()}-${uuidv4()}`;
  }
  return currentSessionId;
}

// =====================================
// 🧩 Format Telemetry Event for Transport
// =====================================

export function formatTelemetryEvent(eventName, data = {}) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    traceId: getTraceId(),
    sessionId: getSessionId(),
    eventName,
    data: {
      ...data,
      url: typeof window !== 'undefined' ? window.location?.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      path: typeof window !== 'undefined' ? window.location?.pathname : '',
    },
  };
}

// =====================================
// 🚀 Emit Telemetry Event (Main)
// =====================================

export async function sendTelemetryEvent(eventName, data = {}) {
  if (!TELEMETRY_CONFIG.enabled || !eventName) return;

  const event = formatTelemetryEvent(eventName, data);

  try {
    eventQueue.push(event);
    metrics.incrementCounter('events_queued');

    if (eventQueue.length >= TELEMETRY_CONFIG.batchSize) {
      await flushEvents();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(flushEvents, TELEMETRY_CONFIG.flushInterval);
    }

    logInfo(`📡 Emitted telemetry: ${eventName}`, { id: event.id, traceId: event.traceId });
    return event;
  } catch (error) {
    logError('❌ Failed to emit telemetry event', { error, event });
    metrics.incrementCounter('emit_failures');
  }
}

// =====================================
// ✅ Alias Function
// =====================================

export async function emitTelemetry(eventName, data = {}) {
  return sendTelemetryEvent(eventName, data);
}

// =====================================
// 🔐 MFA Event Shortcut
// =====================================

export function emitMFAEvent(action, data = {}) {
  return sendTelemetryEvent(`mfa:${action}`, {
    ...data,
    traceId: getTraceId(),
    timestamp: new Date().toISOString(),
  });
}

// =====================================
// 💾 Flush Telemetry Queue
// =====================================

async function flushEvents() {
  if (!eventQueue.length) return;

  clearTimeout(flushTimeout);
  flushTimeout = null;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    const response = await fetch(TELEMETRY_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-ID': getTraceId(),
      },
      body: JSON.stringify({ events: eventsToSend }),
    });

    if (!response.ok) throw new Error(`Flush failed with status ${response.status}`);

    metrics.incrementCounter('flush_success');
    metrics.recordValue('flushed_events', eventsToSend.length);
    logInfo(`✅ Flushed ${eventsToSend.length} telemetry events`);
  } catch (error) {
    logError('❌ Telemetry flush error', { error });
    metrics.incrementCounter('flush_failures');
    eventQueue = [...eventsToSend, ...eventQueue].slice(0, TELEMETRY_CONFIG.maxQueueSize);
  }
}

// =====================================
// 📊 Telemetry Debug Snapshot
// =====================================

export function getTelemetryStatus() {
  return {
    enabled: TELEMETRY_CONFIG.enabled,
    queueSize: eventQueue.length,
    metrics: metrics.getMetrics(),
    currentTraceId,
    currentSessionId,
    config: TELEMETRY_CONFIG,
  };
}

// =====================================
// 🧹 Window Unload Flush
// =====================================

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0 && navigator.sendBeacon) {
      const payload = new Blob([JSON.stringify({ events: eventQueue })], {
        type: 'application/json',
      });
      navigator.sendBeacon(TELEMETRY_CONFIG.endpoint, payload);
    }
  });
}

// =====================================
// 📤 Default Export (Single Clean Export)
// =====================================

const telemetry = {
  TELEMETRY_CONFIG,
  TELEMETRY_EVENTS,
  getTraceId,
  resetTraceId,
  getSessionId,
  formatTelemetryEvent,
  sendTelemetryEvent,
  emitTelemetry,
  emitMFAEvent,
  getTelemetryStatus,
};

export default telemetry;
