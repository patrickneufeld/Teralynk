// /backend/src/ai/aiInsightMetrics.js

import { recordMetric } from '../services/metricsService.mjs';
import logger from '../utils/logger.mjs';

/**
 * Records insight-related metrics with tagging for analytics.
 */
export const trackInsightMetric = (insightType, value, tags = {}) => {
  try {
    recordMetric('ai.insight.count', value, {
      type: insightType,
      ...tags,
    });
  } catch (err) {
    logger.error(`[InsightMetrics] Failed to record metric: ${err.message}`);
  }
};

/**
 * Tracks latency of insight processing.
 */
export const trackInsightLatency = (insightType, durationMs) => {
  try {
    recordMetric('ai.insight.latency', durationMs, {
      type: insightType,
    });
  } catch (err) {
    logger.error(`[InsightMetrics] Latency metric failed: ${err.message}`);
  }
};
