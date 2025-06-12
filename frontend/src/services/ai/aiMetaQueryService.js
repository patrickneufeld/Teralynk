// ✅ FILE: /frontend/src/services/ai/aiMetaQueryService.js

import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { sessionContext } from '@/utils/sessionManager';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';
import { logInfo, logError } from '@/utils/logging/logging';
import { invokeFallbackAI } from './aiFallbackRouter';
import { RateLimiter } from '@/utils/RateLimiter';
import { CircuitBreaker } from '@/utils/CircuitBreaker';
import { MetricsCollector } from '@/utils/metrics/MetricsCollector';

// Configuration
const CONFIG = {
  AI_ENGINES: {
    openai: 'gpt-4',
    anthropic: 'claude-3-sonnet',
    bedrock: 'bedrock-mixtral',
  },
  RATE_LIMITS: {
    QUERIES_PER_MINUTE: 100,
    MAX_RETRIES: 3,
    BACKOFF_MS: 1000
  },
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 0.5,    // 50% failure rate
    RESET_TIMEOUT: 60000,      // 1 minute
    HALF_OPEN_REQUESTS: 3
  },
  TIMEOUTS: {
    REQUEST: 30000,            // 30 seconds
    CACHE: 300000             // 5 minutes
  }
};

// Initialize infrastructure
const metrics = new MetricsCollector('ai_meta_query');
const rateLimiter = new RateLimiter(CONFIG.RATE_LIMITS.QUERIES_PER_MINUTE);
const circuitBreaker = new CircuitBreaker(
  CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
  CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT
);

class MetaQueryError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'MetaQueryError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Internal: prepare trace-aware headers
 */
const buildHeaders = async (traceId) => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
    'X-Session-ID': sessionContext.getSessionId(),
    'X-Client-Version': import.meta.env.VITE_APP_VERSION || 'dev',
    'X-Request-Time': new Date().toISOString()
  };
};

/**
 * Validate query parameters and context
 */
const validateQueryParams = (params) => {
  if (!params.prompt || typeof params.prompt !== 'string') {
    throw new MetaQueryError('Invalid prompt format', 'INVALID_PROMPT');
  }

  if (params.prompt.length > 4096) {
    throw new MetaQueryError('Prompt exceeds maximum length', 'PROMPT_TOO_LONG');
  }

  if (params.engine && !CONFIG.AI_ENGINES[params.engine]) {
    throw new MetaQueryError(`Unsupported engine: ${params.engine}`, 'INVALID_ENGINE');
  }

  return true;
};

/**
 * 🔍 Query external LLM-based AI to answer a meta-level optimization or logic request
 */
const query = async ({
  engine = 'openai',
  prompt,
  traceId = getTraceId(),
  retries = CONFIG.RATE_LIMITS.MAX_RETRIES,
  fallback = true,
  context = {},
  timeout = CONFIG.TIMEOUTS.REQUEST
}) => {
  const startTime = Date.now();
  const queryContext = { engine, traceId, prompt: prompt.substring(0, 100) + '...' };

  try {
    // Validation
    validateQueryParams({ engine, prompt });
    await rateLimiter.checkLimit();

    if (!circuitBreaker.isAvailable()) {
      throw new MetaQueryError('Service temporarily unavailable', 'CIRCUIT_OPEN');
    }

    // Prepare request
    const headers = await buildHeaders(traceId);
    const engineLabel = CONFIG.AI_ENGINES[engine] || engine;

    // Execute query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await invokeFallbackAI({
        prompt,
        engine: engineLabel,
        traceId,
        metadata: {
          context,
          source: 'meta-query',
          clientVersion: import.meta.env.VITE_APP_VERSION
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response || !response.response) {
        throw new MetaQueryError(`Empty response from AI engine: ${engineLabel}`, 'EMPTY_RESPONSE');
      }

      // Record success metrics
      metrics.recordLatency('query_time', Date.now() - startTime);
      metrics.incrementCounter('successful_queries');
      circuitBreaker.recordSuccess();

      logInfo('AI Meta Query Success', {
        ...queryContext,
        duration: Date.now() - startTime
      });

      return {
        recommendation: response.response,
        engineUsed: response.engineUsed,
        metadata: {
          ...response.metadata,
          queryTime: Date.now() - startTime,
          engine: engineLabel
        }
      };

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    metrics.incrementCounter('failed_queries');
    circuitBreaker.recordFailure();

    const errorContext = {
      ...queryContext,
      error: error.message,
      duration: Date.now() - startTime
    };

    logError('AI Meta Query Failed', errorContext);

    emitSecurityEvent(SECURITY_EVENTS.AI_EXTERNAL_QUERY_FAILED, errorContext);

    // Attempt fallback if enabled
    if (fallback && retries > 0) {
      logInfo(`Retrying meta-query with fallback engine after failure on ${engine}`, errorContext);
      
      const fallbackEngine = Object.keys(CONFIG.AI_ENGINES)
        .find(e => e !== engine) || 'openai';

      // Add exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, CONFIG.RATE_LIMITS.BACKOFF_MS * (CONFIG.RATE_LIMITS.MAX_RETRIES - retries + 1))
      );

      return query({
        engine: fallbackEngine,
        prompt,
        traceId,
        retries: retries - 1,
        fallback: false,
        context,
        timeout
      });
    }

    throw new MetaQueryError(
      `Meta-query failed using ${engine}`,
      error.code || 'QUERY_FAILED',
      errorContext
    );
  }
};

/**
 * Get current service health metrics
 */
const getServiceHealth = () => ({
  circuitBreakerStatus: circuitBreaker.getStatus(),
  rateLimiterStatus: rateLimiter.getStatus(),
  metrics: metrics.getMetrics(),
  config: {
    engines: Object.keys(CONFIG.AI_ENGINES),
    limits: CONFIG.RATE_LIMITS,
    timeouts: CONFIG.TIMEOUTS
  }
});

// Create the service object
const metaQueryService = {
  query,
  getServiceHealth,
  CONFIG
};

// Export default only
export default metaQueryService;
