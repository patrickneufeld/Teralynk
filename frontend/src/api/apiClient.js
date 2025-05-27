// ✅ FILE: /frontend/src/api/apiClient.js

import axios from 'axios';
import tokenManager from '../utils/tokenManager.js'; // 🔒 Ensure .js extension for Vite/ESM compatibility

// ✅ Base API URL fallback logic
const DEFAULT_API_URL = 'http://localhost:5001';
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '') ||
  import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') ||
  DEFAULT_API_URL;

console.log('✅ API Client Initialized with Base URL:', API_BASE_URL);

// ✅ Create Axios instance with baseURL and timeout
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ✅ Request Interceptor: Inject Bearer token from tokenManager
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('⚠️ Token retrieval failed', { error: err.message });
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor failed', { error });
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor: Centralized error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ API Error Response', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error('❌ Network or Server Error', {
        message: error.message,
        config: error.config,
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
