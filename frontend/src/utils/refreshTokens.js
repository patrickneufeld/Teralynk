// ✅ FILE: /backend/src/utils/refreshTokens.js

import OAuthCredential from "../models/OAuthCredential.js";
import repoIntegration from "../services/repoIntegration.js";

/**
 * 🔄 Refresh expired OAuth access tokens for external repo integrations.
 */
const refreshTokens = async () => {
  try {
    const credentials = await OAuthCredential.find({
      expiresAt: { $lt: new Date() },
    });

    if (credentials.length === 0) {
      console.log("✅ No expired credentials to refresh.");
      return;
    }

    for (const credential of credentials) {
      try {
        const tokenData = await repoIntegration.refreshAccessToken(
          credential.repository,
          credential.refreshToken,
          credential.clientId,
          credential.clientSecret
        );

        credential.accessToken = tokenData.access_token;
        credential.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        await credential.save();

        console.log(`🔄 Token refreshed for user ${credential.userId} on ${credential.repository}`);
      } catch (error) {
        console.error(`❌ Failed to refresh token for user ${credential.userId} (${credential.repository}): ${error.message}`);
      }
    }
  } catch (err) {
    console.error("❌ Global token refresh process failed:", err);
  }
};

export default refreshTokens;
