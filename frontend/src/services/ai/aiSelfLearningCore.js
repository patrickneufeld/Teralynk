// ================================================
// ✅ FILE: /frontend/src/services/ai/aiSelfLearningCore.js
// ✅ Part 1 of 2
// ================================================

import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { logInfo, logWarn, logError } from '@/utils/logging/logging';
import apiClient from '@/api/apiClient';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { RateLimiter } from '@/utils/RateLimiter';
import { CircuitBreaker } from '@/utils/CircuitBreaker';
import { MetricsCollector } from '@/utils/metrics/MetricsCollector';
import { cacheManager } from '@/utils/cache/CacheManager';

// Configuration constants
const CONFIG = {
  BASE_URL: '/api/ai/self-learning',
  BATCH: { MAX_PATTERNS: 10000, CHUNK_SIZE: 1000, PARALLEL_CHUNKS: 5 },
  RATE_LIMITS: { INGEST: 1000, REINFORCE: 100, ADAPT: 50, RELOAD: 5 },
  TIMEOUTS: { INGEST: 30000, REINFORCE: 15000, ADAPT: 20000, RELOAD: 60000 },
  CACHE: { KNOWLEDGE_TTL: 300, PATTERN_TTL: 60 },
  CIRCUIT_BREAKER: { FAILURE_THRESHOLD: 0.3, RESET_TIMEOUT: 60000, HALF_OPEN_REQUESTS: 3 },
  SECURITY: { MAX_RETRIES: 3, BACKOFF_MS: 1000, REQUIRED_FIELDS: ['userId', 'orgId'] }
};

// Infrastructure Instances
const metrics = new MetricsCollector('ai_self_learning');
const rateLimiters = {
  ingest: new RateLimiter(CONFIG.RATE_LIMITS.INGEST),
  reinforce: new RateLimiter(CONFIG.RATE_LIMITS.REINFORCE),
  adapt: new RateLimiter(CONFIG.RATE_LIMITS.ADAPT),
  reload: new RateLimiter(CONFIG.RATE_LIMITS.RELOAD)
};
const circuitBreakers = {
  ingest: new CircuitBreaker(CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD, CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT),
  reinforce: new CircuitBreaker(CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD, CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT),
  adapt: new CircuitBreaker(CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD, CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT),
  reload: new CircuitBreaker(CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD, CONFIG.CIRCUIT_BREAKER.RESET_TIMEOUT)
};

// Custom Error Class
class SelfLearningError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'SelfLearningError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

// Header Builder
const buildHeaders = async (options = {}) => {
  const token = await getAccessToken();
  const traceId = options.traceId || getTraceId();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
    'X-Request-Time': new Date().toISOString(),
    'X-Client-Version': import.meta.env.VITE_APP_VERSION || 'dev'
  };
  if (options.userId) headers['X-User-ID'] = options.userId;
  if (options.orgId) headers['X-Org-ID'] = options.orgId;
  if (options.contextId) headers['X-Context-ID'] = options.contextId;
  return headers;
};

// Context Validator
const validateContext = async (options) => {
  const missing = CONFIG.SECURITY.REQUIRED_FIELDS.filter(field => !options[field]);
  if (missing.length > 0) {
    throw new SelfLearningError(`Missing required fields: ${missing.join(', ')}`, 'INVALID_CONTEXT');
  }
  return true;
};

// Chunk Processing
const processPatternChunks = async (patterns, options) => {
  const chunks = [];
  for (let i = 0; i < patterns.length; i += CONFIG.BATCH.CHUNK_SIZE) {
    chunks.push(patterns.slice(i, i + CONFIG.BATCH.CHUNK_SIZE));
  }

  const results = [];
  for (let i = 0; i < chunks.length; i += CONFIG.BATCH.PARALLEL_CHUNKS) {
    const batch = chunks.slice(i, i + CONFIG.BATCH.PARALLEL_CHUNKS);
    const batchResults = await Promise.all(
      batch.map((chunk, index) =>
        ingestPatternChunk(chunk, { ...options, chunkId: i + index, totalChunks: chunks.length })
      )
    );
    results.push(...batchResults);
    metrics.recordLatency('batch_processing_time', Date.now() - options.startTime);
  }
  return results;
};

// Single Chunk Ingestion
const ingestPatternChunk = async (patterns, options) => {
  const headers = await buildHeaders(options);
  const response = await apiClient.post(`${CONFIG.BASE_URL}/ingest`, {
    patterns,
    meta: {
      source: options.source,
      count: patterns.length,
      ingestAt: new Date().toISOString(),
      chunkId: options.chunkId,
      totalChunks: options.totalChunks
    }
  }, { headers, timeout: CONFIG.TIMEOUTS.INGEST });
  return response.data;
};

// Pattern Ingestion Entry Point
const ingestPatterns = async (patterns = [], options = {}) => {
  const startTime = Date.now();
  const traceId = options.traceId || getTraceId();
  try {
    if (!Array.isArray(patterns)) {
      throw new SelfLearningError('Invalid patterns format', 'INVALID_FORMAT');
    }
    if (patterns.length > CONFIG.BATCH.MAX_PATTERNS) {
      throw new SelfLearningError('Pattern batch too large', 'BATCH_TOO_LARGE');
    }

    await validateContext(options);
    await rateLimiters.ingest.checkLimit();
    if (!circuitBreakers.ingest.isAvailable()) {
      throw new SelfLearningError('Service temporarily unavailable', 'CIRCUIT_OPEN');
    }

    const results = await processPatternChunks(patterns, { ...options, startTime, traceId });
    metrics.recordLatency('total_ingest_time', Date.now() - startTime);
    metrics.incrementCounter('patterns_ingested', patterns.length);
    circuitBreakers.ingest.recordSuccess();

    logInfo('Self-learning patterns ingested successfully', { count: patterns.length, source: options.source, duration: Date.now() - startTime });
    return results;
  } catch (error) {
    metrics.incrementCounter('ingest_failures');
    circuitBreakers.ingest.recordFailure();
    const errorContext = { traceId, error: error.message, patternCount: patterns?.length, duration: Date.now() - startTime };
    logError('Pattern ingestion failed', errorContext);
    emitSecurityEvent(SECURITY_EVENTS.AI_PATTERN_INGEST_FAILED, errorContext);
    throw new SelfLearningError('Pattern ingestion failed', error.code || 'INGEST_FAILED', errorContext);
  }
};

// ✅ Part 1 of 2 Complete — Proceeding with Part 2 (Remaining Methods and Export)
// ================================================
// ✅ FILE: /frontend/src/services/ai/aiSelfLearningCore.js
// ✅ Part 2 of 2
// ================================================

/**
 * 📈 Reinforce model confidence by comparing prediction accuracy
 */
const reinforceLearning = async (options = {}) => {
  const startTime = Date.now();
  const traceId = options.traceId || getTraceId();
  try {
    await validateContext(options);
    await rateLimiters.reinforce.checkLimit();
    if (!circuitBreakers.reinforce.isAvailable()) {
      throw new SelfLearningError('Service temporarily unavailable', 'CIRCUIT_OPEN');
    }

    const headers = await buildHeaders({ ...options, traceId });
    const response = await apiClient.post(`${CONFIG.BASE_URL}/reinforce`, {
      outcome: options.outcome,
      feedback: options.feedback,
      reinforcedAt: new Date().toISOString(),
      userId: options.userId,
      context: options.context || {}
    }, { headers, timeout: CONFIG.TIMEOUTS.REINFORCE });

    metrics.recordLatency('reinforce_time', Date.now() - startTime);
    circuitBreakers.reinforce.recordSuccess();
    return response.data;
  } catch (error) {
    metrics.incrementCounter('reinforce_failures');
    circuitBreakers.reinforce.recordFailure();
    const errorContext = { traceId, error: error.message, duration: Date.now() - startTime };
    emitSecurityEvent(SECURITY_EVENTS.AI_REINFORCEMENT_FAILED, errorContext);
    throw new SelfLearningError('Reinforcement learning failed', error.code || 'REINFORCE_FAILED', errorContext);
  }
};

/**
 * ⚡ High-speed adaptation based on deviation deltas
 */
const adaptFastToNewPatterns = async (options = {}) => {
  const startTime = Date.now();
  const traceId = options.traceId || getTraceId();
  try {
    await validateContext(options);
    await rateLimiters.adapt.checkLimit();
    if (!circuitBreakers.adapt.isAvailable()) {
      throw new SelfLearningError('Service temporarily unavailable', 'CIRCUIT_OPEN');
    }

    const headers = await buildHeaders({ ...options, traceId });
    const response = await apiClient.post(`${CONFIG.BASE_URL}/adapt`, {
      anomalies: options.anomalies,
      context: options.context || {},
      timestamp: new Date().toISOString()
    }, { headers, timeout: CONFIG.TIMEOUTS.ADAPT });

    if (response.data?.patched) {
      logWarn('AI model self-adapted based on anomalies', { anomalyCount: options.anomalies?.length || 0, traceId });
    }

    metrics.recordLatency('adaptation_time', Date.now() - startTime);
    circuitBreakers.adapt.recordSuccess();
    return response.data;
  } catch (error) {
    metrics.incrementCounter('adaptation_failures');
    circuitBreakers.adapt.recordFailure();
    const errorContext = { traceId, contextId: options.contextId, error: error.message, duration: Date.now() - startTime };
    emitSecurityEvent(SECURITY_EVENTS.AI_FAST_ADAPTATION_FAILED, errorContext);
    throw new SelfLearningError('Fast adaptation failed', error.code || 'ADAPT_FAILED', errorContext);
  }
};

/**
 * 🔄 Reload latest learning state from knowledge graph
 */
const reloadKnowledgeBase = async (options = {}) => {
  const startTime = Date.now();
  const traceId = options.traceId || getTraceId();
  try {
    await validateContext(options);
    await rateLimiters.reload.checkLimit();
    if (!circuitBreakers.reload.isAvailable()) {
      throw new SelfLearningError('Service temporarily unavailable', 'CIRCUIT_OPEN');
    }

    const cacheKey = 'knowledge_base_state';
    const cachedState = await cacheManager.get(cacheKey);
    if (cachedState) {
      metrics.incrementCounter('cache_hits');
      return cachedState;
    }

    const headers = await buildHeaders({ ...options, traceId });
    const response = await apiClient.get(`${CONFIG.BASE_URL}/knowledge/reload`, { headers, timeout: CONFIG.TIMEOUTS.RELOAD });

    await cacheManager.set(cacheKey, response.data, CONFIG.CACHE.KNOWLEDGE_TTL);
    metrics.recordLatency('reload_time', Date.now() - startTime);
    circuitBreakers.reload.recordSuccess();
    logInfo('Knowledge base reloaded successfully', { traceId, duration: Date.now() - startTime });
    return response.data;
  } catch (error) {
    metrics.incrementCounter('reload_failures');
    circuitBreakers.reload.recordFailure();
    const errorContext = { traceId, error: error.message, duration: Date.now() - startTime };
    emitSecurityEvent(SECURITY_EVENTS.AI_KNOWLEDGE_RELOAD_FAILED, errorContext);
    throw new SelfLearningError('Knowledge reload failed', error.code || 'RELOAD_FAILED', errorContext);
  }
};

/**
 * 🩺 Retrieve current service health and metrics
 */
const getServiceHealth = () => ({
  circuitBreakers: {
    ingest: circuitBreakers.ingest.getStatus(),
    reinforce: circuitBreakers.reinforce.getStatus(),
    adapt: circuitBreakers.adapt.getStatus(),
    reload: circuitBreakers.reload.getStatus()
  },
  rateLimiters: {
    ingest: rateLimiters.ingest.getStatus(),
    reinforce: rateLimiters.reinforce.getStatus(),
    adapt: rateLimiters.adapt.getStatus(),
    reload: rateLimiters.reload.getStatus()
  },
  metrics: metrics.getMetrics(),
  cache: cacheManager.getStats(),
  config: {
    batch: CONFIG.BATCH,
    timeouts: CONFIG.TIMEOUTS,
    rateLimits: CONFIG.RATE_LIMITS
  }
});

// ✅ Final Service Object Export
const aiSelfLearningCore = {
  ingestPatterns,
  reinforceLearning,
  adaptFastToNewPatterns,
  reloadKnowledgeBase,
  getServiceHealth,
  CONFIG
};

export default aiSelfLearningCore;

// ================================================
// ✅ aiSelfLearningCore.js Rewrite Complete
// ================================================
