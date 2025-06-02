// ✅ FILE: /frontend/src/services/mfaService.js

import axios from 'axios';
import tokenManager from '../utils/tokenManager'; // ✅ FIXED default import
import { getTraceId } from '../utils/telemetry';
import { logError, logInfo } from '../utils/logger';

const API_BASE = '/api/security/mfa';

export const MFAService = {
  /**
   * Initiate a new MFA challenge for the user
   * @param {Object} params - Required parameters
   * @returns {Promise<Object>} challenge data
   */
  async initiate({ userId, method, metadata = {} }) {
    const traceId = getTraceId();

    try {
      const token = await tokenManager.getToken();

      const response = await axios.post(
        `${API_BASE}/initiate`,
        { userId, method, metadata },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Trace-Id': traceId,
          },
        }
      );

      logInfo('✅ MFA challenge initiated', { method, userId, traceId });
      return response.data;

    } catch (err) {
      logError('❌ MFA challenge initiation failed', {
        error: err.message,
        userId,
        traceId,
      });
      throw err;
    }
  },

  /**
   * Verify an MFA code from the user
   * @param {Object} params - Required parameters
   * @returns {Promise<boolean>} success
   */
  async verify({ userId, challengeId, code, metadata = {} }) {
    const traceId = getTraceId();

    try {
      const token = await tokenManager.getToken();

      const response = await axios.post(
        `${API_BASE}/verify`,
        { userId, challengeId, code, metadata },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Trace-Id': traceId,
          },
        }
      );

      logInfo('✅ MFA code verified', { userId, traceId });
      return response.data?.verified === true;

    } catch (err) {
      logError('❌ MFA verification failed', {
        error: err.message,
        userId,
        traceId,
      });
      throw err;
    }
  },
};

export default MFAService;
