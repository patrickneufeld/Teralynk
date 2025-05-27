// /frontend/src/services/ai/aiFileVersioning.js

import apiClient from '../../api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { getTraceId } from '../../utils/logger';
import { handleAPIError } from '../../utils/ErrorHandler';

const BASE_URL = '/api/ai/file-versioning';

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
 * Save a new version of the file with AI metadata attached.
 * @param {string} fileId 
 * @param {Object} versionPayload - { reason, metadata, changes }
 */
export const saveFileVersion = async (fileId, versionPayload) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/${fileId}/save`, versionPayload, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_VERSION_SAVE_FAILED', {
      context: 'saveFileVersion',
      fileId,
      versionPayload,
      error,
    });
    throw handleAPIError(error, 'Failed to save file version');
  }
};

/**
 * Fetch version history of a file
 * @param {string} fileId 
 */
export const getFileVersionHistory = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/${fileId}/history`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_VERSION_HISTORY_FAILED', {
      context: 'getFileVersionHistory',
      fileId,
      error,
    });
    throw handleAPIError(error, 'Failed to fetch version history');
  }
};

/**
 * Restore a previous version of a file
 * @param {string} fileId 
 * @param {string} versionId 
 */
export const restoreFileVersion = async (fileId, versionId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/${fileId}/restore`, { versionId }, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_VERSION_RESTORE_FAILED', {
      context: 'restoreFileVersion',
      fileId,
      versionId,
      error,
    });
    throw handleAPIError(error, 'Failed to restore file version');
  }
};
