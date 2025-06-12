// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/api/axiosInstance.js

import axios from "axios";
import { getToken } from "../services/aws/token";
import { getAwsSecrets } from "../services/aws/secrets";

// ✅ Dynamically resolve API base URL from secrets
const { VITE_API_BASE_URL } = getAwsSecrets();
const API_BASE_URL = VITE_API_BASE_URL || "http://localhost:5001/api";

// ✅ Create a configured Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * ✅ Attach token to outgoing requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error("❌ Request Interceptor Error:", error.message);
    return Promise.reject(error);
  }
);

/**
 * ✅ Handle responses and errors
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
