// ✅ FILE: /frontend/src/hooks/useApiClient.js

import { useMemo } from 'react';
import apiClient from '@/api/apiClient';
import { getToken } from '@/utils/tokenManager';
import logger from '@/utils/logging/logging';

/**
 * Hook: useApiClient
 *
 * Provides a memoized Axios instance for API calls.
 * Automatically attaches bearer token if available.
 *
 * @returns {AxiosInstance} Axios client instance
 */
const useApiClient = () => {
  return useMemo(() => {
    const client = apiClient;

    const token = getToken();
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.debug('🔐 Authorization header injected into API client');
    } else {
      delete client.defaults.headers.common['Authorization'];
      logger.debug('🔓 No token available, Authorization header cleared');
    }

    return client;
  }, []);
};

export default useApiClient;
