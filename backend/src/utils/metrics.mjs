// /Users/patrick/Projects/Teralynk/backend/src/utils/metrics.js

export class Metrics {
    constructor() {
        this.metrics = new Map();
    }

    // Record a metric
    record(name, value, tags = {}) {
        const metric = {
            value,
            timestamp: Date.now(),
            tags
        };

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(metric);
    }

    // Get metrics by name
    get(name) {
        return this.metrics.get(name) || [];
    }

    // Get all metrics
    getAll() {
        return Object.fromEntries(this.metrics);
    }

    // Clear metrics
    clear() {
        this.metrics.clear();
    }

    // Calculate average for a metric
    getAverage(name) {
        const metrics = this.get(name);
        if (metrics.length === 0) return 0;
        
        const sum = metrics.reduce((acc, curr) => acc + curr.value, 0);
        return sum / metrics.length;
    }
}