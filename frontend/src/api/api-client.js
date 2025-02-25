// ✅ FILE: frontend/src/api/apiClient.js

import axios from "axios"; // ✅ Correct import

// ✅ Use Vite environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001/api";

console.log("✅ Initializing API client with base URL:", API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 5000, // 5-second timeout
});

// ✅ Axios Response Interceptor: Handles API errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("❌ API request failed:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
