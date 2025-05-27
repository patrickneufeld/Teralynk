// ✅ FILE: /backend/src/monitoring/metricsAggregator.js

import os from 'os';
import { emitTelemetry } from './telemetry.mjs';
import { getTraceId } from '../utils/telemetryUtils.mjs';

export class MetricsAggregator {
  constructor() {
    this.metricStore = new Map();
    this.MAX_ENTRIES = 10_000;
  }

  /**
   * Record a metric with a name, value, and optional tags.
   */
  recordMetric(name, value, tags = {}) {
    if (!this.metricStore.has(name)) {
      this.metricStore.set(name, []);
    }

    const entry = {
      timestamp: Date.now(),
      value,
      tags,
    };

    const entries = this.metricStore.get(name);
    entries.push(entry);

    if (entries.length > this.MAX_ENTRIES) {
      this.metricStore.set(name, entries.slice(-this.MAX_ENTRIES));
    }
  }

  /**
   * Summarize a metric over a window of time.
   */
  getMetricSummary(name, windowMs = 300_000) {
    const now = Date.now();
    const entries = (this.metricStore.get(name) || []).filter(
      (entry) => now - entry.timestamp <= windowMs
    );

    if (entries.length === 0) return null;

    const values = entries.map((e) => e.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      count: values.length,
      average,
      max,
      min,
      last: values.at(-1),
    };
  }

  /**
   * Flush system and custom metrics via telemetry.
   */
  flushSystemMetrics() {
    const traceId = getTraceId();
    const timestamp = new Date().toISOString();

    // System telemetry
    const systemMetrics = {
      traceId,
      eventType: 'system_metrics',
      timestamp,
      source: 'MetricsAggregator',
      cpuLoad: os.loadavg()[0],
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };
    emitTelemetry(systemMetrics.eventType, systemMetrics, 'INFO');

    // Custom metric telemetry
    for (const [name] of this.metricStore.entries()) {
      const summary = this.getMetricSummary(name);
      if (summary) {
        const payload = {
          traceId,
          eventType: 'metric_flush',
          timestamp,
          metric: name,
          ...summary,
        };
        emitTelemetry(payload.eventType, payload, 'INFO');
      }
    }
  }
}
