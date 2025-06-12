// ✅ FILE: /frontend/src/utils/api.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * 🌐 Standardized API request wrapper
 * Handles auth tokens, errors, and body serialization.
 * 
 * @param {string} endpoint - The API endpoint (e.g., "/auth/login")
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object|null} body - Request payload
 * @param {string|null} token - Optional token override (defaults to accessToken from storage)
 * @returns {Promise<any>} - Parsed JSON response or throws Error
 */
export const apiRequest = async (endpoint, method = "GET", body = null, token = null) => {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
    };

    if (!token) {
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      credentials: "include",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`📡 [API] ${method} ${url}`, { body });

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      const message = data?.error || data?.message || response.statusText || "API request failed";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error(`❌ [API] ${method} ${endpoint} failed:`, error);
    throw new Error(error.message || "Unknown API error");
  }
};

/**
 * 🔐 Login request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<any>}
 */
export const loginUser = async (email, password) => {
  return apiRequest("/auth/login", "POST", { email, password });
};

/**
 * 👤 Fetch authenticated user
 * @returns {Promise<any>}
 */
export const fetchCurrentUser = async () => {
  return apiRequest("/auth/me", "GET");
};

/**
 * 🚪 Logout user + clear local storage
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await apiRequest("/auth/logout", "POST");
  } catch (error) {
    console.warn("⚠️ Logout failed. Clearing tokens manually.");
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }
};
