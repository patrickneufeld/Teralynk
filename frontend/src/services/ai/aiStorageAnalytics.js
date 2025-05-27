// File: /frontend/src/services/ai/aiStorageAnalytics.js

import apiClient from '@/api/apiClient';
import { getTraceId } from '@/utils/logger';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { emitSecurityEvent } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';

const BASE_URL = '/api/ai/storage-analytics';

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
 * Fetch usage statistics for storage resources.
 */
export const getStorageUsageStats = async () => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/usage`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_STORAGE_USAGE_STATS_FAILED', { error });
    throw handleAPIError(error, 'Failed to fetch storage usage statistics');
  }
};

/**
 * Get file distribution analytics (type, size, owner, age).
 */
export const getFileDistributionAnalytics = async () => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/file-distribution`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_STORAGE_FILE_ANALYTICS_FAILED', { error });
    throw handleAPIError(error, 'Failed to retrieve file distribution analytics');
  }
};

/**
 * Retrieve storage anomaly detection results.
 */
export const getStorageAnomalies = async () => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/anomalies`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_STORAGE_ANOMALY_FAILED', { error });
    throw handleAPIError(error, 'Failed to detect storage anomalies');
  }
};

/**
 * Trigger an on-demand storage optimization analysis.
 */
export const runStorageOptimization = async (options = {}) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/optimize`, options, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_STORAGE_OPTIMIZATION_FAILED', { error });
    throw handleAPIError(error, 'Storage optimization failed');
  }
};
