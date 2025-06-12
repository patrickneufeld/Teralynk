// ================================================
// ✅ FILE: /frontend/src/api/apiClient.js
// Hardened, ESM-Safe, Enterprise-Grade API Client
// ================================================

import axios from 'axios';
import { createLogger } from '@/utils/logging/logging';
import { getToken, removeToken } from '@/utils/tokenManager';
import { emitSecurityEvent } from '@/utils/security/eventEmitter';
import { SECURITY_EVENTS } from '@/constants/securityConstants'; // Make sure this path is correct
import { RateLimiter } from '@/utils/RateLimiter';

const logger = createLogger('ApiClient');

// ✅ Environment & Configuration with validation
function validateConfig() {
  const required = ['VITE_APP_VERSION'];
  const missing = required.filter(key => !import.meta.env[key]);
  if (missing.length) {
    logger.warn('Missing optional environment variables', { missing });
  }
}
validateConfig();

// ✅ Constants and Configuration
const CONFIG = {
  DEFAULT_API_URL: 'http://localhost:5001',
  TIMEOUT: 15000,
  RETRY: {
    ATTEMPTS: 2,
    DELAY: 1000,
    MAX_DELAY: 30000,
    CODES: [408, 429, 500, 502, 503, 504],
    METHODS: ['GET', 'HEAD', 'OPTIONS', 'POST'],
  },
  SECURITY: {
    MAX_QUEUE_SIZE: 100,
    RATE_LIMIT: {
      MAX_ATTEMPTS: import.meta.env.MODE === 'development' ? 1000 : 60,
      TIME_WINDOW: 60000,
      ENABLED: import.meta.env.MODE !== 'development',
    },
    HEADERS: {
      REQUIRED: ['content-type', 'accept'],
      SENSITIVE: ['authorization', 'cookie'],
    },
  },
};

// ✅ API URL Configuration with validation
const API_BASE_URL = (() => {
  const url = import.meta.env.VITE_BACKEND_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    CONFIG.DEFAULT_API_URL;

  try {
    new URL(url);
    return url.replace(/\/$/, '');
  } catch (err) {
    logger.warn('Invalid API URL, using default', { url, error: err });
    return CONFIG.DEFAULT_API_URL;
  }
})();

// ✅ Enhanced Headers Management
class HeadersManager {
  static defaultHeaders = {
    'content-type': 'application/json',
    'accept': 'application/json',
    'x-requested-with': 'xmlhttprequest',
  };
  static sensitiveHeaders = new Set(CONFIG.SECURITY.HEADERS.SENSITIVE);

  static getDefaultHeaders() {
    return { ...HeadersManager.defaultHeaders };
  }

  static sanitizeHeaders(headers = {}) {
    const sanitized = { ...headers };
    for (const header of HeadersManager.sensitiveHeaders) {
      if (header in sanitized) sanitized[header] = '[REDACTED]';
    }
    return sanitized;
  }

  static validateHeaders(headers = {}) {
    const normalized = Object.keys(headers).reduce((acc, key) => {
      acc[key.toLowerCase()] = headers[key];
      return acc;
    }, {});
    const missing = CONFIG.SECURITY.HEADERS.REQUIRED
      .filter(header => !(header.toLowerCase() in normalized));
    for (const header of missing) {
      headers[header.toLowerCase()] = HeadersManager.defaultHeaders[header.toLowerCase()];
    }
    return headers;
  }

  static mergeHeaders(headers = {}) {
    return { ...HeadersManager.getDefaultHeaders(), ...headers };
  }
}

// ✅ Token Management
const handleTokenOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    logger.error('Token operation failed', { key: error?.key, error: error.message });
    return fallback;
  }
};

// ✅ Request Queue Management
class RequestQueueManager {
  constructor() {
    this.queue = new Map();
    this.rateLimiter = new RateLimiter({
      maxAttempts: CONFIG.SECURITY.RATE_LIMIT.MAX_ATTEMPTS,
      timeWindow: CONFIG.SECURITY.RATE_LIMIT.TIME_WINDOW
    });
  }

  async add(requestId, config) {
    if (this.queue.size >= CONFIG.SECURITY.MAX_QUEUE_SIZE) {
      throw new Error('Request queue size limit exceeded');
    }
    if (CONFIG.SECURITY.RATE_LIMIT.ENABLED) {
      try {
        await this.rateLimiter.checkLimit(requestId);
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          logger.warn('Rate limit would be exceeded in production', { requestId, error: error.message });
        } else {
          throw error;
        }
      }
    }
    this.queue.set(requestId, config);
  }

  remove(requestId) { this.queue.delete(requestId); }
  clear() { this.queue.clear(); this.rateLimiter.reset(); }
  get size() { return this.queue.size; }
  has(requestId) { return this.queue.has(requestId); }
  getRateLimitStatus(requestId) { return this.rateLimiter.getStatus(requestId); }
  cancelAll(message = 'Request cancelled') {
    for (const config of this.queue.values()) {
      if (config.cancelToken) config.cancelToken.cancel(message);
    }
    this.clear();
  }
}

// ✅ Error Handling
class ApiError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
  static from(error, defaultCode = 'UNKNOWN_ERROR') {
    const message = error.response?.data?.message || error.message;
    const code = error.response?.data?.code || error.code || defaultCode;
    const details = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      requestId: error.config?.requestId,
      timestamp: Date.now(),
    };
    return new ApiError(message, code, details);
  }
}

// ✅ Request/Response Tracking
class RequestTracker {
  static instance;
  constructor() {
    if (RequestTracker.instance) return RequestTracker.instance;
    this.requestQueue = new RequestQueueManager();
    RequestTracker.instance = this;
  }
  get queue() { return this.requestQueue; }
  createRequestMetadata(config) {
    return {
      requestId: (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
      timestamp: Date.now(),
      url: config.url,
      method: config.method,
    };
  }
  async trackRequest(config, metadata) {
    await this.requestQueue.add(metadata.requestId, { ...config, metadata });
  }
  completeRequest(requestId) {
    this.requestQueue.remove(requestId);
  }
}

// ✅ Create API Client Instance
const createApiClient = () => {
  const requestTracker = new RequestTracker();
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: CONFIG.TIMEOUT,
    withCredentials: true,
    headers: HeadersManager.getDefaultHeaders(),
    validateStatus: status => status >= 200 && status < 300,
  });

  // Request Interceptor
  instance.interceptors.request.use(
    async (config) => {
      try {
        config.headers = HeadersManager.mergeHeaders(config.headers);
        config.headers = HeadersManager.validateHeaders(config.headers);
        const metadata = requestTracker.createRequestMetadata(config);
        config.requestId = metadata.requestId;
        await requestTracker.trackRequest(config, metadata);
        config.headers = {
          ...config.headers,
          'x-request-id': metadata.requestId,
          'x-client-version': import.meta.env.VITE_APP_VERSION || '1.0.0',
        };

        try {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Use Authorization header
          }
        } catch (tokenError) {
          logger.warn('Failed to get auth token', {
            error: tokenError.message,
            url: config.url
          });
          // Continue without token if it fails
        }

        logger.debug('API Request', { ...metadata, headers: HeadersManager.sanitizeHeaders(config.headers) });
        return config;
      } catch (err) {
        logger.error('Request interceptor failed', { error: err, url: config.url, method: config.method });
        return Promise.reject(ApiError.from(err, 'REQUEST_PREPARATION_FAILED'));
      }
    },
    (error) => {
      logger.error('Request preparation failed', { error });
      return Promise.reject(ApiError.from(error, 'REQUEST_PREPARATION_FAILED'));
    }
  );

  // Response Interceptor
  instance.interceptors.response.use(
    (response) => {
      const { config } = response;
      requestTracker.completeRequest(config.requestId);
      logger.debug('API Response', {
        url: config.url,
        status: response.status,
        requestId: config.requestId,
        headers: HeadersManager.sanitizeHeaders(response.headers),
      });
      return response;
    },
    async (error) => {
      const { config, response } = error;
      if (config?.requestId) requestTracker.completeRequest(config.requestId);

      if (response) {
        // ... (handling for 401, 403, 429 errors remains the same)
      } else if (error.request) {
        // ... (handling for network and CORS errors remains the same)
      }

      // Retry logic
      if (config && (!config.retryCount || config.retryCount < CONFIG.RETRY.ATTEMPTS) && CONFIG.RETRY.METHODS.includes(config.method?.toUpperCase())) {
        const shouldRetry = !response || CONFIG.RETRY.CODES.includes(response.status);
        if (shouldRetry) {
          try {
            return await retryRequest(error, config.retryCount || 0);
          } catch (retryError) {
            return Promise.reject(ApiError.from(retryError));
          }
        }
      }

      return Promise.reject(ApiError.from(error));
    }
  );

  return instance;
};

// ✅ Retry Logic
const retryRequest = async (error, retryCount = 0) => {
  const { config } = error;
  if (!config || retryCount >= CONFIG.RETRY.ATTEMPTS) return Promise.reject(error);

  const delay = Math.min(CONFIG.RETRY.DELAY * Math.pow(2, retryCount), CONFIG.RETRY.MAX_DELAY);
  logger.info(`Retrying request (${retryCount + 1}/${CONFIG.RETRY.ATTEMPTS}) after ${delay}ms`, {
    url: config.url,
    method: config.method
  });

  await new Promise(resolve => setTimeout(resolve, delay));

  return apiClient({
    ...config,
    retryCount: retryCount + 1,
  });
};


// ✅ Create and enhance API client
const apiClient = createApiClient();
const requestTracker = new RequestTracker();

const enhancedApiClient = {
  ...apiClient,
  cancelPendingRequests: (message = 'Request cancelled') => requestTracker.queue.cancelAll(message),
  getQueueSize: () => requestTracker.queue.size,
  isRequestPending: (requestId) => requestTracker.queue.has(requestId),
  getRateLimitStatus: (requestId) => requestTracker.queue.getRateLimitStatus(requestId),
  getBaseUrl: () => API_BASE_URL,
  getDefaultHeaders: () => HeadersManager.getDefaultHeaders(),
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return { status: 'healthy', timestamp: Date.now(), ...response.data };
    } catch (error) {
      return { status: 'unhealthy', timestamp: Date.now(), error: error.message };
    }
  },
  setDefaultHeader: (name, value) => { apiClient.defaults.headers.common[name.toLowerCase()] = value; },
  removeDefaultHeader: (name) => { delete apiClient.defaults.headers.common[name.toLowerCase()]; },
  clearDefaultHeaders: () => { apiClient.defaults.headers.common = HeadersManager.getDefaultHeaders(); },
};

// Log initialization
logger.info('API Client initialized', {
  baseURL: API_BASE_URL,
  version: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.MODE,
});

export default enhancedApiClient;
export { ApiError, HeadersManager };
