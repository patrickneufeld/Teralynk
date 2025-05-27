// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/config/api.js

import axios from "axios";
import { getToken } from "../utils/auth";

// ✅ Define API Base URL dynamically
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

// ✅ Create an Axios instance with default settings
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Allow cookies for authentication
});

// ✅ Attach Authorization Token to Requests
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("❌ API Request Error:", error);
        return Promise.reject(error);
    }
);

// ✅ Handle API Response & Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("❌ API Response Error:", error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.warn("⚠️ Unauthorized! Redirecting to login...");
            window.location.href = "/login"; // Redirect user to login if unauthorized
        }

        return Promise.reject(error);
    }
);

// ✅ API Methods for Common Requests
export const apiRequest = {
    get: (url, params = {}) => api.get(url, { params }),
    post: (url, data) => api.post(url, data),
    put: (url, data) => api.put(url, data),
    delete: (url) => api.delete(url),
};

// ✅ Export API Instance
export default api;
