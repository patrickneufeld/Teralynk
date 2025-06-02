// File: /frontend/src/services/ai/aiSecurityManager.js

import apiClient from '@/api/apiClient';
import { getToken as getAccessToken } from '@/utils/tokenManager';
import { getTraceId } from '@/utils/telemetry';
import { emitSecurityEvent, SECURITY_EVENTS } from '@/utils/security/eventEmitter';
import { handleAPIError } from '@/utils/ErrorHandler';
import { logError } from '@/utils/logging/logging';

const BASE_URL = '/api/ai/security-manager';

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
 * Fetch AI-detected security anomalies.
 */
export const getSecurityAnomalies = async ({ traceId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/anomalies`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_SECURITY_ANOMALIES_FAILED, {
      traceId,
      context: 'getSecurityAnomalies',
      error,
    });
    throw handleAPIError(error, 'Failed to fetch security anomalies');
  }
};

/**
 * Trigger an AI security audit scan.
 */
export const runSecurityAudit = async (scanParams = {}, { traceId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.post(`${BASE_URL}/audit`, scanParams, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_SECURITY_AUDIT_FAILED, {
      traceId,
      context: 'runSecurityAudit',
      scanParams,
      error,
    });
    throw handleAPIError(error, 'Security audit failed');
  }
};

/**
 * Fetch recommended security remediations.
 */
export const getSecurityRecommendations = async ({ traceId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.get(`${BASE_URL}/recommendations`, { headers });
    return response.data;
  } catch (error) {
    emitSecurityEvent(SECURITY_EVENTS.AI_SECURITY_RECOMMENDATION_FAILED, {
      traceId,
      context: 'getSecurityRecommendations',
      error,
    });
    throw handleAPIError(error, 'Failed to retrieve AI security recommendations');
  }
};

/**
 * Apply a recommended AI security fix.
 * @param {string} issueId - Unique issue identifier
 * @param {Object} resolution - Details about the fix
 */
export const applySecurityFix = async (issueId, resolution, { traceId = getTraceId() } = {}) => {
  try {
    const headers = await buildHeaders(traceId);
    const response = await apiClient.post(`${BASE_URL}/resolve/${issueId}`, resolution, { headers });
    return response.data;
  } catch (error) {
    logError('Security fix application failed', error);
    emitSecurityEvent(SECURITY_EVENTS.AI_SECURITY_FIX_FAILED, {
      traceId,
      context: 'applySecurityFix',
      issueId,
      resolution,
      error,
    });
    throw handleAPIError(error, 'Failed to apply security fix');
  }
};
