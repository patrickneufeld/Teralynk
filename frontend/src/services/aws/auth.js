// ✅ FILE: /frontend/src/services/aws/auth.js

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { getAwsSecrets } from "./config.js";
import { generateSecretHash } from "./hash.js";
import token from "./token.js";

let cognitoClient = null;

/**
 * ✅ Initialize and return Cognito client
 */
export const getCognitoClient = () => {
  if (!cognitoClient) {
    const { region } = getAwsSecrets();
    cognitoClient = new CognitoIdentityProviderClient({ region });
    console.log("✅ Cognito client initialized");
  }
  return cognitoClient;
};

/**
 * ✅ Authenticate (login) user with Cognito
 * @param {string} username
 * @param {string} password
 */
export const loginUser = async (username, password) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const authParams = {
    USERNAME: username,
    PASSWORD: password,
  };

  if (clientSecret) {
    const hash = await generateSecretHash(username, clientId, clientSecret);
    if (hash) authParams.SECRET_HASH = hash;
  }

  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: authParams,
  });

  try {
    const response = await client.send(command);
    const result = response.AuthenticationResult;

    if (!result) throw new Error("Missing AuthenticationResult");

    token.setToken(result.AccessToken, result.ExpiresIn);
    token.setRefreshToken(result.RefreshToken);
    token.setIdToken(result.IdToken);
    token.setUsername(username);

    console.log("✅ Login successful for", username);
    return result;
  } catch (err) {
    token.removeAllTokens();
    console.error("❌ Authentication failed:", err);
    throw err;
  }
};

/**
 * ✅ Register a new Cognito user
 * @param {Object} params - email, password, name
 */
export const registerUser = async ({ email, password, name }) => {
  const { clientId } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password,
    UserAttributes: [
      { Name: "email", Value: email },
      ...(name ? [{ Name: "name", Value: name }] : []),
    ],
  });

  try {
    const result = await client.send(command);
    console.log("✅ User registered:", email);
    return result;
  } catch (err) {
    console.error("❌ Signup failed:", err);
    throw err;
  }
};

/**
 * ✅ Logout user (local only)
 */
export const logoutUser = () => {
  try {
    token.removeAllTokens();
    console.log("✅ User logged out");
  } catch (err) {
    console.error("❌ Logout failed:", err);
    throw err;
  }
};

/**
 * ✅ Session refresh (placeholder)
 */
export const refreshSession = async () => {
  console.warn("⚠️ refreshSession not implemented for Cognito yet");
  return null;
};

/**
 * ✅ Initiate forgot password flow
 * @param {string} username
 */
export const sendPasswordResetCode = async (username) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new ForgotPasswordCommand({
    ClientId: clientId,
    Username: username,
    ...(clientSecret && {
      SecretHash: await generateSecretHash(username, clientId, clientSecret),
    }),
  });

  try {
    const result = await client.send(command);
    console.log("✅ Password reset code sent:", username);
    return result;
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    throw err;
  }
};

/**
 * ✅ Confirm password reset with verification code
 * @param {string} username
 * @param {string} code
 * @param {string} newPassword
 */
export const confirmPasswordReset = async (username, code, newPassword) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new ConfirmForgotPasswordCommand({
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword,
    ...(clientSecret && {
      SecretHash: await generateSecretHash(username, clientId, clientSecret),
    }),
  });

  try {
    const result = await client.send(command);
    console.log("✅ Password reset confirmed:", username);
    return result;
  } catch (err) {
    console.error("❌ Confirm password reset error:", err);
    throw err;
  }
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  refreshSession,
  sendPasswordResetCode,
  confirmPasswordReset,
};
