// ✅ FILE: /frontend/src/utils/cache/CacheManager.js

/**
 * In-memory cache manager with TTL support
 */
class CacheManager {
    constructor() {
      this.cache = new Map();
      this.timestamps = new Map();
      this.metadata = new Map();
    }
  
    /**
     * Get a cached value
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or null
     */
    async get(key) {
      const timestamp = this.timestamps.get(key);
      if (timestamp && Date.now() > timestamp) {
        this.delete(key);
        return null;
      }
      return this.cache.get(key);
    }
  
    /**
     * Set a cache value with TTL
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds
     * @param {Object} [metadata] - Optional metadata
     */
    async set(key, value, ttlSeconds, metadata = {}) {
      this.cache.set(key, value);
      this.timestamps.set(key, Date.now() + (ttlSeconds * 1000));
      if (Object.keys(metadata).length > 0) {
        this.metadata.set(key, { ...metadata, createdAt: Date.now() });
      }
    }
  
    /**
     * Delete a cache entry
     * @param {string} key - Cache key
     */
    async delete(key) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.metadata.delete(key);
    }
  
    /**
     * Clear all cache entries
     */
    async clear() {
      this.cache.clear();
      this.timestamps.clear();
      this.metadata.clear();
    }
  
    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys()),
        metadata: Object.fromEntries(this.metadata),
        timestamp: Date.now()
      };
    }
  }
  
  export const cacheManager = new CacheManager();
  