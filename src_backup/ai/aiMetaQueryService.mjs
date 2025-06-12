// File: /backend/src/ai/aiMetaQueryService.js

import db from '../config/db.mjs';
import crypto from 'crypto';
import { logInfo, logError } from '../utils/logger.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import {
  queryInsightsByContext,
  queryInsightsByType,
  queryByTraceId,
  loadInsightMemory,
  persistInsight
} from './aiSelfLearningCore.mjs';

const META_QUERY_TABLE = 'ai_meta_queries';

function generateQueryHash(queryObj) {
  try {
    const stableJson = JSON.stringify(queryObj, Object.keys(queryObj).sort());
    return crypto.createHash('sha256').update(stableJson).digest('hex');
  } catch (error) {
    logError('🔐 Failed to generate query hash.', error);
    throw new Error('Query hash generation failed.');
  }
}

async function recordMetaQuery(source, query, context = 'unspecified') {
  const queryHash = generateQueryHash(query);
  const timestamp = new Date().toISOString();

  try {
    await db.query(
      `INSERT INTO ${META_QUERY_TABLE}
        (query_hash, source, context, query_payload, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (query_hash) DO NOTHING`,
      [queryHash, source, context, JSON.stringify(query), timestamp]
    );

    logInfo(`📊 MetaQuery recorded [${source}]`, { context, queryHash });

    await recordEventTelemetry('meta_query_recorded', {
      source,
      context,
      queryHash,
    });
  } catch (error) {
    logError('❌ Failed to record meta-query', error);
    throw new Error('Meta query recording failed.');
  }
}

async function advancedQuery({ engine, prompt, options = {}, context = {} }) {
  const queryStartTime = Date.now();
  const queryId = crypto.randomUUID();

  try {
    logInfo('Executing advanced query', { engine, queryId, context });

    await recordMetaQuery('advanced_query', {
      engine,
      queryId,
      context,
      options
    });

    const result = await Promise.race([
      executeEngineQuery(engine, prompt, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), options.timeout || 30000)
      )
    ]);

    const processedResult = await processQueryResponse(result, {
      engine,
      prompt,
      options,
      context
    });

    await recordEventTelemetry('advanced_query_success', {
      queryId,
      engine,
      duration: Date.now() - queryStartTime,
      context
    });

    return {
      ...processedResult,
      queryId,
      engine,
      latency: Date.now() - queryStartTime
    };
  } catch (error) {
    logError('Advanced query failed', { error, queryId, engine, context });

    await recordEventTelemetry('advanced_query_failure', {
      queryId,
      engine,
      error: error.message,
      duration: Date.now() - queryStartTime,
      context
    });

    throw new Error(`Query execution failed: ${error.message}`);
  }
}

async function executeEngineQuery(engine, prompt, options) {
  switch (engine) {
    case 'anthropic-claude-3':
      return await import('./aiProviderManager.js').then(mod => mod.queryClaude(prompt, options));
    case 'gpt-4':
      return await import('./aiIntegrationAPI.js').then(mod => mod.queryOpenAI(prompt, options));
    default:
      throw new Error(`Unsupported engine: ${engine}`);
  }
}

async function processQueryResponse(result, context) {
  return {
    result,
    confidence: calculateConfidence(result),
    quality: assessResponseQuality(result),
    metadata: extractResponseMetadata(result)
  };
}

function calculateConfidence(result) {
  return result?.confidence || 0.8;
}

function assessResponseQuality(result) {
  return result?.quality || 'high';
}

function extractResponseMetadata(result) {
  return {
    length: JSON.stringify(result).length,
    timestamp: new Date().toISOString()
  };
}

async function fetchRecentMetaQueries({ source, context, limit = 50 } = {}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (source) {
    conditions.push(`source = $${idx++}`);
    values.push(source);
  }

  if (context) {
    conditions.push(`context = $${idx++}`);
    values.push(context);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT * FROM ${META_QUERY_TABLE}
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${idx}
  `;
  values.push(limit);

  try {
    const result = await db.query(query, values);
    return result.rows;
  } catch (err) {
    logError('❌ Failed to fetch recent meta queries.', err);
    throw new Error('Failed to retrieve recent meta queries.');
  }
}

function diffMetaQueries(queryA, queryB) {
  const delta = {};
  const allKeys = new Set([...Object.keys(queryA), ...Object.keys(queryB)]);

  for (const key of allKeys) {
    const aVal = JSON.stringify(queryA[key]);
    const bVal = JSON.stringify(queryB[key]);
    if (aVal !== bVal) {
      delta[key] = { from: queryA[key], to: queryB[key] };
    }
  }

  return {
    delta,
    isDifferent: Object.keys(delta).length > 0
  };
}

function extractInsightFromMetaQuery(metaQuery) {
  if (!metaQuery || typeof metaQuery !== 'object') {
    throw new Error('Invalid metaQuery input');
  }

  const { query_payload: query, source, context, response, metrics } = metaQuery;

  return {
    type: 'meta',
    content: {
      query,
      context,
      source,
      feedbackLoop: !!response,
      metrics: metrics || {},
      createdAt: Date.now()
    }
  };
}

async function injectMetaQueryInsight(metaQuery) {
  try {
    const insight = extractInsightFromMetaQuery(metaQuery);
    await persistInsight(insight);
    logInfo('🧠 Meta query injected into insight memory.', {
      context: metaQuery?.context
    });
  } catch (err) {
    logError('❌ Failed to inject meta query insight.', err);
  }
}

async function summarizeTrendingContexts() {
  try {
    const memory = await loadInsightMemory();
    const contextMap = {};

    memory
      .filter(entry => entry.type === 'meta' && entry.content?.context)
      .forEach(entry => {
        const ctx = entry.content.context;
        contextMap[ctx] = (contextMap[ctx] || 0) + 1;
      });

    return Object.fromEntries(
      Object.entries(contextMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );
  } catch (err) {
    logError('❌ Failed to summarize trending contexts.', err);
    return {};
  }
}

function inferDominantIntent(queries) {
  if (!Array.isArray(queries) || queries.length === 0) return 'unspecified';

  const frequency = {};
  queries.forEach(q => {
    const tokens = q.toLowerCase().split(/\W+/).filter(Boolean);
    tokens.forEach(token => {
      frequency[token] = (frequency[token] || 0) + 1;
    });
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token)
    .join(' ');
}

function generateQueryFingerprint(query) {
  const structure = {
    keys: Object.keys(query).sort(),
    hasContext: !!query.context,
    hasMetrics: !!query.metrics,
    length: JSON.stringify(query).length
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(structure))
    .digest('hex');
}

const metaQueryService = {
  advancedQuery,
  recordMetaQuery,
  fetchRecentMetaQueries,
  diffMetaQueries,
  generateQueryHash,
  extractInsightFromMetaQuery,
  injectMetaQueryInsight,
  queryInsightsByContext,
  queryInsightsByType,
  queryByTraceId,
  summarizeTrendingContexts,
  inferDominantIntent,
  generateQueryFingerprint
};

export default metaQueryService;

export {
  metaQueryService,
  advancedQuery,
  recordMetaQuery,
  fetchRecentMetaQueries,
  diffMetaQueries,
  generateQueryHash,
  extractInsightFromMetaQuery,
  injectMetaQueryInsight,
  summarizeTrendingContexts,
  inferDominantIntent,
  generateQueryFingerprint
};
