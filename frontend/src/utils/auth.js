export const TOKEN_KEY = "teralynk_access_token";

/**
 * ✅ Securely Store Authentication Token in Cookies
 * @param {string} token - JWT token received after login
 * @param {number} [expiresIn=3600] - Time in seconds before the token expires
 */
export const setToken = (token, expiresIn = 3600) => {
  if (token) {
    const expirationDate = new Date(Date.now() + expiresIn * 1000).toUTCString();
    document.cookie = `${TOKEN_KEY}=${token}; expires=${expirationDate}; Secure; SameSite=Strict; Path=/`;
    console.log("✅ Token securely stored in cookies.");
  } else {
    console.warn("⚠️ Cannot store an empty token.");
  }
};

/**
 * ✅ Retrieve the stored authentication token from cookies
 * @returns {string|null} - Returns the token or null if not found
 */
export const getToken = () => {
  try {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (name === TOKEN_KEY) return value;
    }
    console.warn("⚠️ Token not found in cookies.");
    return null;
  } catch (error) {
    console.error("❌ Error retrieving token:", error);
    return null;
  }
};

/**
 * ✅ Remove the authentication token (logout)
 * Clears the token from cookies
 */
export const removeToken = () => {
  try {
    document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; Secure; SameSite=Strict`;
    console.log("✅ Token successfully removed from cookies.");
  } catch (error) {
    console.error("❌ Error removing token:", error);
  }
};

/**
 * ✅ Parse JWT Token to Get User Info
 * @returns {object|null} - Returns decoded user data or null if invalid
 */
export const getUserInfo = () => {
  try {
    const token = getToken();
    if (!token) return null;

    const base64Url = token.split(".")[1]; // Extract the payload
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64)
      .split("")
      .map((char) => `%${("00" + char.charCodeAt(0).toString(16)).slice(-2)}`)
      .join("");

    const userInfo = JSON.parse(decodeURIComponent(jsonPayload));
    console.log("✅ User info decoded from token:", userInfo);
    return userInfo;
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    return null;
  }
};

/**
 * ✅ Automatically Refresh Token if Expired
 * Calls the refresh endpoint to obtain a new token
 * @returns {boolean} - True if the refresh is successful, false otherwise
 */
export const refreshToken = async () => {
  try {
    console.log("🔄 Attempting to refresh token...");
    const refreshToken = getToken();
    if (!refreshToken) {
      console.warn("⚠️ No refresh token found.");
      return false;
    }

    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token. Status: ${response.status}`);
    }

    const data = await response.json();
    setToken(data.accessToken, data.expiresIn); // Update token with expiration time
    console.log("✅ Token refreshed successfully.");
    return true;
  } catch (error) {
    console.error("❌ Token Refresh Error:", error);
    return false;
  }
};

/**
 * ✅ Check if User is Authenticated
 * Verifies if a token exists and is valid
 * @returns {boolean} - Returns true if the token is valid
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) {
    console.warn("⚠️ No token found. User is not authenticated.");
    return false;
  }

  try {
    const userInfo = getUserInfo();
    if (!userInfo) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    if (userInfo.exp > currentTime) {
      console.log("✅ Token is valid. User is authenticated.");
      return true;
    } else {
      console.warn("⚠️ Token has expired.");
      return false;
    }
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    return false;
  }
};

/**
 * ✅ Handle User Logout
 * Clears the token and optionally redirects to login
 * @param {boolean} [redirect=true] - Whether to redirect the user to the login page
 */
export const logout = (redirect = true) => {
  try {
    console.log("🚪 Logging out user...");
    removeToken();

    if (redirect) {
      console.log("🔄 Redirecting to login page...");
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("❌ Logout Error:", error);
  }
};
