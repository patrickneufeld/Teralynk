// ================================================
// ✅ FILE: /frontend/src/api/apiClient.js
// Secure API Client with Enhanced Security & Error Handling
// Version: 2.3.1
// ================================================

import axios from 'axios';
import { createLogger } from '@/utils/logging/logging';
import { getToken, removeToken } from '@/utils/tokenManager';
import { emitSecurityEvent } from '@/utils/security/eventEmitter';
import { SECURITY_EVENTS } from '@/constants/securityConstants';

const logger = createLogger('ApiClient');

// ✅ Environment & Configuration
const DEFAULT_API_URL = 'http://localhost:5001';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '') ||
  import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') ||
  DEFAULT_API_URL;

const CONFIG = {
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
  ERROR_CODES_TO_RETRY: [408, 429, 500, 502, 503, 504],
};

// ✅ Standard headers with consistent lowercase casing
const DEFAULT_HEADERS = {
  'content-type': 'application/json',
  'accept': 'application/json',
  'x-requested-with': 'xmlhttprequest'
};

// ✅ Create enhanced Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: CONFIG.TIMEOUT,
  withCredentials: true,
  headers: DEFAULT_HEADERS
});

// ✅ Request queue with improved type safety
const requestQueue = new Map();

// ✅ Enhanced retry logic with exponential backoff
const retryRequest = async (error, retryCount = 0) => {
  const { config } = error;
  
  if (!config || retryCount >= CONFIG.RETRY_ATTEMPTS) {
    return Promise.reject(error);
  }

  const shouldRetry = CONFIG.ERROR_CODES_TO_RETRY.includes(error.response?.status);
  if (!shouldRetry) {
    return Promise.reject(error);
  }

  const delayTime = CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
  await new Promise(resolve => setTimeout(resolve, delayTime));

  return apiClient({
    ...config,
    retryCount: retryCount + 1,
  });
};

// ✅ Request Interceptor with improved error handling
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Generate request ID and add to queue
      const requestId = crypto.randomUUID();
      config.requestId = requestId;
      requestQueue.set(requestId, config);

      // Set headers with consistent lowercase casing
      config.headers = {
        ...config.headers,
        'x-request-id': requestId,
        'trace-id': requestId,
        'x-client-version': import.meta.env.VITE_APP_VERSION || '1.0.0'
      };

      // Add authentication if available
      const token = await getToken();
      if (token) {
        config.headers.authorization = `Bearer ${token}`;
      }

      logger.debug('API Request', {
        url: config.url,
        method: config.method,
        requestId,
        headers: config.headers // Include headers for debugging
      });

      return config;
    } catch (err) {
      logger.error('Request interceptor failed', { error: err, config });
      return Promise.reject(err);
    }
  },
  (error) => {
    logger.error('Request preparation failed', { error });
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    const { config } = response;
    requestQueue.delete(config.requestId);

    logger.debug('API Response', {
      url: config.url,
      status: response.status,
      requestId: config.requestId,
      headers: response.headers // Include headers for debugging
    });

    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Clean up request queue
    if (config?.requestId) {
      requestQueue.delete(config.requestId);
    }

    // Handle different types of errors
    if (response) {
      // Server returned an error response
      const errorData = {
        url: config?.url,
        status: response.status,
        data: response.data,
        requestId: config?.requestId,
        headers: config?.headers
      };

      switch (response.status) {
        case 401:
          emitSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, {
            reason: 'unauthorized',
            ...errorData
          });
          if (response.data?.code === 'token_expired') {
            await removeToken();
          }
          break;

        case 403:
          emitSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, {
            reason: 'forbidden',
            ...errorData
          });
          break;

        case 429:
          const retryAfter = response.headers['retry-after'] || 60;
          logger.warn('Rate limit exceeded', {
            ...errorData,
            retryAfter
          });
          emitSecurityEvent(SECURITY_EVENTS.RATE_LIMIT, {
            ...errorData,
            retryAfter
          });
          throw new Error(
            response.data?.message || 
            `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`
          );

        default:
          logger.error('API Error Response', errorData);
      }
    } else if (error.request) {
      // Network or CORS error
      const errorData = {
        url: config?.url,
        message: error.message,
        requestId: config?.requestId,
        headers: config?.headers
      };

      if (error.message.includes('CORS')) {
        logger.error('CORS Error', {
          ...errorData,
          origin: window.location.origin,
          targetUrl: config?.url
        });
        emitSecurityEvent(SECURITY_EVENTS.SECURITY_ERROR, {
          reason: 'cors_error',
          ...errorData
        });
      } else {
        logger.error('Network Error', errorData);
      }
    } else {
      // Request configuration error
      logger.error('Request Configuration Error', {
        message: error.message,
        requestId: config?.requestId,
        config: config
      });
    }

    // Attempt retry if applicable
    if (config && !config.retryCount) {
      try {
        return await retryRequest(error);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Enhanced utility functions
const apiUtils = {
  cancelPendingRequests: (message = 'Request cancelled') => {
    requestQueue.forEach((config) => {
      if (config.cancelToken) {
        config.cancelToken.cancel(message);
      }
    });
    requestQueue.clear();
  },
  getQueueSize: () => requestQueue.size,
  isRequestPending: (requestId) => requestQueue.has(requestId),
  getBaseUrl: () => API_BASE_URL,
  getHeaders: () => ({ ...DEFAULT_HEADERS })
};

// ✅ Export enhanced client
const enhancedApiClient = {
  ...apiClient,
  ...apiUtils
};

logger.info('API Client initialized', { 
  baseURL: API_BASE_URL,
  defaultHeaders: DEFAULT_HEADERS 
});

export default enhancedApiClient;
