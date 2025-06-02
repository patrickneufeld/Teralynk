// /frontend/src/services/ai/aiFileManager.js

import apiClient from '../../api/apiClient';
import { getTraceId } from '../../utils/logger';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { handleAPIError } from '../../utils/ErrorHandler';
import { getToken as getAccessToken } from '@/utils/tokenManager';

const AI_FILE_MANAGER_BASE = '/api/ai/file-manager';

/**
 * Internal helper to include auth headers and trace ID in every request.
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
 * Upload file metadata for AI optimization.
 * @param {Object} fileData - File metadata and AI context.
 */
export const uploadFileMetadata = async (fileData) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${AI_FILE_MANAGER_BASE}/upload`, fileData, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MANAGER_UPLOAD_FAILED', { context: 'uploadFileMetadata', error });
    throw handleAPIError(error, 'AI File Manager Upload Failed');
  }
};

/**
 * Get optimized file suggestions from the AI engine.
 * @param {string} fileId - Unique file ID.
 */
export const getFileSuggestions = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${AI_FILE_MANAGER_BASE}/suggestions/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MANAGER_SUGGESTION_FAILED', { context: 'getFileSuggestions', error });
    throw handleAPIError(error, 'AI Suggestions Fetch Failed');
  }
};

/**
 * Trigger smart file cleanup via the AI engine.
 * @param {Object} params - File IDs or filters for cleanup.
 */
export const triggerSmartCleanup = async (params) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${AI_FILE_MANAGER_BASE}/cleanup`, params, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MANAGER_CLEANUP_FAILED', { context: 'triggerSmartCleanup', error });
    throw handleAPIError(error, 'AI Smart Cleanup Failed');
  }
};

/**
 * Fetch AI-processed insights about a file.
 * @param {string} fileId
 */
export const getFileInsights = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${AI_FILE_MANAGER_BASE}/insights/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MANAGER_INSIGHT_FAILED', { context: 'getFileInsights', error });
    throw handleAPIError(error, 'AI File Insights Retrieval Failed');
  }
};
