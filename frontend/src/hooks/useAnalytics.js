// /frontend/src/hooks/useAnalytics.js

import { useCallback } from 'react';
import { emitTelemetry } from '@/utils/telemetry';
import { getTraceId } from '@/utils/logger';

/**
 * Custom hook to track analytics events with trace ID.
 */
export function useAnalytics() {
  /**
   * Track an event with optional metadata
   * @param {string} eventName
   * @param {Object} [metadata={}]
   */
  const trackEvent = useCallback((eventName, metadata = {}) => {
    const traceId = getTraceId();

    emitTelemetry({
      event: eventName,
      metadata,
      traceId,
      timestamp: new Date().toISOString(),
      source: 'frontend',
    });
  }, []);

  return { trackEvent };
}
