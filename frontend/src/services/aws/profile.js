// File: /frontend/src/services/aws/profile.js

import { GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { getCognitoClient } from "./auth.js";
import { refreshSession } from "./refresh.js";
import token from "./token.js";

/**
 * Fetch user profile from Cognito with auto-refresh fallback
 * @returns {Promise<object>} - User attributes and metadata
 */
export const fetchUserProfile = async () => {
  try {
    let accessToken = token.getToken();

    if (!accessToken) {
      const refreshed = await refreshSession();
      accessToken = refreshed.AccessToken;
    }

    const client = getCognitoClient();
    const command = new GetUserCommand({ AccessToken: accessToken });

    const response = await client.send(command);
    return response;
  } catch (error) {
    console.error("❌ User profile fetch failed:", error);
    throw error;
  }
};

export default {
  fetchUserProfile,
};
