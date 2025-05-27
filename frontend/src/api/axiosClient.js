// File: /frontend/src/api/axiosClient.js

import axios from 'axios';
import { getToken } from '../utils/tokenUtils';
import { logInfo, logError } from '../utils/logging/logging';
import { toast } from 'react-toastify';

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable sending cookies
});

// Debug logging
console.log('API Client Initialized with Base URL:', axiosClient.defaults.baseURL);

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    try {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      logInfo('API Request', {
        url: config.url,
        method: config.method,
        hasToken: !!token
      });
      return config;
    } catch (error) {
      logError('Request Interceptor Error', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    logError('Request Configuration Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    logInfo('API Response', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  async (error) => {
    const { response } = error;

    if (response) {
      const { status, config } = response;

      // Log error details
      logError('API Error', {
        url: config.url,
        status,
        data: response.data
      });

      // Handle specific status codes
      switch (status) {
        case 401:
          toast.error('Session expired. Please log in again.');
          // Trigger logout or redirect to login
          window.location.href = '/login';
          break;

        case 403:
          toast.error('Access denied. Please check your permissions.');
          break;

        case 404:
          toast.error('Resource not found.');
          break;

        case 429:
          toast.warn('Too many requests. Please wait and try again.');
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        default:
          toast.error('An error occurred. Please try again.');
      }
    } else {
      // Network or connection error
      logError('Network Error', {
        message: error.message,
        code: error.code
      });
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default axiosClient;