// ================================================
// ✅ FILE: /frontend/src/utils/metrics/MetricsCollector.js
// Metrics Collection Utility with Fallback Support
// ================================================

import { logInfo, logError } from '../logging';

/**
 * Simple metrics collection utility with fallback support
 */
export class MetricsCollector {
  /**
   * Creates a new metrics collector
   * @param {string} namespace - Namespace for the metrics
   */
  constructor(namespace = 'app') {
    this.namespace = namespace;
    this.enabled = true;
    this.counters = new Map();
    this.gauges = new Map();
    this.timers = new Map();
    
    // Track initialization
    this.initialized = true;
    logInfo(`Metrics collector initialized for namespace: ${namespace}`);
  }

  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {Object} tags - Optional tags
   */
  increment(name, tags = {}) {
    if (!this.enabled) return;
    
    try {
      const key = this._formatKey(name, tags);
      const current = this.counters.get(key) || 0;
      this.counters.set(key, current + 1);
      
      if (import.meta.env.DEV) {
        logInfo(`Metric incremented: ${key}`, { value: current + 1 });
      }
    } catch (err) {
      logError('Failed to increment metric', { name, tags, error: err.message });
    }
  }

  /**
   * Set a gauge value
   * @param {string} name - Gauge name
   * @param {number} value - Gauge value
   * @param {Object} tags - Optional tags
   */
  gauge(name, value, tags = {}) {
    if (!this.enabled) return;
    
    try {
      const key = this._formatKey(name, tags);
      this.gauges.set(key, value);
      
      if (import.meta.env.DEV) {
        logInfo(`Gauge set: ${key}`, { value });
      }
    } catch (err) {
      logError('Failed to set gauge', { name, value, tags, error: err.message });
    }
  }

  /**
   * Start a timer
   * @param {string} name - Timer name
   * @param {Object} tags - Optional tags
   * @returns {Function} Stop function that returns the elapsed time
   */
  startTimer(name, tags = {}) {
    if (!this.enabled) return () => 0;
    
    const start = performance.now();
    const key = this._formatKey(name, tags);
    
    return () => {
      const elapsed = performance.now() - start;
      this.timers.set(key, elapsed);
      
      if (import.meta.env.DEV) {
        logInfo(`Timer completed: ${key}`, { elapsed });
      }
      
      return elapsed;
    };
  }

  /**
   * Format a metric key with tags
   * @private
   */
  _formatKey(name, tags = {}) {
    let key = `${this.namespace}.${name}`;
    
    if (Object.keys(tags).length > 0) {
      const tagStr = Object.entries(tags)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      key += `;${tagStr}`;
    }
    
    return key;
  }

  /**
   * Get all collected metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      timers: Object.fromEntries(this.timers)
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.timers.clear();
  }

  /**
   * Enable or disable metrics collection
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
  }
}
