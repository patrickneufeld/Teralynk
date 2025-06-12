// /backend/src/ai/aiInsightCategorizer.js

import { sha3Hash } from '../security/quantumResistant.mjs';
import { logInsightEvent } from './aiTelemetryEngine.mjs';

/**
 * Categorizes AI-generated insights by type, severity, and domain.
 */
export function categorizeInsight(insight) {
  const categories = {
    performance: ['latency', 'throughput', 'load'],
    security: ['breach', 'vulnerability', 'unauthorized'],
    stability: ['crash', 'failure', 'exception'],
    optimization: ['improvement', 'enhancement', 'refactor'],
    anomaly: ['outlier', 'drift', 'deviation'],
  };

  const matchedCategories = [];

  for (const [key, keywords] of Object.entries(categories)) {
    for (const word of keywords) {
      if (insight.toLowerCase().includes(word)) {
        matchedCategories.push(key);
        break;
      }
    }
  }

  return matchedCategories.length > 0 ? matchedCategories : ['general'];
}

/**
 * Tags insights with classification metadata.
 */
export function tagInsight(insight, traceId = null) {
  const categories = categorizeInsight(insight);
  const fingerprint = sha3Hash(insight);

  const metadata = {
    categories,
    fingerprint,
    timestamp: Date.now(),
    traceId: traceId || `trace_${Date.now()}`,
  };

  logInsightEvent('INSIGHT_CATEGORIZED', { ...metadata, raw: insight });

  return metadata;
}
