/**
 * Rate Limiter Implementation
 * Provides rate limiting functionality with sliding window
 */

import { logWarn, logError } from './logging/logging.mjs';

class RateLimitError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'RateLimitError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

class RateLimiter {
    constructor(maxRequests, options = {}) {
        this.maxRequests = maxRequests;
        this.windowMs = options.windowMs || 60000; // Default 1 minute
        this.requests = new Map();
        this.errorHandler = options.errorHandler || ((err) => logError('Rate limit exceeded', err));
        this.metrics = options.metrics;

        // Cleanup old requests periodically
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.windowMs);
    }

    /**
     * Checks if the rate limit has been exceeded
     * @throws {RateLimitError}
     * @returns {Promise<boolean>}
     */
    async checkLimit(key = 'default') {
        try {
            const now = Date.now();
            const windowStart = now - this.windowMs;

            // Get or initialize request history
            if (!this.requests.has(key)) {
                this.requests.set(key, []);
            }

            // Get requests within the current window
            const requests = this.requests.get(key);
            const validRequests = requests.filter(timestamp => timestamp > windowStart);

            // Check if limit exceeded
            if (validRequests.length >= this.maxRequests) {
                const oldestRequest = Math.min(...validRequests);
                const resetTime = oldestRequest + this.windowMs;
                const retryAfter = Math.ceil((resetTime - now) / 1000);

                const error = new RateLimitError('Rate limit exceeded', {
                    key,
                    limit: this.maxRequests,
                    window: this.windowMs,
                    retryAfter,
                    currentRequests: validRequests.length
                });

                if (this.metrics) {
                    this.metrics.incrementCounter('rate_limit_exceeded');
                }

                this.errorHandler(error);
                throw error;
            }

            // Add new request
            validRequests.push(now);
            this.requests.set(key, validRequests);

            if (this.metrics) {
                this.metrics.gaugeMetric('rate_limit_remaining', this.maxRequests - validRequests.length);
            }

            return true;

        } catch (error) {
            if (!(error instanceof RateLimitError)) {
                logError('Rate limiter error', error);
            }
            throw error;
        }
    }

    /**
     * Gets the current status of the rate limiter
     * @param {string} key 
     * @returns {Object} Status object
     */
    getStatus(key = 'default') {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        const requests = this.requests.get(key) || [];
        const validRequests = requests.filter(timestamp => timestamp > windowStart);

        return {
            limit: this.maxRequests,
            remaining: Math.max(0, this.maxRequests - validRequests.length),
            reset: validRequests.length > 0 ? 
                Math.ceil((Math.min(...validRequests) + this.windowMs - now) / 1000) : 0,
            currentRequests: validRequests.length
        };
    }

    /**
     * Cleans up old requests
     */
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        for (const [key, requests] of this.requests.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            if (validRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, validRequests);
            }
        }

        if (this.metrics) {
            this.metrics.gaugeMetric('rate_limiter_keys', this.requests.size);
        }
    }

    /**
     * Resets limits for a specific key or all keys
     * @param {string} key 
     */
    reset(key = null) {
        if (key) {
            this.requests.delete(key);
        } else {
            this.requests.clear();
        }
        
        if (this.metrics) {
            this.metrics.incrementCounter('rate_limiter_resets');
        }
    }

    /**
     * Destroys the rate limiter instance
     */
    destroy() {
        clearInterval(this.cleanupInterval);
        this.requests.clear();
    }
}

export { RateLimiter, RateLimitError };
export default RateLimiter;
