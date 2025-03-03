// ✅ FILE: frontend/src/utils/api.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

/**
 * ✅ API Request Helper
 * Handles authenticated and non-authenticated API requests.
 * 
 * @param {string} endpoint - The API endpoint (e.g., "/auth/login")
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object|null} body - Request payload (optional)
 * @param {string|null} token - Optional auth token (default: retrieved from localStorage)
 * @returns {Promise<object>} - API response JSON or throws an error
 */
export const apiRequest = async (endpoint, method = "GET", body = null, token = null) => {
    try {
        console.log(`🔹 API Request: ${method} ${BACKEND_URL}${endpoint}`);

        const headers = {
            "Content-Type": "application/json",
        };

        // ✅ Attach Authorization Token if available
        if (!token) {
            token = localStorage.getItem("accessToken"); // Default to stored token
        }
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
            credentials: "include", // Ensure cookies are sent if needed
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `API request failed: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        console.error(`❌ API Request Error [${method} ${endpoint}]:`, error);
        throw error;
    }
};

/**
 * ✅ Login API Request
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} - Login response with tokens
 */
export const loginUser = async (email, password) => {
    return apiRequest("/auth/login", "POST", { email, password });
};

/**
 * ✅ Fetch Current User Data
 * @returns {Promise<object>} - Returns user object if authenticated
 */
export const fetchCurrentUser = async () => {
    return apiRequest("/auth/me", "GET");
};

/**
 * ✅ Logout User
 * Clears session and calls backend logout if needed.
 */
export const logoutUser = async () => {
    try {
        await apiRequest("/auth/logout", "POST");
    } catch (error) {
        console.warn("⚠️ Logout API Call Failed, clearing tokens manually.");
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login"; // Redirect after logout
};
