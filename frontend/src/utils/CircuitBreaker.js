// ✅ FILE: /frontend/src/utils/CircuitBreaker.js

/**
 * Circuit breaker pattern implementation for handling service failures
 */
export class CircuitBreaker {
    constructor(failureThreshold = 5, resetTimeout = 60000) {
      this.failureThreshold = failureThreshold;
      this.resetTimeout = resetTimeout;
      this.failures = 0;
      this.lastFailureTime = null;
      this.state = 'CLOSED';
      this.metrics = {
        totalFailures: 0,
        consecutiveFailures: 0,
        lastStateChange: Date.now(),
        totalRequests: 0
      };
    }
  
    /**
     * Check if the circuit is available
     * @returns {boolean} Whether the circuit is available
     */
    isAvailable() {
      this.metrics.totalRequests++;
      
      if (this.state === 'OPEN') {
        const now = Date.now();
        if (this.lastFailureTime && (now - this.lastFailureTime) > this.resetTimeout) {
          this.state = 'HALF_OPEN';
          this.metrics.lastStateChange = now;
          return true;
        }
        return false;
      }
      return true;
    }
  
    /**
     * Record a successful operation
     */
    recordSuccess() {
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.metrics.lastStateChange = Date.now();
      }
      this.failures = 0;
      this.metrics.consecutiveFailures = 0;
    }
  
    /**
     * Record a failed operation
     */
    recordFailure() {
      this.failures++;
      this.metrics.totalFailures++;
      this.metrics.consecutiveFailures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.metrics.lastStateChange = Date.now();
      }
    }
  
    /**
     * Get current circuit breaker status
     * @returns {Object} Current status
     */
    getStatus() {
      return {
        state: this.state,
        failures: this.failures,
        metrics: this.metrics,
        lastFailure: this.lastFailureTime,
        threshold: this.failureThreshold,
        resetTimeout: this.resetTimeout
      };
    }
  }
  