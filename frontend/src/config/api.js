// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/config/api.js

import axios from "axios";
import { getToken } from "../services/aws/token";
import { getAwsSecrets } from "../services/aws/secrets";

// ✅ Dynamically determine API base URL from secrets or fallback
const { VITE_API_BASE_URL } = getAwsSecrets();
export const API_BASE_URL = VITE_API_BASE_URL || "http://localhost:5001/api";

// ✅ Create an Axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Allow cookies for authentication
});

/**
 * ✅ Attach Authorization Token to Requests
 */
api.interceptors.request.use(
  (config) => {
    try {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("❌ Error attaching token to request:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("❌ API Request Error:", error.message);
    return Promise.reject(error);
  }
);

/**
 * ✅ Handle API Response & Errors
 */
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response);
    return response;
  },
  (error) => {
    const { response } = error;

    if (!response) {
      console.error("❌ Network Error or No Response:", error.message);
      alert("Network error. Please check your internet connection.");
      return Promise.reject(error);
    }

    console.error("❌ API Response Error:", response.data || error.message);

    switch (response.status) {
      case 401:
        console.warn("⚠️ Unauthorized! Redirecting to login...");
        alert("Session expired. Redirecting to login...");
        window.location.href = "/login";
        break;

      case 403:
        console.warn("⚠️ Forbidden! You lack permissions.");
        alert("Access denied. Please contact support if you believe this is a mistake.");
        break;

      case 500:
        console.error("⚠️ Server Error! Please try again later.");
        alert("Server error. Our team is working on it!");
        break;

      default:
        console.error(`⚠️ Unexpected Error (Status: ${response.status}):`, response.data);
        alert(response.data?.message || "An unexpected error occurred.");
        break;
    }

    return Promise.reject(error);
  }
);

/**
 * ✅ Utility Functions for API Requests
 */
export const apiRequest = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error("❌ GET Request Failed:", error);
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      console.error("❌ POST Request Failed:", error);
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      console.error("❌ PUT Request Failed:", error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error("❌ DELETE Request Failed:", error);
      throw error;
    }
  },
};
// Add WebSocket URL configuration
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
export const WS_BASE_URL = VITE_API_BASE_URL ? 
  `${WS_PROTOCOL}//${new URL(VITE_API_BASE_URL).host}` : 
  'ws://localhost:5001';

// Export for WebSocket usage
export const getWebSocketUrl = () => {
  try {
    const token = getToken();
    return `${WS_BASE_URL}?token=${token}`;
  } catch (error) {
    console.error("❌ Error generating WebSocket URL:", error);
    throw error;
  }
};
/**
 * ✅ Export the Axios instance for advanced use cases.
 */
export default api;
