// File: /frontend/src/services/ai/aiFileNamingService.js

import apiClient from '@/api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/logger';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';

const BASE_URL = '/api/ai/file-naming';

/**
 * Build headers with secure token and trace context
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
 * Get an AI-generated smart name for a file based on metadata and user role
 */
export const getSmartFilename = async (fileMetadata, options = {}) => {
  const { traceId = getTraceId(), userId } = options;
  try {
    const headers = await buildHeaders();
    const payload = {
      metadata: fileMetadata,
      userId,
      traceId,
    };

    const response = await apiClient.post(`${BASE_URL}/generate`, payload, { headers });
    return response.data.filename;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILENAME_GENERATION_FAILED, {
      context: 'getSmartFilename',
      metadata: fileMetadata,
      traceId,
      error,
    });
    throw handleAPIError(error, 'Failed to generate smart file name');
  }
};

/**
 * Submit a filename feedback signal to help the AI improve
 */
export const submitNamingFeedback = async ({ original, suggested, accepted, context = {} }) => {
  try {
    const headers = await buildHeaders();
    const payload = {
      original,
      suggested,
      accepted,
      ...context,
      timestamp: new Date().toISOString(),
    };

    const response = await apiClient.post(`${BASE_URL}/feedback`, payload, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILENAME_FEEDBACK_FAILED, {
      context: 'submitNamingFeedback',
      original,
      suggested,
      error,
    });
    throw handleAPIError(error, 'Failed to submit naming feedback');
  }
};

/**
 * Fetch historical naming patterns for a user or role
 */
export const getNamingHistory = async (userId, options = {}) => {
  const { traceId = getTraceId() } = options;
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/history/${userId}`, { headers });
    return response.data.history;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_FILENAME_HISTORY_FAILED, {
      userId,
      traceId,
      context: 'getNamingHistory',
      error,
    });
    throw handleAPIError(error, 'Failed to retrieve naming history');
  }
};
