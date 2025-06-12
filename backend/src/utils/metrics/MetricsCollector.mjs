/**
 * Metrics Collector
 * Enterprise-grade metrics collection and monitoring
 */

import { logInfo, logError } from '../logging/logging.mjs';

class MetricsCollector {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.options = {
            labels: options.labels || [],
            buckets: options.buckets || [0.1, 0.5, 1, 2, 5],
            trackMemory: options.trackMemory || false,
            trackCPU: options.trackCPU || false,
            flushInterval: options.flushInterval || 60000 // 1 minute
        };

        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map(),
            events: []
        };

        this.startTime = Date.now();
        this.initialized = false;
        this.flushInterval = null;
    }

    /**
     * Initializes the metrics collector
     */
    async initialize() {
        if (this.initialized) return;

        if (this.options.trackMemory || this.options.trackCPU) {
            this.startResourceMonitoring();
        }

        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.options.flushInterval);

        this.initialized = true;
        logInfo('Metrics collector initialized', {
            service: this.serviceName,
            options: this.options
        });
    }

    /**
     * Increments a counter metric
     * @param {string} name 
     * @param {number} value 
     * @param {Object} labels 
     */
    incrementCounter(name, value = 1, labels = {}) {
        const key = this.getMetricKey(name, labels);
        const current = this.metrics.counters.get(key) || 0;
        this.metrics.counters.set(key, current + value);
    }

    /**
     * Sets a gauge metric
     * @param {string} name 
     * @param {number} value 
     * @param {Object} labels 
     */
    gaugeMetric(name, value, labels = {}) {
        const key = this.getMetricKey(name, labels);
        this.metrics.gauges.set(key, value);
    }

    /**
     * Records a latency/histogram metric
     * @param {string} name 
     * @param {number} value 
     * @param {Object} labels 
     */
    recordLatency(name, value, labels = {}) {
        const key = this.getMetricKey(name, labels);
        if (!this.metrics.histograms.has(key)) {
            this.metrics.histograms.set(key, []);
        }
        this.metrics.histograms.get(key).push(value);
    }

    /**
     * Records an event with metadata
     * @param {string} name 
     * @param {Object} metadata 
     */
    recordEvent(name, metadata = {}) {
        this.metrics.events.push({
            name,
            timestamp: Date.now(),
            ...metadata
        });
    }

    /**
     * Gets the current error rate
     * @returns {number}
     */
    getErrorRate() {
        const errors = this.metrics.counters.get('errors') || 0;
        const total = this.metrics.counters.get('requests') || 1;
        return errors / total;
    }

    /**
     * Gets all current metrics
     * @returns {Object}
     */
    getMetrics() {
        return {
            timestamp: Date.now(),
            uptime: Date.now() - this.startTime,
            counters: Object.fromEntries(this.metrics.counters),
            gauges: Object.fromEntries(this.metrics.gauges),
            histograms: this.summarizeHistograms(),
            events: this.metrics.events.slice(-100), // Last 100 events
            resource_usage: this.getResourceMetrics()
        };
    }

    /**
     * Flushes metrics to storage/monitoring system
     * Override this method to implement custom storage
     */
    async flush() {
        try {
            const metrics = this.getMetrics();
            
            // Log metrics summary
            logInfo('Metrics flush', {
                service: this.serviceName,
                timestamp: metrics.timestamp,
                counters: metrics.counters,
                gauges: metrics.gauges
            });

            // Clear events and histograms
            this.metrics.events = [];
            this.metrics.histograms.clear();

            return metrics;
        } catch (error) {
            logError('Metrics flush failed', error);
        }
    }

    /**
     * Shuts down the metrics collector
     */
    async shutdown() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        await this.flush();
        this.initialized = false;
    }

    // Private methods

    /**
     * Generates a unique key for a metric
     * @private
     */
    getMetricKey(name, labels = {}) {
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        return labelStr ? `${name}{${labelStr}}` : name;
    }

    /**
     * Summarizes histogram data
     * @private
     */
    summarizeHistograms() {
        const summary = {};
        for (const [name, values] of this.metrics.histograms.entries()) {
            if (values.length === 0) continue;

            const sorted = values.sort((a, b) => a - b);
            summary[name] = {
                count: values.length,
                min: sorted[0],
                max: sorted[sorted.length - 1],
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                p50: this.percentile(sorted, 50),
                p90: this.percentile(sorted, 90),
                p99: this.percentile(sorted, 99)
            };
        }
        return summary;
    }

    /**
     * Calculates percentile value
     * @private
     */
    percentile(sortedValues, p) {
        if (sortedValues.length === 0) return 0;
        const index = Math.ceil((p / 100) * sortedValues.length) - 1;
        return sortedValues[index];
    }

    /**
     * Gets resource usage metrics
     * @private
     */
    getResourceMetrics() {
        const metrics = {};
        
        if (this.options.trackMemory) {
            const memory = process.memoryUsage();
            metrics.memory = {
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                external: memory.external,
                rss: memory.rss
            };
        }

        if (this.options.trackCPU) {
            metrics.cpu = process.cpuUsage();
        }

        return metrics;
    }

    /**
     * Starts monitoring system resources
     * @private
     */
    startResourceMonitoring() {
        setInterval(() => {
            const metrics = this.getResourceMetrics();
            
            if (metrics.memory) {
                this.gaugeMetric('memory_heap_used', metrics.memory.heapUsed);
                this.gaugeMetric('memory_heap_total', metrics.memory.heapTotal);
                this.gaugeMetric('memory_external', metrics.memory.external);
                this.gaugeMetric('memory_rss', metrics.memory.rss);
            }

            if (metrics.cpu) {
                this.gaugeMetric('cpu_user', metrics.cpu.user);
                this.gaugeMetric('cpu_system', metrics.cpu.system);
            }
        }, 5000); // Every 5 seconds
    }
}

export { MetricsCollector };
export default MetricsCollector;
