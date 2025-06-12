// /frontend/src/services/ai/aiFileDebugger.js

import apiClient from '../../api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '../../utils/logger';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { handleAPIError } from '../../utils/ErrorHandler';

const BASE_URL = '/api/ai/file-debugger';

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
 * Run AI-powered debugging on a file
 * @param {string} fileId 
 * @param {Object} options - Custom debug options like type, depth, etc.
 */
export const runFileDebugging = async (fileId, options = {}) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/${fileId}/analyze`, options, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_DEBUG_FAILED', {
      fileId,
      options,
      error,
    });
    throw handleAPIError(error, 'Failed to debug file using AI');
  }
};

/**
 * Retrieve the last known AI debug result for a file
 * @param {string} fileId 
 */
export const getLastDebugResult = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/${fileId}/latest`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_DEBUG_HISTORY_FAILED', {
      fileId,
      error,
    });
    throw handleAPIError(error, 'Failed to fetch latest debug result');
  }
};

/**
 * Export the debug report
 * @param {string} fileId 
 */
export const exportDebugReport = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/${fileId}/export`, {
      headers,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    return url;
  } catch (error) {
    emitSecurityEvent('AI_FILE_DEBUG_EXPORT_FAILED', {
      fileId,
      error,
    });
    throw handleAPIError(error, 'Failed to export debug report');
  }
};
