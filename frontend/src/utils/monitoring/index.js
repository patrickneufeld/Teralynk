// ================================================
// 📊 FILE: /frontend/src/utils/monitoring/index.js
// Performance and Metrics Collection Utilities
// ================================================

class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.startTime = performance.now();
  }

  end() {
    const duration = performance.now() - this.startTime;
    return duration;
  }
}

class MetricsCollector {
  constructor(context) {
    this.context = context;
    this.metrics = {
      timers: {},
      counters: {},
      errors: {},
      successes: {}
    };
  }

  startTimer(operation) {
    return new PerformanceTimer(operation);
  }

  recordSuccess(operation) {
    this.metrics.successes[operation] = (this.metrics.successes[operation] || 0) + 1;
  }

  recordError(operation) {
    this.metrics.errors[operation] = (this.metrics.errors[operation] || 0) + 1;
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      context: this.context
    };
  }

  flush() {
    // In production, you might want to send metrics to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Metrics][${this.context}]`, this.getMetrics());
    }
    this.metrics = {
      timers: {},
      counters: {},
      errors: {},
      successes: {}
    };
  }
}

export const performanceMonitor = {
  startTimer: (operation) => new PerformanceTimer(operation),
  
  trackOperation: async (operation, fn) => {
    const timer = new PerformanceTimer(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      timer.end();
    }
  }
};

export const createMetricsCollector = (context) => new MetricsCollector(context);

export default {
  performanceMonitor,
  createMetricsCollector
};
