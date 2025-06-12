// /frontend/src/services/ai/aiFileMetadataAnalyzer.js

import apiClient from '../../api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '../../utils/logger';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { handleAPIError } from '../../utils/ErrorHandler';

const BASE_URL = '/api/ai/file-metadata-analyzer';

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
 * Analyze metadata of a file for patterns, risk, and classification.
 * @param {string} fileId
 */
export const analyzeFileMetadata = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/analyze/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_METADATA_ANALYSIS_FAILED', { fileId, error });
    throw handleAPIError(error, `Failed to analyze metadata for file ${fileId}`);
  }
};

/**
 * Suggest metadata improvements based on AI analysis.
 * @param {string} fileId
 */
export const suggestMetadataImprovements = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/suggestions/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_METADATA_SUGGESTION_FAILED', { fileId, error });
    throw handleAPIError(error, `Failed to retrieve metadata suggestions for file ${fileId}`);
  }
};

/**
 * Submit corrected metadata back to the system.
 * @param {string} fileId
 * @param {Object} metadata
 */
export const applyMetadataFix = async (fileId, metadata) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/apply/${fileId}`, metadata, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_METADATA_FIX_FAILED', { fileId, metadata, error });
    throw handleAPIError(error, `Failed to apply metadata fix for file ${fileId}`);
  }
};
