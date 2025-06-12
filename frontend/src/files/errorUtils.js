// src/files/errorUtils.js
import apiClient from "../api/apiClient.js";
import { refreshTokenIfNeeded, getToken } from "../utils/tokenUtils.js";

export const handleApiError = async (error, context) => {
  console.error(`API Error in ${context}:`, error);
  
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 401:
        await refreshTokenIfNeeded(getToken());
        return { retry: true };
      case 403:
        return { 
          message: "You don"t have permission to perform this action",
          retry: false 
        };
      case 413:
        return {
          message: "File size exceeds server limits",
          retry: false
        };
      default:
        return {
          message: data.message || "An unexpected error occurred",
          retry: status >= 500
        };
    }
  }
  
  if (error.request) {
    return {
      message: "Network error. Please check your connection",
      retry: true
    };
  }
  
  return {
    message: "An unexpected error occurred",
    retry: false
  };
};

export const createErrorLogger = (showNotification) => {
  return (error, context, info = {}) => {
    console.error(`[${context}]`, error, info);
    showNotification(`Error: ${error.message || 'An unexpected error occurred'}`, 'error');
    
    try {
      const errorData = {
        context,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        info
      };
      apiClient.post('/api/analytics/error', errorData).catch(console.error);
    } catch (e) {
      console.error('Failed to log error to analytics:', e);
    }
  };
};