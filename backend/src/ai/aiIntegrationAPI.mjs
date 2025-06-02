// ✅ FILE: /backend/src/ai/aiIntegrationAPI.js

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from '../utils/logger.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { exponentialBackoff } from '../utils/errorManager.mjs';
import { hasProviderAccess } from '../services/common/rbacService.mjs';
import { validateQueryInput } from './aiIntegration.mjs';

// ✅ Provider configuration registry
const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/completions',
    model: 'gpt-4',
    keyEnv: 'OPENAI_API_KEY',
    headers: (key, traceId) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'x-trace-id': traceId
    }),
    buildPayload: (query) => ({
      model: 'gpt-4',
      prompt: query,
      max_tokens: 600,
      temperature: 0.5
    })
  },
  claude: {
    url: 'https://api.anthropic.com/v1/complete',
    model: 'claude-3-haiku-20240307',
    keyEnv: 'ANTHROPIC_API_KEY',
    headers: (key, traceId) => ({
      'x-api-key': key,
      'Content-Type': 'application/json',
      'x-trace-id': traceId
    }),
    buildPayload: (query) => ({
      model: 'claude-3-haiku-20240307',
      prompt: `\n\nHuman: ${query}\n\nAssistant:`,
      max_tokens_to_sample: 600
    })
  }
};

/**
 * ✅ Unified AI Query Dispatcher
 * @param {Object} options
 * @param {string} options.provider - Provider key (e.g., 'openai', 'claude')
 * @param {string} options.query - User query
 * @param {string} options.userId - Authenticated user ID
 * @param {string} options.traceId - Optional trace ID
 * @param {number} options.retries - Retry attempts
 * @param {number} options.timeoutMs - Request timeout
 */
export async function queryAI({
  provider = 'openai',
  query,
  userId = null,
  traceId = uuidv4(),
  retries = 2,
  timeoutMs = 10000
}) {
  if (!PROVIDERS[provider]) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const config = PROVIDERS[provider];
  const apiKey = process.env[config.keyEnv];

  if (!apiKey) {
    throw new Error(`Missing environment variable for ${provider} API key`);
  }

  if (userId && !(await hasProviderAccess(userId, provider))) {
    await recordEventTelemetry('ai_rbac_denied', { userId, traceId, provider });
    throw new Error(`Access denied for ${provider} per RBAC policy`);
  }

  const sanitizedQuery = validateQueryInput(query);
  const payload = config.buildPayload(sanitizedQuery);
  const headers = config.headers(apiKey, traceId);
  const meta = { traceId, userId, provider, model: config.model };

  const makeRequest = async () => {
    try {
      const res = await axios.post(config.url, payload, { headers, timeout: timeoutMs });

      await recordEventTelemetry('ai_query_success', {
        ...meta,
        response: res.data
      });

      logInfo(`✅ ${provider} responded successfully`, meta);
      return res.data;
    } catch (err) {
      logWarn(`⚠️ ${provider} attempt failed`, { ...meta, error: err.message });
      throw err;
    }
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await makeRequest();
    } catch (error) {
      if (attempt >= retries) {
        await recordEventTelemetry('ai_query_failure', {
          ...meta,
          error: error.message
        });
        logError(`❌ All retries failed for ${provider}`, { ...meta, error: error.message });
        throw new Error(`${provider} AI request failed after ${retries + 1} attempts`);
      }
      await new Promise((r) => setTimeout(r, exponentialBackoff(attempt)));
    }
  }
}

// ✅ Aliased exports for integration with aiFallbackRouter
export const queryOpenAI = async (user, payload, apiKey, traceId) => {
  return await queryAI({ provider: 'openai', query: payload, userId: user.id, traceId });
};

export const queryClaude = async (user, payload, apiKey, traceId) => {
  return await queryAI({ provider: 'claude', query: payload, userId: user.id, traceId });
};
