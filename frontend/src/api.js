// ✅ FILE: /frontend/src/api.js

import axios from "axios";
import { getAwsSecrets } from "./services/aws/secrets";
import { getToken } from "./services/aws/token";

// ✅ Load base URL dynamically from secrets or fallback
const { VITE_API_BASE_URL } = getAwsSecrets();
const API_BASE_URL = VITE_API_BASE_URL || "http://localhost:5001";

// ✅ Create a configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Inject Bearer token into requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

// ✅ Handle unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized! Redirecting to login...");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ✅ Exported API methods
const api = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return await apiClient.post("/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  generateFileLink: async (fileName) => {
    return await apiClient.post("/api/files/generate-link", { fileName });
  },

  listFiles: async (continuationToken = null, maxKeys = 10) => {
    const params = { continuationToken, maxKeys };
    return await apiClient.get("/api/files/list", { params });
  },
};

export default api;
