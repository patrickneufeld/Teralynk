// ✅ FILE: /frontend/src/utils/activityLogger.js

import { emitTelemetry } from './telemetry';
import { getCurrentUser, getClientId, getSessionId } from './authUtils';
import { v4 as uuidv4 } from 'uuid';
import Logger from './logging';

/**
 * Create a secure, traceable activity log with full user/session context.
 *
 * @param {Object} params - Parameters for the log
 * @param {string} params.action - Action name (e.g. 'file.upload')
 * @param {Object} [params.metadata={}] - Additional metadata for the log
 * @param {string} [params.level='info'] - Log level (e.g. info, warning, error)
 * @param {string} [params.category='session'] - Log category (e.g. session, security)
 * @param {string} [params.description=''] - Human-readable description
 * @param {string} [params.traceId=uuidv4()] - Optional trace ID for correlation
 * @param {Function} [params.onEmit] - Optional async callback after emit
 * @returns {Promise<Object|null>} - The activity object or null if failed
 */
export const createActivityLog = async ({
  action = 'unknown',
  metadata = {},
  level = 'info',
  category = 'session',
  description = '',
  traceId = uuidv4(),
  onEmit = null,
}) => {
  try {
    const user = await getCurrentUser();
    const clientId = getClientId();
    const sessionId = getSessionId();

    const activity = {
      timestamp: new Date().toISOString(),
      traceId,
      userId: user?.id || 'anonymous',
      username: user?.username || 'unknown',
      action,
      metadata,
      level,
      category,
      description,
      clientId,
      sessionId,
    };

    emitTelemetry('activity.log', activity);

    if (typeof onEmit === 'function') {
      await onEmit(activity);
    }

    return activity;
  } catch (err) {
    Logger.error('❌ createActivityLog failed', { err, action, traceId });
    return null;
  }
};

export default createActivityLog;
