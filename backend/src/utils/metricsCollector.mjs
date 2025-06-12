// /Users/patrick/Projects/Teralynk/backend/src/utils/metricsCollector.js

export class MetricsCollector {
    constructor() {
        // Initialize metrics collection properties
        this.metrics = {};
    }

    // Method to collect metrics
    collectMetric(name, value) {
        this.metrics[name] = {
            value,
            timestamp: new Date().toISOString()
        };
    }

    // Method to get collected metrics
    getMetrics() {
        return this.metrics;
    }

    // Method to clear metrics
    clearMetrics() {
        this.metrics = {};
    }

    // Add other metric collection methods as needed
}