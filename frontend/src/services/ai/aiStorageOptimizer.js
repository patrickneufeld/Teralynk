// ✅ FILE: /frontend/src/services/ai/aiStorageOptimizer.js

import apiClient from '../../api/apiClient'; // ← adjusts the relative path correctly
import tokenManager from '@/utils/tokenManager';  // Changed from named import
import { getTraceId } from '@/utils/logger';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { logInfo, logError, logWarn } from '@/utils/logging/logging';
import { invokeFallbackAI } from '@/services/ai/aiFallbackRouter';
import { sessionContext } from '@/utils/sessionManager';
import aiPatchEngine from './aiPatchEngine';
import aiSelfLearningCore from './aiSelfLearningCore';
import aiMetaQueryService from './aiMetaQueryService';

const BASE_URL = '/api/ai/storage-optimizer';

// Update the buildHeaders function to use tokenManager.getToken
const buildHeaders = async (traceId = getTraceId()) => {
  const token = await tokenManager.getToken();  // Changed from getAccessToken
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Trace-Id': traceId,
    'X-Session-ID': sessionContext.getSessionId(),
    'X-User-Context': sessionContext.getUserAgent() || 'unknown',
  };
};

// ... rest of the file stays exactly the same ...


/**
 * 📈 Self-Learning Telemetry Recorder
 */
const recordOptimizationTelemetry = async (actionContext) => {
  try {
    const headers = await buildHeaders(actionContext.traceId);
    await apiClient.post(`${BASE_URL}/telemetry`, actionContext, { headers });
  } catch (error) {
    logError("Telemetry record failed", error);
  }
};

/**
 * 🧠 Run self-improving AI optimization scan
 * Accepts metadata, usage patterns, and previous insight history
 */
export const analyzeFileForOptimization = async (file, { traceId, metadata = {} } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.post(`${BASE_URL}/file`, { fileId: file.id, metadata }, { headers });

    await recordOptimizationTelemetry({
      type: 'optimization_analysis',
      traceId,
      fileId: file.id,
      context: metadata,
      outcome: response.data,
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_STORAGE_OPTIMIZATION_FAILED, {
      traceId,
      fileId: file?.id,
      error,
    });

    // 🆘 Fallback: Ask external AI if available
    const fallbackResponse = await invokeFallbackAI({
      question: `What are possible optimization actions for file type ${file?.type}?`,
      context: metadata,
      traceId,
    });

    return {
      fallbackUsed: true,
      source: 'external-ai',
      ...fallbackResponse,
    };
  }
};

/**
 * 🕓 Schedule file for deferred optimization via AI
 */
export const scheduleOptimization = async (file, { traceId, reason = "default" } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const payload = {
      fileId: file.id,
      reason,
      usageStats: file.usageStats || {},
      metadata: file.metadata || {},
    };

    const response = await apiClient.post(`${BASE_URL}/schedule`, payload, { headers });

    await recordOptimizationTelemetry({
      type: 'optimization_scheduled',
      traceId,
      fileId: file.id,
      reason,
      outcome: response.data,
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_STORAGE_SCHEDULE_FAILED, {
      traceId,
      fileId: file.id,
      reason,
      error,
    });

    throw handleAPIError(error, 'Scheduling optimization failed');
  }
};

/**
 * 📌 Check current optimization status of a file
 */
export const checkOptimizationStatus = async (file, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/status/${file.id}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_STORAGE_STATUS_FAILED, {
      traceId,
      fileId: file.id,
      error,
    });

    throw handleAPIError(error, 'Failed to fetch optimization status');
  }
};

/**
 * 🧪 Submit optimization outcome for feedback learning
 */
export const submitOptimizationFeedback = async (fileId, feedback, { traceId, userId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const payload = {
      feedback,
      userId,
      fileId,
      submittedAt: new Date().toISOString(),
    };

    const response = await apiClient.post(`${BASE_URL}/feedback/${fileId}`, payload, { headers });

    await recordOptimizationTelemetry({
      type: 'optimization_feedback',
      traceId,
      fileId,
      feedback,
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_OPTIMIZATION_FEEDBACK_FAILED, {
      traceId,
      fileId,
      error,
    });

    throw handleAPIError(error, 'Failed to submit optimization feedback');
  }
};

/**
 * ❌ Cancel scheduled optimizations for a file
 */
export const cancelOptimizations = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.delete(`${BASE_URL}/cancel/${fileId}`, { headers });

    await recordOptimizationTelemetry({
      type: 'optimization_cancelled',
      traceId,
      fileId,
    });

    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_STORAGE_CANCEL_FAILED, {
      traceId,
      fileId,
      error,
    });

    throw handleAPIError(error, 'Failed to cancel optimizations');
  }
};

/**
 * 🧠 Adaptive Self-Learning from Global Optimization Patterns
 */
export const detectAndLearnFromPatterns = async ({ userId, orgId, traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/patterns/global`, { headers });

    const learnedPatterns = response.data.patterns || [];
    await aiSelfLearningCore.ingestPatterns(learnedPatterns, {
      source: 'optimizer',
      traceId,
      userId,
      orgId,
    });

    return learnedPatterns;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_PATTERN_LEARNING_FAILED, {
      traceId,
      userId,
      error,
    });

    throw handleAPIError(error, 'Pattern learning failed');
  }
};

/**
 * 🛠️ Self-Patching Optimizer AI (calls aiPatchEngine to rewrite itself)
 */
export const selfPatchOptimizer = async ({ reason = "performance_drop", context = "optimizer" } = {}) => {
  try {
    const patchReport = await aiPatchEngine.evaluateAndPatch({
      moduleName: 'aiStorageOptimizer',
      reason,
      context,
    });

    if (patchReport.updated) {
      logInfo('aiStorageOptimizer self-patched successfully', patchReport);
    } else {
      logInfo('No patch applied. Optimizer is already optimal.');
    }

    return patchReport;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_PATCHING_FAILED, {
      module: 'aiStorageOptimizer',
      reason,
      error,
    });

    throw handleAPIError(error, 'Self-patching optimizer failed');
  }
};

/**
 * 🤖 Ask an external AI platform when optimization logic fails locally
 */
export const escalateToExternalAI = async (fileContext, { traceId, fallbackEngine = 'anthropic' } = {}) => {
  try {
    const result = await aiMetaQueryService.query({
      engine: fallbackEngine,
      prompt: `Given this file context, how should we optimize storage? ${JSON.stringify(fileContext)}`,
      traceId,
    });

    return result.recommendation || "No recommendation returned.";
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_EXTERNAL_QUERY_FAILED, {
      engine: fallbackEngine,
      traceId,
      fileContext,
      error,
    });

    throw handleAPIError(error, 'Failed to query external AI for optimization logic');
  }
};

// Export all functions as a service object
const aiStorageOptimizer = {
  analyzeFileForOptimization,
  scheduleOptimization,
  checkOptimizationStatus,
  submitOptimizationFeedback,
  cancelOptimizations,
  detectAndLearnFromPatterns,
  selfPatchOptimizer,
  escalateToExternalAI
};

export default aiStorageOptimizer;
