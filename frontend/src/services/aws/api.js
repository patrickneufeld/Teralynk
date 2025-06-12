// File: /frontend/src/services/aws/api.js

import { refreshSession } from "./refresh.js";
import token from "./token.js";

/**
 * Perform an authenticated API call with auto token refresh on 401
 * @param {string} endpoint - API URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response object
 */
export const apiCall = async (endpoint, options = {}) => {
  try {
    let accessToken = token.getToken();

    if (!accessToken) {
      const refreshed = await refreshSession();
      accessToken = refreshed.AccessToken;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      const refreshed = await refreshSession();

      return fetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshed.AccessToken}`,
          "Content-Type": "application/json",
        },
      });
    }

    return response;
  } catch (error) {
    console.error("❌ API call failed:", error);
    token.removeToken();
    window.location.href = "/login";
    throw error;
  }
};

export default {
  apiCall,
};
