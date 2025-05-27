// ✅ FILE: /backend/src/monitoring/telemetry.js

/**
 * Telemetry module for tracking AI events, anomalies, learning outcomes, and patch behavior.
 * Supports real-time and batch ingestion pipelines.
 */

const TELEMETRY_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const telemetryBuffer = [];

class TelemetryEngine {
  constructor(source = 'default') {
    this.source = source;
  }

  /**
   * Emit a telemetry event
   * @param {string} eventType
   * @param {object} payload
   * @param {string} level
   */
  emit(eventType, payload = {}, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const log = {
      eventType,
      level: TELEMETRY_LEVELS.includes(level) ? level : 'INFO',
      payload,
      timestamp,
      source: this.source,
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Telemetry][${log.level}] ${log.eventType}`, log);
    }

    this._buffer(log);
  }

  /**
   * Buffer entry with batch flushing
   * @param {object} entry
   */
  _buffer(entry) {
    telemetryBuffer.push(entry);
    if (telemetryBuffer.length >= 10) {
      this.flush();
    }
  }

  /**
   * Flush all buffered entries
   */
  flush() {
    if (telemetryBuffer.length === 0) return;

    const batch = telemetryBuffer.splice(0, telemetryBuffer.length);
    console.log(`[Telemetry] Flushing ${batch.length} entries...`);

    // Replace this with Kafka, Kinesis, DB, etc.
    setTimeout(() => {
      console.log(`[Telemetry] Batch sent at ${new Date().toISOString()}`);
    }, 100);
  }

  /**
   * Manually trigger flush
   * @param {string} reason
   */
  forceFlush(reason = 'manual') {
    console.log(`[Telemetry] Force flush triggered: ${reason}`);
    this.flush();
  }
}

// ✅ Shared singleton instance
const sharedEngine = new TelemetryEngine('shared');

/**
 * ✅ Legacy emit API
 */
export function emitTelemetry(eventType, payload = {}, level = 'INFO') {
  sharedEngine.emit(eventType, payload, level);
}

/**
 * ✅ Legacy flush API
 */
export function flushTelemetry() {
  sharedEngine.flush();
}

/**
 * ✅ Structured security telemetry emitter
 */
export function recordSecurityTelemetry(eventType, payload = {}) {
  const enriched = {
    ...payload,
    category: 'security',
  };
  sharedEngine.emit(eventType, enriched, 'WARN');
}

/**
 * ✅ Structured general event telemetry emitter (used in aiPlatformIntegrationManager.js)
 */
export function recordEventTelemetry(eventType, payload = {}, level = 'INFO') {
  sharedEngine.emit(eventType, payload, level);
}

/**
 * ✅ Optional batch ingestion placeholder
 */
export function recordBatchTelemetry(batch = []) {
  for (const entry of batch) {
    const { eventType, payload, level = 'INFO' } = entry;
    sharedEngine.emit(eventType, payload, level);
  }
}

// ✅ Export the core engine for advanced use
export { TelemetryEngine };
