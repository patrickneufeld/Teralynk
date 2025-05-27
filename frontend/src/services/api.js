import axios from "axios";

// ✅ Base API URL (Handle Production and Local Environments)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// ✅ Axios Instance with Default Configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach Authorization Header via Interceptor
api.interceptors.request.use(
  (config) => {
    try {
      // Retrieve user info from localStorage securely
      const user = localStorage.getItem("user");
      const parsedUser = user ? JSON.parse(user) : null;

      // Add Authorization header if accessToken exists
      if (parsedUser?.accessToken) {
        config.headers.Authorization = `Bearer ${parsedUser.accessToken}`;
      }

      return config;
    } catch (error) {
      console.error("❌ Error attaching Authorization header:", error);
      return config; // Proceed without the header on error
    }
  },
  (error) => {
    console.error("❌ Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// ✅ Global Response Interceptor for Better Error Handling
api.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  (error) => {
    console.error("❌ API Response Error:", error);

    // Handle token expiration or unauthorized access globally
    if (error.response?.status === 401) {
      console.warn("🔄 Token expired or unauthorized. Logging out...");
      localStorage.removeItem("user"); // Clear user data
      window.location.href = "/login"; // Redirect to login page
    }

    return Promise.reject(error);
  }
);

/**
 * ✅ Utility Method to Clear Axios Authorization Headers
 * Use when logging out or resetting user data.
 */
export const clearAuthorizationHeader = () => {
  delete api.defaults.headers.Authorization;
};

/**
 * ✅ Utility to Dynamically Update the Base URL
 * @param {string} newBaseUrl - The new API base URL
 */
export const updateApiBaseUrl = (newBaseUrl) => {
  api.defaults.baseURL = newBaseUrl;
  console.log(`🔄 API base URL updated to: ${newBaseUrl}`);
};

export default api;
