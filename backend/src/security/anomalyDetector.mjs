// ✅ FILE: /backend/src/security/anomalyDetector.js

import crypto from 'crypto';
import { recordSecurityTelemetry } from '../monitoring/telemetry.mjs';
import { getTraceId } from '../utils/telemetryUtils.mjs';

export class AnomalyDetector {
  constructor() {
    this.anomalyPatterns = new Map();
  }

  /**
   * Registers a known anomaly detection pattern.
   * @param {string} key - Unique pattern name
   * @param {Function} patternFn - Scoring function (target, context) => score (0-1)
   * @param {number} threshold - Detection threshold (default 0.85)
   */
  registerPattern(key, patternFn, threshold = 0.85) {
    if (typeof patternFn !== 'function') {
      throw new TypeError(`Pattern function for "${key}" must be a function.`);
    }
    this.anomalyPatterns.set(key, { patternFn, threshold });
  }

  /**
   * Evaluates an object against all registered anomaly detection patterns.
   * @param {object} target - The object to test
   * @param {object} context - Additional metadata/context
   * @returns {Array} Detected anomaly records
   */
  detect(target, context = {}) {
    const results = [];

    for (const [key, { patternFn, threshold }] of this.anomalyPatterns.entries()) {
      try {
        const score = patternFn(target, context);
        if (score >= threshold) {
          const detection = {
            type: key,
            score,
            detectedAt: new Date().toISOString(),
          };
          results.push(detection);
          this.recordEvent(target, detection, context);
        }
      } catch (err) {
        console.warn(`[AnomalyDetector] Pattern "${key}" threw an error:`, err);
      }
    }

    return results;
  }

  /**
   * Detects statistical outliers using Z-score method.
   * @param {number[]} values - Array of numeric values
   * @param {number} sensitivity - Z-score threshold
   * @returns {Array<{ value: number, index: number }>} Outlier data
   */
  detectOutliers(values, sensitivity = 2) {
    if (!Array.isArray(values) || values.length < 2) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => Math.pow(b - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return values
      .map((v, i) => ({ value: v, index: i }))
      .filter(({ value }) => Math.abs(value - mean) > sensitivity * std);
  }

  /**
   * Records a telemetry event for a detected anomaly.
   * @param {object} target - The object that triggered the anomaly
   * @param {object} detection - { type, score, detectedAt }
   * @param {object} context - Additional metadata
   */
  recordEvent(target, detection, context = {}) {
    const traceId = getTraceId(context.traceId);

    const payload = {
      traceId,
      severity: 'high',
      detectedBy: 'AnomalyDetector',
      type: detection.type,
      score: detection.score,
      timestamp: detection.detectedAt,
      fingerprint: crypto.createHash('sha256').update(JSON.stringify(target)).digest('hex'),
      context,
    };

    recordSecurityTelemetry('anomaly_detected', payload);
  }
}
