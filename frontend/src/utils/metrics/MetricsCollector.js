// ✅ FILE: /frontend/src/utils/metrics/MetricsCollector.js

/**
 * Collects and manages metrics for monitoring and analysis
 */
export class MetricsCollector {
    constructor(namespace) {
      this.namespace = namespace;
      this.metrics = {
        counters: {},
        latencies: [],
        gauges: {},
        timestamps: {}
      };
    }
  
    /**
     * Increment a counter metric
     * @param {string} metric - Metric name
     * @param {number} [value=1] - Value to increment by
     */
    incrementCounter(metric, value = 1) {
      const key = `${this.namespace}_${metric}`;
      this.metrics.counters[key] = (this.metrics.counters[key] || 0) + value;
      this.metrics.timestamps[key] = Date.now();
    }
  
    /**
     * Record a latency measurement
     * @param {string} metric - Metric name
     * @param {number} duration - Duration in milliseconds
     */
    recordLatency(metric, duration) {
      const key = `${this.namespace}_${metric}`;
      this.metrics.latencies.push({
        metric: key,
        duration,
        timestamp: Date.now()
      });
  
      // Keep only last 1000 measurements
      if (this.metrics.latencies.length > 1000) {
        this.metrics.latencies.shift();
      }
    }
  
    /**
     * Set a gauge value
     * @param {string} metric - Metric name
     * @param {number} value - Current value
     */
    setGauge(metric, value) {
      const key = `${this.namespace}_${metric}`;
      this.metrics.gauges[key] = value;
      this.metrics.timestamps[key] = Date.now();
    }
  
    /**
     * Get all collected metrics
     * @returns {Object} All metrics
     */
    getMetrics() {
      return {
        ...this.metrics,
        collectedAt: Date.now()
      };
    }
  
    /**
     * Reset all metrics
     */
    reset() {
      this.metrics = {
        counters: {},
        latencies: [],
        gauges: {},
        timestamps: {}
      };
    }
  }
  