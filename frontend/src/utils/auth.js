// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/utils/auth.js

export const TOKEN_KEY = "teralynk_access_token";

/**
 * ✅ Securely Store Authentication Token in HttpOnly Cookie
 * @param {string} token - JWT token received after login
 */
export const setToken = (token) => {
    if (token) {
        document.cookie = `${TOKEN_KEY}=${token}; Secure; HttpOnly; SameSite=Strict; Path=/`;
    }
};

/**
 * ✅ Retrieve the stored authentication token from cookies
 * @returns {string|null} - Returns the token or null if not found
 */
export const getToken = () => {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === TOKEN_KEY) return value;
    }
    return null;
};

/**
 * ✅ Remove the authentication token (logout)
 */
export const removeToken = () => {
    document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; HttpOnly; SameSite=Strict`;
};

/**
 * ✅ Check if a user is authenticated
 * @returns {boolean} - Returns true if the user has a valid token
 */
export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    try {
        const decodedToken = getUserInfo();
        if (!decodedToken) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        return decodedToken.exp > currentTime; // Check if token is still valid
    } catch (error) {
        console.error("❌ Error verifying token:", error);
        return false;
    }
};

/**
 * ✅ Parse JWT Token to get user info
 * @returns {object|null} - Returns decoded user data or null if invalid
 */
export const getUserInfo = () => {
    try {
        const token = getToken();
        if (!token) return null;

        const base64Url = token.split(".")[1]; // Get payload
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("❌ Error decoding token:", error);
        return null;
    }
};

/**
 * ✅ Automatically Refresh Token if Expired
 */
export const refreshToken = async () => {
    try {
        const refreshToken = getToken("refreshToken");
        if (!refreshToken) return false;

        const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to refresh token.");

        const data = await response.json();
        setToken(data.accessToken);
        return true;
    } catch (error) {
        console.error("❌ Token Refresh Error:", error);
        return false;
    }
};

/**
 * ✅ Handle User Logout: Remove token & redirect to login page
 */
export const logout = () => {
    removeToken();
    window.location.href = "/login";
};
