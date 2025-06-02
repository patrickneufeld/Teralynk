// /frontend/src/services/ai/aiFileNamer.js

import apiClient from '../../api/apiClient';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '../../utils/logger';
import { handleAPIError } from '../../utils/ErrorHandler';

const BASE_URL = '/api/ai/file-namer';

/**
 * Prepare headers with security and trace context
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
 * Generate a context-aware AI-powered filename suggestion
 * @param {Object} fileMetadata - includes user, role, tags, purpose, etc.
 */
export const generateSmartFilename = async (fileMetadata) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/generate`, fileMetadata, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_NAMING_FAILED', { context: 'generateSmartFilename', fileMetadata, error });
    throw handleAPIError(error, 'Failed to generate AI-powered filename');
  }
};

/**
 * Save the naming pattern to history for self-learning improvements
 * @param {Object} namingHistoryEntry 
 */
export const recordFilenameToHistory = async (namingHistoryEntry) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/history`, namingHistoryEntry, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_NAMING_HISTORY_FAILED', { context: 'recordFilenameToHistory', namingHistoryEntry, error });
    throw handleAPIError(error, 'Failed to record AI filename history');
  }
};

/**
 * Retrieve past filename suggestions for the user for UI hints or debugging
 * @param {string} userId 
 */
export const fetchUserFilenameHistory = async (userId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/history/${userId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILENAME_HISTORY_FETCH_FAILED', { context: 'fetchUserFilenameHistory', userId, error });
    throw handleAPIError(error, 'Failed to fetch user naming history');
  }
};
