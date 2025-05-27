// ✅ FILE: /frontend/src/services/ai/aiPatchEngine.js

import apiClient from '@/api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { logInfo, logError } from '@/utils/logging/logging';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { sessionContext } from '@/utils/sessionManager';
import { invokeFallbackAI } from './aiFallbackRouter';

const PATCH_ENGINE_BASE = '/api/ai/patch-engine';

/**
 * Build secure headers with trace, token, and session context
 */
const buildHeaders = async (traceId = getTraceId()) => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
    'X-Session-ID': sessionContext.getSessionId(),
    'X-User-Agent': sessionContext.getUserAgent() || 'unknown',
  };
};

/**
 * Evaluate code module performance, logic flaws, or performance drops.
 * Optionally auto-patch if safe.
 */
const evaluateAndPatch = async ({
  moduleName,
  reason = 'self_check',
  context = 'ai_module',
  autoPatch = true,
  fallback = true,
} = {}) => {
  const traceId = getTraceId();

  try {
    const headers = await buildHeaders(traceId);
    const payload = {
      moduleName,
      reason,
      context,
      autoPatch,
      traceId,
    };

    const response = await apiClient.post(`${PATCH_ENGINE_BASE}/evaluate`, payload, { headers });

    if (response?.data?.updated) {
      logInfo(`[🩹 AI Patch Applied] ${moduleName}`, response.data);
    } else {
      logInfo(`[✅ No Patch Needed] ${moduleName} is already optimal.`);
    }

    return {
      updated: response.data?.updated || false,
      patch: response.data?.patch || null,
      diagnostics: response.data?.diagnostics || {},
      traceId,
    };
  } catch (error) {
    logError(`[❌ Patch Evaluation Failed] ${moduleName}`, error);

    emitSecurityEvent(SECURITY_EVENTS.AI_PATCHING_FAILED, {
      module: moduleName,
      reason,
      context,
      traceId,
      error,
    });

    // 🔄 Fallback to external AI if enabled
    if (fallback) {
      try {
        const fallbackResponse = await invokeFallbackAI({
          question: `How should I patch module "${moduleName}" due to reason "${reason}"?`,
          traceId,
          context,
        });

        return {
          updated: false,
          diagnostics: {},
          fallbackUsed: true,
          fallbackPatch: fallbackResponse.answer || 'No fallback patch found.',
          traceId,
        };
      } catch (fallbackError) {
        logError(`Fallback AI failed during patching`, fallbackError);
        throw new Error(`Patch failed and fallback AI could not provide solution.`);
      }
    }

    throw error;
  }
};

// Export both as named export and as part of the service object
export { evaluateAndPatch };

// Export the service object with all functions
export const aiPatchEngine = {
  evaluateAndPatch,
  PATCH_ENGINE_BASE
};

// Default export for backward compatibility
export default aiPatchEngine;
