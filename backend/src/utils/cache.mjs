// /Users/patrick/Projects/Teralynk/backend/src/utils/cache.js

export class Cache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 3600; // Default TTL in seconds (1 hour)
    }

    // Set a value in cache with optional TTL
    set(key, value, ttl = this.defaultTTL) {
        const expiresAt = Date.now() + (ttl * 1000);
        this.cache.set(key, {
            value,
            expiresAt
        });
    }

    // Get a value from cache
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    // Delete a value from cache
    delete(key) {
        this.cache.delete(key);
    }

    // Clear entire cache
    clear() {
        this.cache.clear();
    }
}