// File: /frontend/src/services/ai/aiUsageLogger.js

import apiClient from '@/api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { emitSecurityEvent } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';

const BASE_URL = '/api/ai/usage-logger';

/**
 * Builds secure headers for AI telemetry calls
 */
const buildHeaders = async () => {
  const token = await getAccessToken();
  const traceId = getTraceId();
  return {
    Authorization: `Bearer ${token}`,
    'X-Trace-Id': traceId,
    'Content-Type': 'application/json',
  };
};

/**
 * Logs a user action that triggered an AI event.
 * @param {Object} params - Logging payload
 * @param {string} params.action - Description of action (e.g., "analyzed_file", "requested_summary")
 * @param {string} params.context - Context or component name
 * @param {string} [params.userId] - Optional user ID
 * @param {Object} [params.metadata] - Additional context data
 */
export const logAIUsage = async ({ action, context, userId, metadata = {} }) => {
  try {
    const headers = await buildHeaders();
    const payload = {
      action,
      context,
      userId,
      timestamp: new Date().toISOString(),
      metadata
    };

    await apiClient.post(`${BASE_URL}/log`, payload, { headers });
  } catch (error) {
    emitSecurityEvent('AI_USAGE_LOG_FAILED', {
      action,
      context,
      error
    });
    throw handleAPIError(error, 'Failed to log AI usage');
  }
};

/**
 * Fetch usage metrics for current user (optional for analytics panels)
 * @param {string} userId
 */
export const getUserAIUsage = async (userId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/user/${userId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_USAGE_FETCH_FAILED', {
      userId,
      error
    });
    throw handleAPIError(error, 'Failed to fetch AI usage metrics');
  }
};

/**
 * Fetch platform-wide AI usage trends (admin only)
 */
export const getGlobalAIUsageStats = async () => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/stats`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_GLOBAL_USAGE_FETCH_FAILED', { error });
    throw handleAPIError(error, 'Failed to retrieve global AI usage statistics');
  }
};
