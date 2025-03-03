const OAuthCredential = import OAuthCredential from '../models/OAuthCredential';
const RepoIntegration = import repoIntegration from '../services/repoIntegration';

const refreshTokens = async () => {
  const credentials = await OAuthCredential.find({ expiresAt: { $lt: Date.now() } }); // Expired tokens

  for (const credential of credentials) {
    try {
      const tokenData = await RepoIntegration.refreshAccessToken(
        credential.repository,
        credential.refreshToken,
        credential.clientId,
        credential.clientSecret
      );

      // Update new tokens
      credential.accessToken = tokenData.access_token;
      credential.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await credential.save();

      console.log(`Token refreshed for user ${credential.userId}, repo ${credential.repository}`);
    } catch (error) {
      console.error(`Failed to refresh token for user ${credential.userId}: ${error.message}`);
    }
  }
};

module.exports = refreshTokens;
