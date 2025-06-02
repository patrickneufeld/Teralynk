// /backend/src/ai/aiInsightCache.js

import LRU from 'lru-cache';
import logger from '../utils/logger.mjs';

const insightCache = new LRU({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 minutes
});

/**
 * Stores insight in cache using a traceable key.
 */
export const cacheInsight = (key, insight) => {
  try {
    insightCache.set(key, insight);
    logger.debug(`[InsightCache] Cached insight for key: ${key}`);
  } catch (err) {
    logger.error(`[InsightCache] Failed to cache insight: ${err.message}`);
  }
};

/**
 * Retrieves insight from cache if available.
 */
export const getCachedInsight = (key) => {
  try {
    const insight = insightCache.get(key);
    if (insight) {
      logger.debug(`[InsightCache] Cache hit for key: ${key}`);
    } else {
      logger.debug(`[InsightCache] Cache miss for key: ${key}`);
    }
    return insight;
  } catch (err) {
    logger.error(`[InsightCache] Cache retrieval error: ${err.message}`);
    return null;
  }
};

/**
 * Clears a specific cached insight.
 */
export const clearCachedInsight = (key) => {
  try {
    insightCache.delete(key);
    logger.debug(`[InsightCache] Cleared cache for key: ${key}`);
  } catch (err) {
    logger.error(`[InsightCache] Cache clear error: ${err.message}`);
  }
};

/**
 * Purges the entire cache.
 */
export const purgeInsightCache = () => {
  try {
    insightCache.clear();
    logger.info('[InsightCache] Full cache purged');
  } catch (err) {
    logger.error(`[InsightCache] Cache purge failed: ${err.message}`);
  }
};
