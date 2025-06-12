// aiInsightDeduplicator.js

import { createHash } from 'crypto';
import LRU from 'lru-cache';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import logger from '../config/logger.mjs';

const DEDUPLICATION_WINDOW = 10000; // Max insights to remember
const SIMILARITY_THRESHOLD = 0.95;

const deduplicationCache = new LRU({
  max: DEDUPLICATION_WINDOW,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

/**
 * Generates a content fingerprint using SHA-256 on a normalized insight string.
 */
function generateInsightHash(insight) {
  const normalized = JSON.stringify(insight || '').toLowerCase().trim();
  const hash = createHash('sha256').update(normalized).digest('hex');
  return hash;
}

/**
 * Compares similarity of two hashes using Hamming distance approximation.
 */
function isHashSimilar(hash1, hash2) {
  let differences = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) differences++;
  }
  const similarity = 1 - differences / hash1.length;
  return similarity >= SIMILARITY_THRESHOLD;
}

/**
 * Checks if an insight is a duplicate.
 */
export function isDuplicateInsight(insight, traceId = null) {
  const newHash = generateInsightHash(insight);

  for (const existingHash of deduplicationCache.keys()) {
    if (isHashSimilar(existingHash, newHash)) {
      logger.debug(`[InsightDeduplicator] Duplicate detected for hash ${newHash}`);
      recordEventTelemetry('ai.insight.duplicate', { traceId, newHash });
      return true;
    }
  }

  deduplicationCache.set(newHash, true);
  logger.info(`[InsightDeduplicator] New insight accepted | hash: ${newHash}`);
  recordEventTelemetry('ai.insight.unique', { traceId, newHash });
  return false;
}

/**
 * Force-clears the deduplication memory cache.
 */
export function clearDeduplicationCache() {
  deduplicationCache.clear();
  logger.warn(`[InsightDeduplicator] Deduplication cache cleared`);
  recordEventTelemetry('ai.insight.cacheCleared');
}
