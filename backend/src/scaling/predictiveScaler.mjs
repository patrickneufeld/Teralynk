// ✅ FILE: /backend/src/scaling/predictiveScaler.js

/**
 * PredictiveScaler
 * Simulates dynamic scaling logic based on telemetry, latency, and usage trends.
 * Designed for future integration with cloud autoscalers (e.g., K8s HPA, AWS ASG).
 */

export class PredictiveScaler {
  constructor(config = {}) {
    this.minNodes = config.minNodes || 2;
    this.maxNodes = config.maxNodes || 50;
    this.scaleUpThreshold = config.scaleUpThreshold || 0.75;
    this.scaleDownThreshold = config.scaleDownThreshold || 0.25;
    this.currentNodes = config.currentNodes || this.minNodes;
  }

  /**
   * Evaluate telemetry and determine scaling action
   * @param {object} telemetry - { cpuLoad, requestRate, errorRate }
   * @returns {object} result { action: 'scale_up' | 'scale_down' | 'hold', targetNodes }
   */
  evaluate(telemetry = {}) {
    const { cpuLoad = 0.0, requestRate = 0, errorRate = 0.0 } = telemetry;

    let action = 'hold';

    if (cpuLoad > this.scaleUpThreshold || requestRate > 1000) {
      if (this.currentNodes < this.maxNodes) {
        this.currentNodes += 1;
        action = 'scale_up';
      }
    } else if (cpuLoad < this.scaleDownThreshold && requestRate < 200 && errorRate < 0.05) {
      if (this.currentNodes > this.minNodes) {
        this.currentNodes -= 1;
        action = 'scale_down';
      }
    }

    return {
      action,
      targetNodes: this.currentNodes,
    };
  }

  /**
   * Forcefully set node count (useful for reset/testing)
   */
  setNodeCount(count) {
    this.currentNodes = Math.max(this.minNodes, Math.min(this.maxNodes, count));
  }

  /**
   * Returns current scaler state
   */
  getStatus() {
    return {
      currentNodes: this.currentNodes,
      minNodes: this.minNodes,
      maxNodes: this.maxNodes,
      thresholds: {
        up: this.scaleUpThreshold,
        down: this.scaleDownThreshold,
      },
    };
  }
}
