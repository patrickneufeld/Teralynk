// ✅ FILE: /frontend/src/services/dashboardService.js

import apiClient from '@/api/apiClient';
import { getTraceId } from '@/utils/logger';
import { logError, logInfo } from '@/utils/logging';
import { handleAPIError } from '@/utils/ErrorHandler';
import { emitTelemetry } from '@/utils/telemetry';
import tokenManager from '@/utils/tokenManager';  // Changed from named import to default import

const BASE_URL = '/api/dashboard';

// Update any usage of tokenManager in the file to use the default import
// For example:
// const token = await tokenManager.getToken();

// ... rest of your file stays the same ...

/**
 * Builds secure headers with token and trace context
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
 * Fetch summary metrics for dashboard
 */
export const getDashboardMetrics = async () => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.get(`${BASE_URL}/metrics`, { headers });
    emitTelemetry({ event: 'DASHBOARD_METRICS_FETCHED' });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'DASHBOARD_METRICS_FAILED', error });
    throw handleAPIError(error, 'Failed to load dashboard metrics');
  }
};

/**
 * Fetch recent user activity logs
 */
export const getUserActivityFeed = async () => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.get(`${BASE_URL}/activity-feed`, { headers });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'DASHBOARD_ACTIVITY_FEED_FAILED', error });
    throw handleAPIError(error, 'Failed to load activity feed');
  }
};

/**
 * Get AI-driven insight summaries (optional)
 */
export const getInsightSummary = async () => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.get(`${BASE_URL}/insights`, { headers });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'DASHBOARD_INSIGHT_FETCH_FAILED', error });
    throw handleAPIError(error, 'Failed to retrieve dashboard AI insights');
  }
};
