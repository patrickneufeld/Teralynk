// ✅ FILE: /frontend/src/utils/auth.js

export const TOKEN_KEY = "teralynk_access_token";

/**
 * 🔐 Store authentication token securely in cookies
 * @param {string} token - JWT access token
 * @param {number} [expiresIn=3600] - Expiration time in seconds
 */
export const setToken = (token, expiresIn = 3600) => {
  if (!token) {
    console.warn("❌ Cannot store an empty token.");
    return;
  }

  const expirationDate = new Date(Date.now() + expiresIn * 1000).toUTCString();
  document.cookie = `${TOKEN_KEY}=${token}; expires=${expirationDate}; Secure; SameSite=Strict; Path=/`;
  console.log("✅ Token securely stored in cookies.");
};

/**
 * 🍪 Retrieve token from cookies
 * @returns {string|null}
 */
export const getToken = () => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === TOKEN_KEY) return value;
  }
  return null;
};

/**
 * 🗑️ Remove the authentication token from cookies
 */
export const removeToken = () => {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
  console.log("🧹 Token removed from cookies.");
};

/**
 * 📖 Decode user info from JWT token
 * @returns {object|null}
 */
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    const userInfo = JSON.parse(jsonPayload);
    return userInfo;
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    return null;
  }
};

/**
 * ♻️ Refresh access token if expired
 * @returns {Promise<boolean>}
 */
export const refreshToken = async () => {
  const currentToken = getToken();
  if (!currentToken) {
    console.warn("⚠️ No token to refresh.");
    return false;
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`🔁 Refresh failed. Status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.accessToken) {
      setToken(data.accessToken, data.expiresIn || 3600);
      console.log("🔄 Token refreshed.");
      return true;
    } else {
      console.warn("⚠️ Refresh response missing token.");
      return false;
    }
  } catch (err) {
    console.error("❌ Token refresh error:", err);
    return false;
  }
};

/**
 * ✅ Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.exp) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return userInfo.exp > currentTime;
};

/**
 * 🚪 Logout and optionally redirect
 * @param {boolean} [redirect=true]
 */
export const logout = (redirect = true) => {
  console.log("🚪 Logging out...");
  removeToken();
  if (redirect) {
    window.location.href = "/login";
  }
};
