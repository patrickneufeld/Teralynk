// ================================================
// ✅ [Validated & Hardened] FILE: /frontend/src/utils/telemetry.js
// Centralized Telemetry Utility with Full Exports
// Version: 2.2.1
// ================================================

import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError } from './logging';
import { MetricsCollector } from './metrics/MetricsCollector';

export const TELEMETRY_CONFIG = {
  enabled: import.meta.env.VITE_ENABLE_TELEMETRY !== 'false',
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT || 'http://localhost:5001/api/telemetry',
  batchSize: 10,
  flushInterval: 5000,
  maxQueueSize: 100,
  retryAttempts: 3,
  traceIdPrefix: 'trace_',
};

let currentTraceId = null;
let currentSessionId = null;
let eventQueue = [];
let flushTimeout = null;

// Initialize metrics with fallback
let metrics;
try {
  metrics = new MetricsCollector('telemetry');
} catch (err) {
  logError('Failed to initialize metrics collector', err);
  // Create a fallback metrics object with no-op methods
  metrics = {
    increment: () => {},
    gauge: () => {},
    startTimer: () => () => 0,
    getAllMetrics: () => ({}),
    reset: () => {}
  };
}

export function generateTraceId() {
  currentTraceId = `${TELEMETRY_CONFIG.traceIdPrefix}${uuidv4()}`;
  return currentTraceId;
}

export function getTraceId() {
  return currentTraceId || generateTraceId();
}

export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = uuidv4();
  }
  return currentSessionId;
}

export function emitTelemetry(event, payload = {}) {
  if (!TELEMETRY_CONFIG.enabled) return;
  
  // Add safety check for metrics
  if (!metrics || typeof metrics.increment !== 'function') {
    console.warn('Metrics collector not properly initialized');
    return;
  }
  
  const traceId = getTraceId();
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();

  const eventData = {
    traceId,
    sessionId,
    event,
    timestamp,
    ...payload,
  };

  eventQueue.push(eventData);
  
  try {
    metrics.increment(`telemetry.event.${event}`);
  } catch (err) {
    console.warn('Failed to increment metric:', err.message);
  }

  if (eventQueue.length >= TELEMETRY_CONFIG.batchSize) {
    flushTelemetryQueue();
  } else if (!flushTimeout) {
    flushTimeout = setTimeout(flushTelemetryQueue, TELEMETRY_CONFIG.flushInterval);
  }
}

export async function flushTelemetryQueue() {
  if (!eventQueue.length) return;
  const queueToSend = [...eventQueue];
  eventQueue = [];
  clearTimeout(flushTimeout);
  flushTimeout = null;

  try {
    // Add error handling for telemetry endpoint
    if (!TELEMETRY_CONFIG.endpoint || !TELEMETRY_CONFIG.enabled) {
      console.log('Telemetry disabled or endpoint not configured');
      return;
    }
    
    // Use a more robust fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(TELEMETRY_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queueToSend),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`Telemetry send received status ${res.status}`);
      return; // Don't re-add to queue on 4xx errors
    }
    
    logInfo(`📤 Sent ${queueToSend.length} telemetry events`);
  } catch (err) {
    // Don't re-add to queue if it was an abort or network error
    if (err.name === 'AbortError') {
      console.warn('Telemetry request timed out');
    } else {
      console.warn('Telemetry send failed:', err.message);
      // Only add back to queue if it's not too large
      if (eventQueue.length + queueToSend.length <= TELEMETRY_CONFIG.maxQueueSize) {
        eventQueue.unshift(...queueToSend.slice(0, 5)); // Only keep the 5 most recent events
      }
    }
  }
}

export { emitTelemetry as sendTelemetryEvent }
