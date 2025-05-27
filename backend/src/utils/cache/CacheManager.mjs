/**
 * Cache Manager
 * Enterprise-grade caching system with TTL and memory management
 */

import { logInfo, logError, logWarn } from '../logging/logging.mjs';

class CacheManager {
    constructor(options = {}) {
        this.options = {
            maxEntries: options.maxEntries || 10000,
            defaultTTL: options.defaultTTL || 300, // 5 minutes
            cleanupInterval: options.cleanupInterval || 60000, // 1 minute
            maxMemoryMB: options.maxMemoryMB || 100, // 100MB
            namespace: options.namespace || 'default'
        };

        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0,
            cleanups: 0
        };

        this.cleanupInterval = null;
        this.initialized = false;
    }

    /**
     * Initializes the cache manager
     */
    async initialize() {
        if (this.initialized) return;

        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval);

        this.initialized = true;
        logInfo('Cache manager initialized', {
            namespace: this.options.namespace,
            options: this.options
        });
    }

    /**
     * Gets a value from cache
     * @param {string} key 
     * @returns {Promise<any>}
     */
    async get(key) {
        try {
            const entry = this.cache.get(key);
            
            if (!entry) {
                this.stats.misses++;
                return null;
            }

            // Check if expired
            if (entry.expiresAt && entry.expiresAt < Date.now()) {
                this.cache.delete(key);
                this.stats.misses++;
                return null;
            }

            this.stats.hits++;
            return entry.value;

        } catch (error) {
            logError('Cache get error', { key, error });
            return null;
        }
    }

    /**
     * Sets a value in cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl 
     * @returns {Promise<boolean>}
     */
    async set(key, value, ttl = this.options.defaultTTL) {
        try {
            // Check memory usage before setting
            if (this.isMemoryExceeded()) {
                await this.evictOldest();
            }

            // Check max entries
            if (this.cache.size >= this.options.maxEntries) {
                await this.evictOldest();
            }

            const entry = {
                key,
                value,
                createdAt: Date.now(),
                expiresAt: ttl ? Date.now() + (ttl * 1000) : null,
                lastAccessed: Date.now()
            };

            this.cache.set(key, entry);
            this.stats.sets++;

            return true;

        } catch (error) {
            logError('Cache set error', { key, error });
            return false;
        }
    }

    /**
     * Deletes a value from cache
     * @param {string} key 
     * @returns {Promise<boolean>}
     */
    async delete(key) {
        try {
            const deleted = this.cache.delete(key);
            if (deleted) {
                this.stats.evictions++;
            }
            return deleted;
        } catch (error) {
            logError('Cache delete error', { key, error });
            return false;
        }
    }

    /**
     * Clears all cache entries
     * @returns {Promise<void>}
     */
    async clear() {
        try {
            this.cache.clear();
            this.resetStats();
            logInfo('Cache cleared', { namespace: this.options.namespace });
        } catch (error) {
            logError('Cache clear error', error);
        }
    }

    /**
     * Gets cache statistics
     * @returns {Object}
     */
    getStats() {
        const totalEntries = this.cache.size;
        const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024); // MB

        return {
            ...this.stats,
            totalEntries,
            memoryUsageMB: Math.round(memoryUsage),
            hitRate: this.calculateHitRate(),
            namespace: this.options.namespace
        };
    }

    /**
     * Cleans up expired entries
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            const now = Date.now();
            let cleaned = 0;

            for (const [key, entry] of this.cache.entries()) {
                if (entry.expiresAt && entry.expiresAt < now) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                this.stats.cleanups++;
                this.stats.evictions += cleaned;
                logInfo('Cache cleanup completed', {
                    namespace: this.options.namespace,
                    entriesRemoved: cleaned
                });
            }

        } catch (error) {
            logError('Cache cleanup error', error);
        }
    }

    /**
     * Shuts down the cache manager
     * @returns {Promise<void>}
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        await this.clear();
        this.initialized = false;
        logInfo('Cache manager shut down', { namespace: this.options.namespace });
    }

    // Private methods

    /**
     * Calculates cache hit rate
     * @private
     */
    calculateHitRate() {
        const total = this.stats.hits + this.stats.misses;
        if (total === 0) return 0;
        return this.stats.hits / total;
    }

    /**
     * Checks if memory usage exceeds limit
     * @private
     */
    isMemoryExceeded() {
        const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024); // MB
        return memoryUsage > this.options.maxMemoryMB;
    }

    /**
     * Evicts oldest entries from cache
     * @private
     */
    async evictOldest() {
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

        // Remove 10% of oldest entries
        const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
        
        for (let i = 0; i < toRemove; i++) {
            if (entries[i]) {
                this.cache.delete(entries[i][0]);
                this.stats.evictions++;
            }
        }

        logWarn('Cache entries evicted', {
            namespace: this.options.namespace,
            entriesRemoved: toRemove
        });
    }

    /**
     * Resets cache statistics
     * @private
     */
    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            evictions: 0,
            cleanups: 0
        };
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

export { cacheManager, CacheManager };
export default cacheManager;
