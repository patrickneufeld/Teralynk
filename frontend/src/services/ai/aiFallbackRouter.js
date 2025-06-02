// ✅ FILE: /frontend/src/services/ai/aiFallbackRouter.js

import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { logError, logInfo, logWarn } from '@/utils/logging/logging';
import { handleAPIError } from '@/utils/ErrorHandler';
import { sanitizeInput } from '@/utils/security/inputSanitizer';
import { MetricsCollector } from '@/utils/metrics/MetricsCollector';
import { CircuitBreaker } from '@/utils/CircuitBreaker';
import { validatePrompt } from '@/utils/ai/promptValidator';
import { cacheManager } from '@/utils/cache/CacheManager';
import { RateLimiter } from '@/utils/RateLimiter';

// Configuration constants
const CONFIG = {
  OPENAI: {
    URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4',
    MAX_TOKENS: 2048,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT: 50 // requests per minute
  },
  ANTHROPIC: {
    URL: 'https://api.anthropic.com/v1/messages',
    MODEL: 'claude-3-sonnet-20240229',
    MAX_TOKENS: 1024,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT: 50
  },
  BEDROCK: {
    URL: '/api/ai/bedrock/route',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT: 100
  },
  GLOBAL: {
    MAX_PROMPT_LENGTH: 4096,
    CACHE_TTL: 3600, // 1 hour
    CIRCUIT_BREAKER_THRESHOLD: 0.5, // 50% failure rate
    CIRCUIT_BREAKER_RESET_TIMEOUT: 60000 // 1 minute
  }
};

// Initialize rate limiters and circuit breakers
const rateLimiters = {
  openai: new RateLimiter(CONFIG.OPENAI.RATE_LIMIT),
  anthropic: new RateLimiter(CONFIG.ANTHROPIC.RATE_LIMIT),
  bedrock: new RateLimiter(CONFIG.BEDROCK.RATE_LIMIT)
};

const circuitBreakers = {
  openai: new CircuitBreaker(CONFIG.GLOBAL.CIRCUIT_BREAKER_THRESHOLD, CONFIG.GLOBAL.CIRCUIT_BREAKER_RESET_TIMEOUT),
  anthropic: new CircuitBreaker(CONFIG.GLOBAL.CIRCUIT_BREAKER_THRESHOLD, CONFIG.GLOBAL.CIRCUIT_BREAKER_RESET_TIMEOUT),
  bedrock: new CircuitBreaker(CONFIG.GLOBAL.CIRCUIT_BREAKER_THRESHOLD, CONFIG.GLOBAL.CIRCUIT_BREAKER_RESET_TIMEOUT)
};

const metrics = new MetricsCollector('ai_fallback_router');

class AIFallbackError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'AIFallbackError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

const createAPIRequest = async (url, headers, body, timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AIFallbackError(
        `API request failed with status ${response.status}`,
        'API_ERROR',
        { status: response.status, errorData }
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const fallbackEngines = {
  openai: async (prompt, traceId) => {
    if (!circuitBreakers.openai.isAvailable()) {
      throw new AIFallbackError('OpenAI service circuit breaker open', 'CIRCUIT_BREAKER_OPEN');
    }

    await rateLimiters.openai.checkLimit();

    const startTime = Date.now();
    try {
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Trace-ID': traceId
      };

      const body = {
        model: CONFIG.OPENAI.MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: CONFIG.OPENAI.MAX_TOKENS
      };

      const data = await createAPIRequest(
        CONFIG.OPENAI.URL,
        headers,
        body,
        CONFIG.OPENAI.TIMEOUT_MS
      );

      circuitBreakers.openai.recordSuccess();
      metrics.recordLatency('openai_request', Date.now() - startTime);
      
      return data.choices?.[0]?.message?.content || 'No response from OpenAI.';
    } catch (error) {
      circuitBreakers.openai.recordFailure();
      metrics.incrementCounter('openai_failures');
      throw error;
    }
  },

  anthropic: async (prompt, traceId) => {
    if (!circuitBreakers.anthropic.isAvailable()) {
      throw new AIFallbackError('Anthropic service circuit breaker open', 'CIRCUIT_BREAKER_OPEN');
    }

    await rateLimiters.anthropic.checkLimit();

    const startTime = Date.now();
    try {
      const headers = {
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'X-Trace-ID': traceId
      };

      const body = {
        model: CONFIG.ANTHROPIC.MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: CONFIG.ANTHROPIC.MAX_TOKENS
      };

      const data = await createAPIRequest(
        CONFIG.ANTHROPIC.URL,
        headers,
        body,
        CONFIG.ANTHROPIC.TIMEOUT_MS
      );

      circuitBreakers.anthropic.recordSuccess();
      metrics.recordLatency('anthropic_request', Date.now() - startTime);

      return data?.content?.[0]?.text || 'No response from Claude.';
    } catch (error) {
      circuitBreakers.anthropic.recordFailure();
      metrics.incrementCounter('anthropic_failures');
      throw error;
    }
  },

  bedrock: async (prompt, traceId) => {
    if (!circuitBreakers.bedrock.isAvailable()) {
      throw new AIFallbackError('Bedrock service circuit breaker open', 'CIRCUIT_BREAKER_OPEN');
    }

    await rateLimiters.bedrock.checkLimit();

    const startTime = Date.now();
    try {
      const token = await getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Trace-ID': traceId
      };

      const body = { prompt };

      const data = await createAPIRequest(
        CONFIG.BEDROCK.URL,
        headers,
        body,
        CONFIG.BEDROCK.TIMEOUT_MS
      );

      circuitBreakers.bedrock.recordSuccess();
      metrics.recordLatency('bedrock_request', Date.now() - startTime);

      return data?.response || 'No response from Bedrock.';
    } catch (error) {
      circuitBreakers.bedrock.recordFailure();
      metrics.incrementCounter('bedrock_failures');
      throw error;
    }
  }
};

/**
 * 🌐 Enterprise-grade AI Fallback Router
 * @param {Object} options Request options
 * @param {string} options.prompt - Natural language prompt
 * @param {string} [options.engine='openai'] - AI engine to use (openai|anthropic|bedrock)
 * @param {string} [options.traceId] - Trace ID for request tracking
 * @param {boolean} [options.useCache=true] - Whether to use response caching
 * @returns {Promise<{ response: string, engineUsed: string, metadata: Object }>}
 * @throws {AIFallbackError}
 */
export const invokeFallbackAI = async ({
  prompt,
  engine = 'openai',
  traceId = getTraceId(),
  useCache = true
}) => {
  const startTime = Date.now();
  const metadata = { traceId, engine, timestamp: new Date().toISOString() };

  try {
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      throw new AIFallbackError('Invalid prompt', 'INVALID_INPUT');
    }

    if (prompt.length > CONFIG.GLOBAL.MAX_PROMPT_LENGTH) {
      throw new AIFallbackError('Prompt exceeds maximum length', 'PROMPT_TOO_LONG');
    }

    // Sanitize input
    const sanitizedPrompt = sanitizeInput(prompt);
    await validatePrompt(sanitizedPrompt);

    // Check cache
    if (useCache) {
      const cacheKey = `ai_fallback:${engine}:${sanitizedPrompt}`;
      const cachedResponse = await cacheManager.get(cacheKey);
      if (cachedResponse) {
        metrics.incrementCounter('cache_hits');
        return {
          response: cachedResponse,
          engineUsed: engine,
          metadata: { ...metadata, cached: true }
        };
      }
    }

    logInfo(`Invoking external AI fallback`, { traceId, engine });

    const fallbackFunc = fallbackEngines[engine];
    if (!fallbackFunc) {
      throw new AIFallbackError(`Unsupported fallback engine: ${engine}`, 'INVALID_ENGINE');
    }

    const response = await fallbackFunc(sanitizedPrompt, traceId);

    // Cache successful response
    if (useCache && response) {
      const cacheKey = `ai_fallback:${engine}:${sanitizedPrompt}`;
      await cacheManager.set(cacheKey, response, CONFIG.GLOBAL.CACHE_TTL);
    }

    metrics.recordLatency('total_request_time', Date.now() - startTime);
    metrics.incrementCounter('successful_requests');

    return {
      response,
      engineUsed: engine,
      metadata: { ...metadata, latency: Date.now() - startTime }
    };

  } catch (error) {
    metrics.incrementCounter('failed_requests');
    
    emitSecurityEvent(SECURITY_EVENTS.AI_FALLBACK_QUERY_FAILED, {
      traceId,
      engine,
      error: error.message,
      code: error.code
    });

    logError(`AI fallback query failed`, { error, traceId, engine });

    // Attempt to use next available engine if primary fails
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      const backupEngine = engine === 'openai' ? 'anthropic' : 'openai';
      logWarn(`Attempting backup engine: ${backupEngine}`, { traceId });
      
      return invokeFallbackAI({
        prompt,
        engine: backupEngine,
        traceId,
        useCache
      });
    }

    throw handleAPIError(error, 'AI fallback query failed');
  }
};

export default {
  invokeFallbackAI,
  CONFIG,
  AIFallbackError
};
