// File: /backend/src/utils/ai/LoadPredictor.js
import { logDebug, logError, logWarn } from '../logger.mjs'; // Adjust path if needed

export class LoadPredictor {
  constructor(options = {}) {
    this.history = [];
    this.windowSize = options.windowSize || 10; // Number of past data points to consider
  }

  async predict(currentLoad) {
    try {
      logDebug('Predicting load', { currentLoad });

      this.history.push(currentLoad);
      if (this.history.length > this.windowSize) {
        this.history.shift(); // Remove oldest data point
      }

      const prediction = this.calculatePrediction();
      const confidence = this.calculateConfidence(prediction, currentLoad);

      if (confidence < 0.5) {
        logWarn('Low confidence in load prediction', { prediction, confidence });
      }

      return {
        prediction,
        confidence,
        window: `${this.windowSize} data points`,
      };

    } catch (error) {
      logError('Load prediction failed', { error: error.message });
      throw error;
    }
  }

  calculatePrediction() {
    if (this.history.length === 0) {
      return 0; // Or another default value
    }

    // Simple Moving Average (replace with your prediction logic)
    const sum = this.history.reduce((total, load) => total + load, 0);
    return sum / this.history.length;
  }

  calculateConfidence(prediction, currentLoad) {
    if (this.history.length < 2) {
      return 1; // Or another default value for small history
    }

    // Example confidence calculation (replace with your logic)
    const variance = this.history.reduce((total, load) => total + Math.pow(load - prediction, 2), 0) / this.history.length;
    const stdDev = Math.sqrt(variance);
    const diff = Math.abs(prediction - currentLoad);
    const confidence = 1 - Math.min(diff / (2 * stdDev), 1); // Confidence between 0 and 1

    return confidence;
  }
}

