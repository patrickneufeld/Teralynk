const API_URL = "https://teralynk.auth.us-east-1.amazoncognito.com"; // Your Cognito API endpoint

/**
 * ✅ Save token securely in a cookie
 * @param {string} token - The authentication token to save
 */
const saveTokenInCookie = (token) => {
  document.cookie = `teralynk_access_token=${token}; Secure; SameSite=Strict; Path=/`;
};

/**
 * ✅ Clear token from cookies
 */
const clearTokenFromCookie = () => {
  document.cookie = `teralynk_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; Path=/; SameSite=Strict; Secure`;
};

/**
 * ✅ Log in the User
 * @param {string} username - The username/email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<object|null>} - User data if successful, or null if login fails
 */
export const loginUser = async (username, password) => {
  if (!username || !password) {
    throw new Error("Both username and password are required.");
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed. Please try again.");
    }

    // Save token in a cookie
    saveTokenInCookie(data.accessToken);
    console.log("✅ Login successful.");

    return data;
  } catch (error) {
    console.error("❌ Login Error:", error.message || error);
    return null;
  }
};

/**
 * ✅ Log out the User
 * Clears the authentication token from cookies and optionally calls a logout endpoint
 */
export const logoutUser = async () => {
  try {
    console.log("🚪 Logging out...");

    // Optionally notify the backend to invalidate the session
    const response = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include", // Include cookies with the request
    });

    if (!response.ok) {
      throw new Error(`Failed to log out. Status: ${response.status}`);
    }

    // Clear the authentication token from cookies
    clearTokenFromCookie();
    console.log("✅ Logout successful.");
  } catch (error) {
    console.error("❌ Logout Error:", error.message || error);
  }
};

/**
 * ✅ Refresh the Access Token
 * Calls the AWS Cognito refresh endpoint to get a new token
 * @returns {Promise<boolean>} - True if the refresh is successful, false otherwise
 */
export const refreshToken = async () => {
  try {
    console.log("🔄 Refreshing token...");

    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      credentials: "include", // Ensures cookies are sent with the request
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token. Status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Save refreshed token
    saveTokenInCookie(data.accessToken);
    console.log("✅ Token refreshed successfully.");
    return true;
  } catch (error) {
    console.error("❌ Token Refresh Error:", error.message || error);
    return false;
  }
};

/**
 * ✅ Validate the Authentication Token
 * @returns {Promise<boolean>} - True if token is valid, false otherwise
 */
export const validateToken = async () => {
  try {
    const response = await fetch(`${API_URL}/validate`, {
      method: "GET",
      credentials: "include", // Send cookies along
    });

    if (!response.ok) {
      throw new Error("Token validation failed.");
    }

    console.log("✅ Token is valid.");
    return true;
  } catch (error) {
    console.error("❌ Token Validation Error:", error.message || error);
    return false;
  }
};
