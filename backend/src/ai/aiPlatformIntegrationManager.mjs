import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiPlatformIntegrationManager.js

import axios from 'axios';
import { logInfo, logError } from '../utils/logger.mjs';
import { recordEventTelemetry } from '../monitoring/telemetry.mjs';
import { createError } from '../utils/errorManager.mjs';

class PlatformIntegrationManager {
  constructor() {
    this.platforms = new Map();
    this.activeConnections = new Set();
  }

  registerPlatform(platformId, config) {
    try {
      if (this.platforms.has(platformId)) {
        throw new Error(`Platform ${platformId} already registered`);
      }

      this.platforms.set(platformId, {
        id: platformId,
        config,
        status: 'initialized',
        lastChecked: Date.now(),
      });

      logInfo(`🔌 Platform registered: ${platformId}`);
    } catch (error) {
      logError(`❌ Failed to register platform: ${platformId}`, { error });
      throw error;
    }
  }

  getPlatformConfig(platformId) {
    return this.platforms.get(platformId)?.config || null;
  }

  isPlatformAvailable(platformId) {
    const platform = this.platforms.get(platformId);
    return platform?.status === 'initialized';
  }

  async connectToPlatform(platformId) {
    try {
      if (!this.platforms.has(platformId)) {
        throw new Error(`Platform ${platformId} not registered`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      this.activeConnections.add(platformId);

      logInfo(`🔗 Connected to platform: ${platformId}`);
      return true;
    } catch (error) {
      logError(`❌ Failed to connect to platform: ${platformId}`, { error });
      return false;
    }
  }

  disconnectFromPlatform(platformId) {
    if (this.activeConnections.has(platformId)) {
      this.activeConnections.delete(platformId);
      logInfo(`🔌 Disconnected from platform: ${platformId}`);
    }
  }

  getRegisteredPlatforms() {
    return Array.from(this.platforms.keys());
  }

  getActiveConnections() {
    return Array.from(this.activeConnections);
  }

  updatePlatformConfig(platformId, newConfig) {
    if (!this.platforms.has(platformId)) {
      throw new Error(`Platform ${platformId} not registered`);
    }

    const platform = this.platforms.get(platformId);
    this.platforms.set(platformId, {
      ...platform,
      config: { ...platform.config, ...newConfig },
      lastUpdated: Date.now(),
    });

    logInfo(`⚙️ Updated config for platform: ${platformId}`);
  }
}

// ==============================
// ✅ AI Query Functions Section
// ==============================

const defaultHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

async function queryOpenAI(payload, apiKey, traceId = 'no-trace') {
  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      payload,
      { headers: defaultHeaders(apiKey) }
    );

    recordEventTelemetry('AI_QUERY_SUCCESS', {
      provider: 'openai',
      traceId,
      model: payload.model,
      tokensUsed: res.data.usage?.total_tokens,
    });

    return res.data;
  } catch (err) {
    recordEventTelemetry('AI_QUERY_FAILURE', {
      provider: 'openai',
      traceId,
      error: err.message,
    });
    throw createError('Failed to query OpenAI', 502, 'aiPlatformIntegrationManager', 'high', { traceId });
  }
}

async function queryClaude(payload, apiKey, traceId = 'no-trace') {
  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      payload,
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    recordEventTelemetry('AI_QUERY_SUCCESS', {
      provider: 'anthropic',
      traceId,
      model: payload.model,
    });

    return res.data;
  } catch (err) {
    recordEventTelemetry('AI_QUERY_FAILURE', {
      provider: 'anthropic',
      traceId,
      error: err.message,
    });
    throw createError('Failed to query Claude', 502, 'aiPlatformIntegrationManager', 'high', { traceId });
  }
}

async function queryBedrock(payload, apiKey, traceId = 'no-trace') {
  try {
    const res = await axios.post(
      'https://bedrock.amazonaws.com/agent-runtime/invoke',
      payload,
      { headers: defaultHeaders(apiKey) }
    );

    recordEventTelemetry('AI_QUERY_SUCCESS', {
      provider: 'bedrock',
      traceId,
      model: payload?.modelId,
    });

    return res.data;
  } catch (err) {
    recordEventTelemetry('AI_QUERY_FAILURE', {
      provider: 'bedrock',
      traceId,
      error: err.message,
    });
    throw createError('Failed to query Bedrock', 502, 'aiPlatformIntegrationManager', 'high', { traceId });
  }
}

// ==============================
// ✅ Export Interface
// ==============================

const platformManager = new PlatformIntegrationManager();

export default platformManager;
export {
  PlatformIntegrationManager,
  queryOpenAI,
  queryClaude,
  queryBedrock,
};
