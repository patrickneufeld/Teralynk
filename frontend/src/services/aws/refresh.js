// File: /frontend/src/services/aws/refresh.js

import { InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { getCognitoClient } from "./auth.js";
import { getAwsSecrets } from "./config.js";
import { generateSecretHash } from "./hash.js";
import token from "./token.js";

/**
 * Refresh session using stored refresh token
 * @returns {object} - AuthenticationResult containing new tokens
 */
export const refreshSession = async () => {
  const refreshToken = token.getRefreshToken();
  const username = token.getUsername();
  const { clientId, clientSecret } = getAwsSecrets();

  if (!refreshToken || !username) {
    throw new Error("Missing refresh token or username.");
  }

  const authParams = { REFRESH_TOKEN: refreshToken };

  if (clientSecret) {
    const hash = await generateSecretHash(username, clientId, clientSecret);
    if (hash) authParams.SECRET_HASH = hash;
  }

  const command = new InitiateAuthCommand({
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: authParams,
  });

  try {
    const client = getCognitoClient();
    const response = await client.send(command);

    if (!response.AuthenticationResult) {
      throw new Error("Token refresh failed: No authentication result");
    }

    const { AccessToken, ExpiresIn, IdToken, RefreshToken: newRefreshToken } =
      response.AuthenticationResult;

    token.setToken(AccessToken, ExpiresIn);
    if (IdToken) token.setIdToken(IdToken);
    if (newRefreshToken) token.setRefreshToken(newRefreshToken);

    return response.AuthenticationResult;
  } catch (error) {
    console.error("❌ Refresh session error:", error);
    token.removeAllTokens();
    throw error;
  }
};

export default {
  refreshSession,
};
