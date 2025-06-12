// ✅ FILE: /frontend/src/utils/networkUtils.js

import { getToken } from './tokenManager';
import { getTraceId, emitTelemetry } from './telemetry';
import { logError, logInfo } from './logger';

/**
 * ✅ Check if the user's network is online.
 * @returns {boolean}
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * ✅ Estimate effective connection type (e.g., 4g, 3g).
 * @returns {string} One of: '4g', '3g', '2g', 'slow-2g', 'unknown'
 */
export function getEffectiveConnectionType() {
  if (typeof navigator !== 'undefined' && navigator.connection?.effectiveType) {
    return navigator.connection.effectiveType;
  }
  return 'unknown';
}

/**
 * ✅ Get approximate network downlink speed in Mbps.
 * @returns {number|null}
 */
export function getNetworkDownlink() {
  if (typeof navigator !== 'undefined' && navigator.connection?.downlink) {
    return navigator.connection.downlink;
  }
  return null;
}

/**
 * ✅ Determine if current network condition is poor.
 * @returns {boolean}
 */
export function isNetworkPoor() {
  const type = getEffectiveConnectionType();
  return ['2g', 'slow-2g'].includes(type);
}

/**
 * ✅ Get full network diagnostics object.
 * @returns {Object}
 */
export function getNetworkDiagnostics() {
  return {
    online: isOnline(),
    effectiveType: getEffectiveConnectionType(),
    downlink: getNetworkDownlink(),
    poorConnection: isNetworkPoor(),
    timestamp: Date.now(),
  };
}

/**
 * ✅ secureFetch - Adds token, trace ID, telemetry and hardened error handling to fetch.
 *
 * @param {string} url - API endpoint.
 * @param {object} options - Fetch options (headers, method, body).
 * @param {object} context - Extra context for telemetry/logging.
 * @returns {Promise<Response>}
 */
export async function secureFetch(url, options = {}, context = {}) {
  try {
    const token = await getToken();
    const traceId = getTraceId();

    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Trace-Id': traceId,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorContext = {
        url,
        status: response.status,
        statusText: response.statusText,
        ...context,
      };

      logError(`secureFetch failed: ${response.statusText}`, 'Network', errorContext);
      emitTelemetry('secureFetchError', {
        url,
        traceId,
        method: options.method || 'GET',
        status: response.status,
        ...context,
      });

      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    logInfo(`secureFetch success: ${url}`, { traceId, ...context });
    return response;
  } catch (error) {
    logError(error, 'secureFetch', context);
    emitTelemetry('secureFetchException', {
      url,
      traceId: getTraceId(),
      message: error.message,
      ...context,
    });
    throw error;
  }
}
