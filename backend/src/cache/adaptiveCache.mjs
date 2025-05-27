// ✅ FILE: /backend/src/cache/adaptiveCache.js

import { LRUCache } from 'lru-cache';


import { isRedisAvailable, getRedisClient } from '../services/common/cacheService.mjs';
import aiInsightTracker from '../ai/aiInsightTracker.mjs';
import logger from '../utils/logger.mjs';

const DEFAULT_TTL = 600; // seconds
const MAX_ITEMS = 1000;

export class AdaptiveCache {
  constructor() {
    this.localCache = new LRUCache({
      max: MAX_ITEMS,
      ttl: DEFAULT_TTL * 1000,
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    });
  }

  /**
   * Determine TTL using AI, fallback to default.
   */
  async getAdaptiveTTL(key, context = {}) {
    try {
      const suggested = typeof aiInsightTracker?.suggestTTL === 'function'
        ? await aiInsightTracker.suggestTTL(key, context)
        : null;

      if (typeof suggested === 'number' && suggested >= 60 && suggested <= 86400) {
        return suggested;
      }
    } catch (err) {
      logger.warn('TTL suggestion failed, using default.', { key, context, err });
    }
    return DEFAULT_TTL;
  }

  /**
   * Retrieve value from LRU or Redis.
   */
  async get(key) {
    try {
      const cached = this.localCache.get(key);
      if (cached !== undefined) return cached;

      if (isRedisAvailable()) {
        const redis = getRedisClient();
        const result = await redis.get(key);
        return result ? JSON.parse(result) : null;
      }
    } catch (err) {
      logger.error('Cache get failed', { key, err });
    }

    return null;
  }

  /**
   * Store value in LRU and Redis with adaptive TTL.
   */
  async set(key, value, context = {}) {
    try {
      const ttl = await this.getAdaptiveTTL(key, context);
      this.localCache.set(key, value, { ttl: ttl * 1000 });

      if (isRedisAvailable()) {
        const redis = getRedisClient();
        await redis.setEx(key, ttl, JSON.stringify(value));
      }
    } catch (err) {
      logger.error('Cache set failed', { key, context, err });
    }
  }

  /**
   * Invalidate entry in LRU and Redis.
   */
  async invalidate(key) {
    try {
      this.localCache.delete(key);

      if (isRedisAvailable()) {
        const redis = getRedisClient();
        await redis.del(key);
      }
    } catch (err) {
      logger.error('Cache invalidate failed', { key, err });
    }
  }

  /**
   * Clear all cache entries (use with caution).
   */
  async clearAll() {
    try {
      this.localCache.clear();

      if (isRedisAvailable()) {
        const redis = getRedisClient();
        await redis.flushAll();
      }
    } catch (err) {
      logger.error('Cache clearAll failed', { err });
    }
  }

  /**
   * Check if key exists in LRU or Redis.
   */
  async has(key) {
    if (this.localCache.has(key)) return true;

    if (isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        return (await redis.exists(key)) === 1;
      } catch (err) {
        logger.error('Cache has check failed', { key, err });
      }
    }

    return false;
  }

  /**
   * Retrieve access pattern for future analysis.
   */
  async getAccessPattern(key) {
    // Simulate tracking logic until full telemetry-based tracking is implemented
    return {
      frequency: this.localCache.has(key) ? 1 : 0,
      lastAccessed: Date.now(),
    };
  }
}
