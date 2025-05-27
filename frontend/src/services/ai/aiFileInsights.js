// File: /frontend/src/services/ai/aiFileInsights.js

import apiClient from '@/api/apiClient';
import { getTraceId } from '@/utils/telemetry';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';
import { logError, logInfo } from '@/utils/logging/logging';

const BASE_URL = '/api/ai/file-insights';

/**
 * Injects secure headers with token and trace context
 */
const buildHeaders = async (traceId = getTraceId()) => {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'X-Trace-Id': traceId,
    'Content-Type': 'application/json',
  };
};

/**
 * Fetch detailed AI-generated insights for a specific file
 */
export const getFileInsights = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILE_INSIGHT_ERROR, {
      fileId,
      traceId,
      context: 'getFileInsights',
      error,
    });
    throw handleAPIError(error, 'Failed to retrieve AI file insights');
  }
};

/**
 * Fetch AI-generated summary (e.g. tags, sentiment, topics)
 */
export const getAIInsightSummary = async (fileId, { traceId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/summary/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_INSIGHT_SUMMARY_ERROR, {
      fileId,
      traceId,
      context: 'getAIInsightSummary',
      error,
    });
    throw handleAPIError(error, 'Failed to retrieve AI summary insights');
  }
};

/**
 * Submit feedback for reinforcement learning / retraining
 */
export const submitInsightFeedback = async (fileId, feedback, { traceId = getTraceId(), userId } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const payload = {
      ...feedback,
      userId,
      timestamp: new Date().toISOString(),
    };
    const response = await apiClient.post(`${BASE_URL}/feedback/${fileId}`, payload, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_INSIGHT_FEEDBACK_FAILED, {
      fileId,
      traceId,
      context: 'submitInsightFeedback',
      error,
    });
    throw handleAPIError(error, 'Failed to submit AI insight feedback');
  }
};

/**
 * Submit batch analysis request for multiple files
 */
export const batchAnalyzeFiles = async (userId, { sessionId, traceId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.post(
      `${BASE_URL}/batch`,
      { userId, sessionId, traceId },
      { headers }
    );
    return response.data;
  } catch (error) {
    logError("Batch AI Insight Analysis Failed", error);
    emitSecurityEvent(SECURITY_EVENTS.AI_BATCH_INSIGHT_ERROR, {
      userId,
      traceId,
      context: 'batchAnalyzeFiles',
      error,
    });
    throw handleAPIError(error, 'Failed to batch analyze file insights');
  }
};

/**
 * Generate file-level AI insights (post-upload or on demand)
 */
export const generateInsights = async (file, { contextId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(contextId);
    const response = await apiClient.post(
      `${BASE_URL}/generate`,
      { fileId: file.id, contextId, metadata: file.metadata },
      { headers }
    );
    return response.data.insights;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_GENERATE_INSIGHTS_FAILED, {
      fileId: file?.id,
      traceId: contextId,
      context: 'generateInsights',
      error,
    });
    throw handleAPIError(error, 'Failed to generate AI insights for file');
  }
};

/**
 * Generate AI insights immediately after upload
 */
export const generateInitialInsights = async (file, { contextId = getTraceId() } = {}) => {
  try {
    return await generateInsights(file, { contextId });
  } catch (error) {
    logError("Initial insight generation failed", error);
    return [];
  }
};
