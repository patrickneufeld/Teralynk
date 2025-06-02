// ✅ FILE: /src/utils/RateLimiter.js

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * RateLimiter class for managing rate limits with enhanced features
 */
export class RateLimiter {
  /**
   * @param {Object} options Rate limiter options
   * @param {number} [options.maxAttempts=5] Maximum number of attempts allowed
   * @param {number} [options.timeWindow=60000] Time window in milliseconds
   * @param {number} [options.limitPerMinute] Requests per minute (alternative to maxAttempts)
   */
  constructor(options = {}) {
    if (typeof options === 'number') {
      // Support legacy constructor that took limitPerMinute
      this.maxAttempts = options;
      this.timeWindow = 60000;
    } else {
      this.maxAttempts = options.maxAttempts || 5;
      this.timeWindow = options.timeWindow || 60000;
      if (options.limitPerMinute) {
        this.maxAttempts = options.limitPerMinute;
        this.timeWindow = 60000;
      }
    }

    this.attempts = new Map();
    this.requests = [];
  }

  /**
   * Check if the rate limit has been exceeded
   * @param {string} [key] Optional key for tracking different limiters
   * @returns {Promise<boolean>} Returns true if within limits
   * @throws {Error} Throws if rate limit exceeded
   */
  async checkLimit(key = 'default') {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts
    const validAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (validAttempts.length >= this.maxAttempts) {
      const resetTime = this.getTimeUntilReset(key);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds`);
    }

    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  /**
   * Get remaining attempts for a key
   * @param {string} [key='default'] Key to check
   * @returns {number} Number of remaining attempts
   */
  getRemainingAttempts(key = 'default') {
    const userAttempts = this.attempts.get(key) || [];
    const validAttempts = userAttempts.filter(
      timestamp => Date.now() - timestamp < this.timeWindow
    );
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  /**
   * Reset attempts for a key
   * @param {string} [key='default'] Key to reset
   */
  reset(key = 'default') {
    this.attempts.delete(key);
  }

  /**
   * Get time until rate limit reset
   * @param {string} [key='default'] Key to check
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset(key = 'default') {
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldest = Math.min(...userAttempts);
    return Math.max(0, this.timeWindow - (Date.now() - oldest));
  }

  /**
   * Get current rate limit status
   * @param {string} [key='default'] Key to check
   * @returns {Object} Rate limit status
   */
  getStatus(key = 'default') {
    return {
      remaining: this.getRemainingAttempts(key),
      resetIn: this.getTimeUntilReset(key),
      limit: this.maxAttempts,
      timeWindow: this.timeWindow
    };
  }
}

// For backwards compatibility
export const RateLimit = RateLimiter;
