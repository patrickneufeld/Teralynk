// ✅ FILE: /frontend/src/hooks/useLogging.js

import logger from '@/utils/logging/logging';

/**
 * Hook: useLogging
 * 
 * Provides easy access to structured logging methods inside React components.
 * Wraps debug, info, warn, error, critical levels cleanly.
 *
 * @returns {{
 *   debug: (message: string, metadata?: object, context?: string) => void,
 *   info: (message: string, metadata?: object, context?: string) => void,
 *   warn: (message: string, metadata?: object, context?: string) => void,
 *   error: (error: Error|string, context?: string, metadata?: object) => void,
 *   critical: (error: Error|string, context?: string, metadata?: object) => void
 * }}
 */
const useLogging = () => {
  return {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    critical: logger.critical,
  };
};

export default useLogging;
