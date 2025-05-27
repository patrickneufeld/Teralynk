// File: /frontend/src/services/ai/aiPerformanceService.js

import { emitTelemetry } from '../../utils/telemetry';
import { getCurrentUser } from '../../utils/authUtils';
import { getTraceId } from '../../utils/telemetry';
import { secureFetch } from '../../utils/networkUtils';
import { logError, logInfo } from '../../utils/logger';

const API_BASE = '/api/ai/performance';

/**
 * Fetch AI-driven user performance metrics.
 * @returns {Promise<object>}
 */
export async function fetchUserPerformance() {
  const traceId = getTraceId();
  const user = getCurrentUser();

  try {
    const response = await secureFetch(`${API_BASE}/metrics`, {
      method: 'GET',
      headers: {
        'x-trace-id': traceId,
      },
    });

    const data = await response.json();
    emitTelemetry('ai.performance.fetch_success', { userId: user?.id, traceId });
    return data;
  } catch (error) {
    logError('❌ Failed to fetch user performance metrics', error);
    emitTelemetry('ai.performance.fetch_error', { error: error.message, traceId });
    throw error;
  }
}

/**
 * Submit feedback about AI-generated performance metrics.
 * @param {object} feedback
 * @returns {Promise<void>}
 */
export async function submitPerformanceFeedback(feedback = {}) {
  const traceId = getTraceId();
  const user = getCurrentUser();

  try {
    await secureFetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-trace-id': traceId,
      },
      body: JSON.stringify({
        feedback,
        userId: user?.id,
      }),
    });

    emitTelemetry('ai.performance.feedback_submitted', {
      userId: user?.id,
      traceId,
      feedback,
    });
  } catch (error) {
    logError('❌ Failed to submit performance feedback', error);
    emitTelemetry('ai.performance.feedback_error', { error: error.message, traceId });
    throw error;
  }
}

/**
 * Trigger adaptive performance improvement recommendations.
 * @returns {Promise<object>}
 */
export async function getPerformanceRecommendations() {
  const traceId = getTraceId();
  const user = getCurrentUser();

  try {
    const response = await secureFetch(`${API_BASE}/recommendations`, {
      method: 'GET',
      headers: {
        'x-trace-id': traceId,
      },
    });

    const data = await response.json();
    emitTelemetry('ai.performance.recommendations_fetched', {
      userId: user?.id,
      traceId,
    });

    return data;
  } catch (error) {
    logError('❌ Failed to fetch performance recommendations', error);
    emitTelemetry('ai.performance.recommendation_error', {
      error: error.message,
      traceId,
    });
    throw error;
  }
}
