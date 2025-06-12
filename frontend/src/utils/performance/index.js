// ================================================
// ⚡ FILE: /frontend/src/utils/performance/index.js
// Performance Optimization Utilities
// ================================================

/**
 * Debounces a function call
 * @param {Function} fn Function to debounce
 * @param {number} delay Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Memoizes a function with expiry
 * @param {Function} fn Function to memoize
 * @param {number} ttl Time to live in milliseconds
 * @param {Map} cache Optional cache instance
 * @returns {Function} Memoized function
 */
export const memoizeWithExpiry = (fn, ttl, cache = new Map()) => {
  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && cached.expires > now) {
      return cached.value;
    }

    const result = fn(...args);
    cache.set(key, {
      value: result,
      expires: now + ttl
    });

    return result;
  };
};

/**
 * Safely executes an async operation with timeout
 * @param {Function} operation Async operation to execute
 * @param {Object} options Configuration options
 * @returns {Promise} Operation result
 */
export const safeAsync = async (operation, options = {}) => {
  const {
    timeout = 5000,
    retries = 0,
    backoff = 1000,
    onError,
    context = {}
  } = options;

  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await Promise.race([
        operation({ signal: controller.signal, context }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), timeout)
        )
      ]);

      clearTimeout(timeoutId);
      return result;

    } catch (error) {
      attempt++;
      
      if (onError) {
        onError(error, attempt);
      }

      if (attempt <= retries) {
        await new Promise(resolve => 
          setTimeout(resolve, backoff * Math.pow(2, attempt - 1))
        );
        continue;
      }

      throw error;
    }
  }
};

/**
 * Batches async operations
 * @param {Array} operations Array of operations to batch
 * @param {Object} options Configuration options
 * @returns {Promise} Batch results
 */
export const batchAsync = async (operations, options = {}) => {
  const {
    batchSize = 5,
    delayBetweenBatches = 100,
    stopOnError = false
  } = options;

  const results = [];
  const errors = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.all(
        batch.map(op => op().catch(error => {
          errors.push(error);
          if (stopOnError) throw error;
          return null;
        }))
      );
      
      results.push(...batchResults.filter(r => r !== null));
      
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (error) {
      if (stopOnError) throw error;
    }
  }

  return {
    results,
    errors,
    success: errors.length === 0
  };
};

/**
 * Creates a throttled function
 * @param {Function} fn Function to throttle
 * @param {number} limit Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit) => {
  let inThrottle;
  let lastFunc;
  let lastRan;

  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn.apply(this, args);
          lastRan = Date.now();
        }
      }, Math.max(limit - (Date.now() - lastRan), 0));
    }
  };
};

/**
 * RAF-based throttle for UI operations
 * @param {Function} fn Function to throttle
 * @returns {Function} RAF-throttled function
 */
export const rafThrottle = (fn) => {
  let scheduled = false;
  return (...args) => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        scheduled = false;
      });
    }
  };
};

/**
 * Creates a cached function with LRU eviction
 * @param {Function} fn Function to cache
 * @param {Object} options Cache options
 * @returns {Function} Cached function
 */
export const createLRUCache = (fn, options = {}) => {
  const {
    maxSize = 100,
    ttl = 5 * 60 * 1000 // 5 minutes
  } = options;

  const cache = new Map();
  const timestamps = new Map();
  const accessOrder = new Map();
  let accessCounter = 0;

  const evict = () => {
    if (cache.size <= maxSize) return;
    
    let oldest = Infinity;
    let oldestKey;
    
    accessOrder.forEach((count, key) => {
      if (count < oldest) {
        oldest = count;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      cache.delete(oldestKey);
      timestamps.delete(oldestKey);
      accessOrder.delete(oldestKey);
    }
  };

  return (...args) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const timestamp = timestamps.get(key);

    if (cache.has(key)) {
      if (timestamp && now - timestamp < ttl) {
        accessOrder.set(key, ++accessCounter);
        return cache.get(key);
      }
      cache.delete(key);
      timestamps.delete(key);
      accessOrder.delete(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    timestamps.set(key, now);
    accessOrder.set(key, ++accessCounter);
    evict();

    return result;
  };
};

export default {
  debounce,
  memoizeWithExpiry,
  safeAsync,
  batchAsync,
  throttle,
  rafThrottle,
  createLRUCache
};
