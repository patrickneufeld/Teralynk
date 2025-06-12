// ✅ FILE: /frontend/src/services/collaborationService.js

import apiClient from '@/api/apiClient';
import tokenManager from '@/utils/tokenManager';  // Changed to default import
import { getTraceId } from '@/utils/logger';
import { handleAPIError } from '@/utils/ErrorHandler';
import { emitTelemetry } from '@/utils/telemetry';

const BASE_URL = '/api/collaboration';

/**
 * Builds secure headers with token and trace context
 */
const buildHeaders = async () => {
  const token = await tokenManager.getToken();  // Changed from getAccessToken
  const traceId = getTraceId();
  return {
    Authorization: `Bearer ${token}`,
    'X-Trace-Id': traceId,
    'Content-Type': 'application/json',
  };
};

/**
 * Fetch active collaboration sessions for the current user
 */
export const getCollaborationSessions = async () => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.get(`${BASE_URL}/sessions`, { headers });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'COLLAB_SESSIONS_FETCH_FAILED', error });
    throw handleAPIError(error, 'Failed to fetch collaboration sessions');
  }
};

/**
 * Start a new collaboration session
 */
export const startCollaboration = async (targetUserId, context = {}) => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.post(`${BASE_URL}/start`, { targetUserId, context }, { headers });
    emitTelemetry({ event: 'COLLAB_SESSION_STARTED', targetUserId });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'COLLAB_SESSION_START_FAILED', error });
    throw handleAPIError(error, 'Failed to start collaboration session');
  }
};

/**
 * End an active collaboration session
 */
export const endCollaboration = async (sessionId) => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.post(`${BASE_URL}/end/${sessionId}`, {}, { headers });
    emitTelemetry({ event: 'COLLAB_SESSION_ENDED', sessionId });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'COLLAB_SESSION_END_FAILED', error });
    throw handleAPIError(error, 'Failed to end collaboration session');
  }
};

/**
 * Share a specific file or context during collaboration
 */
export const shareWithCollaborator = async (sessionId, payload) => {
  try {
    const headers = await buildHeaders();
    const res = await apiClient.post(`${BASE_URL}/share/${sessionId}`, payload, { headers });
    emitTelemetry({ event: 'COLLAB_CONTEXT_SHARED', sessionId });
    return res.data;
  } catch (error) {
    emitTelemetry({ event: 'COLLAB_SHARE_FAILED', error });
    throw handleAPIError(error, 'Failed to share context with collaborator');
  }
};

// Export all functions as a service object
const collaborationService = {
  getCollaborationSessions,
  startCollaboration,
  endCollaboration,
  shareWithCollaborator
};

export default collaborationService;
