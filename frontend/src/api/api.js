// File Path: /Users/patrick/Projects/Teralynk/frontend/src/api/api.js

import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5001/api",
    withCredentials: true, // ✅ Enables sending HttpOnly cookies
});

// 🔄 Function to refresh access token
const refreshAccessToken = async () => {
    try {
        const { data } = await axios.post("http://localhost:5001/api/auth/refresh", {}, { withCredentials: true });

        // ✅ Store new access token
        localStorage.setItem("accessToken", data.accessToken);
        return data.accessToken;
    } catch (error) {
        console.error("❌ Token Refresh Failed:", error);
        localStorage.removeItem("accessToken");
        window.location.href = "/login"; // Redirect user to login page
        return null;
    }
};

// ✅ Axios interceptor: Attach access token to all requests
api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
});

// ✅ Axios interceptor: Handle expired tokens
api.interceptors.response.use(
    response => response,
    async (error) => {
        if (error.response?.status === 401) {
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
                error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return api(error.config); // ✅ Retry request with new token
            }
        }
        return Promise.reject(error);
    }
);

export default api;
