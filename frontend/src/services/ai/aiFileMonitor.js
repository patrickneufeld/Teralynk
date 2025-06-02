// /frontend/src/services/ai/aiFileMonitor.js

import apiClient from '../../api/apiClient';
import { emitSecurityEvent } from '../../utils/security/eventEmitter';
import { handleAPIError } from '../../utils/ErrorHandler';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '../../utils/logger';

const BASE_URL = '/api/ai/file-monitor';

/**
 * Build request headers with auth and trace context
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
 * Get monitoring metrics for a file: access patterns, anomaly detection, etc.
 * @param {string} fileId 
 */
export const getFileMonitoringData = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/metrics/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MONITORING_FAILED', { fileId, context: 'getFileMonitoringData', error });
    throw handleAPIError(error, 'Failed to retrieve file monitoring data');
  }
};

/**
 * Trigger on-demand monitoring for a file (e.g., suspicious behavior analysis)
 * @param {string} fileId 
 */
export const triggerFileMonitoring = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.post(`${BASE_URL}/trigger/${fileId}`, {}, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_MONITORING_TRIGGER_FAILED', { fileId, context: 'triggerFileMonitoring', error });
    throw handleAPIError(error, 'Failed to initiate file monitoring');
  }
};

/**
 * Get historical security or access audit for the file
 * @param {string} fileId 
 */
export const getFileAuditTrail = async (fileId) => {
  try {
    const headers = await buildHeaders();
    const response = await apiClient.get(`${BASE_URL}/audit/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent('AI_FILE_AUDIT_TRAIL_ERROR', { fileId, context: 'getFileAuditTrail', error });
    throw handleAPIError(error, 'Failed to retrieve file audit trail');
  }
};
