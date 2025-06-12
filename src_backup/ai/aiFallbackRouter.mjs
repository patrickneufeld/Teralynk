// ✅ FILE: /backend/src/ai/aiFallbackRouter.js

import { queryOpenAI } from './aiIntegrationAPI.mjs';
import { queryClaude } from './aiProviderManager.mjs';
import { queryBedrock } from './aiPlatformIntegrationManager.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { logError, logInfo, logWarn } from '../utils/logger.mjs';
import { v4 as uuidv4 } from 'uuid';

const PLATFORM_HEALTH = {
  openai: { failures: 0, lastUsed: 0 },
  claude: { failures: 0, lastUsed: 0 },
  bedrock: { failures: 0, lastUsed: 0 },
};

const MAX_RETRIES = 3;
const COOLDOWN_MS = 60_000; // 1 minute cooldown

function getPlatformOrder(preferred) {
  const now = Date.now();
  const sorted = Object.entries(PLATFORM_HEALTH)
    .filter(([_, status]) => now - status.lastUsed > COOLDOWN_MS || status.failures < MAX_RETRIES)
    .sort((a, b) => a[1].failures - b[1].failures)
    .map(([platform]) => platform);

  if (!sorted.includes(preferred)) sorted.unshift(preferred);
  return [...new Set(sorted)];
}

async function dispatchToProvider(platform, query, traceId) {
  if (platform === 'openai') return await queryOpenAI(query, traceId);
  if (platform === 'claude') return await queryClaude(query, traceId);
  if (platform === 'bedrock') return await queryBedrock(query, traceId);
  throw new Error(`Unsupported platform: ${platform}`);
}

export async function routeAIQuery({ query, platform, userId, traceId = uuidv4() }) {
  const tried = [];
  const fallbackTrace = [];

  const platforms = getPlatformOrder(platform);

  for (const provider of platforms) {
    tried.push(provider);

    try {
      const result = await dispatchToProvider(provider, query, traceId);
      PLATFORM_HEALTH[provider].failures = 0;
      PLATFORM_HEALTH[provider].lastUsed = Date.now();

      await recordEventTelemetry('ai_query_dispatched', {
        userId,
        platform: provider,
        traceId,
        query,
        result,
        fallbackChain: fallbackTrace,
      });

      logInfo(`✅ AI query resolved via ${provider}`);
      return { platform: provider, result, traceId, fallbackChain: fallbackTrace };
    } catch (err) {
      PLATFORM_HEALTH[provider].failures += 1;
      fallbackTrace.push({
        platform: provider,
        error: err.message,
        timestamp: new Date().toISOString(),
      });

      logWarn(`⚠️ ${provider.toUpperCase()} failed`, { traceId, error: err.message });
      await recordEventTelemetry('ai_query_failed', {
        userId,
        traceId,
        platform: provider,
        error: err.message,
      });
    }
  }

  logError('❌ All AI platforms failed', { traceId, userId, query, tried, fallbackTrace });

  throw new Error(`AI Query failed across all platforms. Trace ID: ${traceId}`);
}

// ✅ Define and export fallback-specific function for internal use
export async function invokeFallbackAI(query, userId, traceId = uuidv4()) {
  return await routeAIQuery({ query, platform: 'openai', userId, traceId });
}
