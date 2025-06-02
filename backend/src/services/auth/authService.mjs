// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/services/auth/authService.js

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  GlobalSignOutCommand,
  AdminInitiateAuthCommand,
  RespondToAuthChallengeCommand
} from "@aws-sdk/client-cognito-identity-provider";

import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure required env variables are present
const {
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY
} = process.env;

if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("❌ Missing required AWS Cognito configuration in environment.");
  process.exit(1);
}

// ✅ Cognito Client
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// ✅ Secret hash generation (if client secret exists)
function createSecretHash(username) {
  if (!COGNITO_CLIENT_SECRET) return undefined;
  return crypto
    .createHmac("SHA256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}

/**
 * ✅ Sign up a new user in Cognito
 */
export async function signUpUser(email, password) {
  const input = {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
    ...(COGNITO_CLIENT_SECRET && { SecretHash: createSecretHash(email) })
  };

  try {
    const command = new SignUpCommand(input);
    return await cognitoClient.send(command);
  } catch (error) {
    console.error("❌ Sign up error:", error);
    throw new Error(`Sign up failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * ✅ Authenticate user and return tokens
 */
export async function authenticateUser(email, password) {
  const input = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      ...(COGNITO_CLIENT_SECRET && { SECRET_HASH: createSecretHash(email) })
    }
  };

  try {
    const command = new InitiateAuthCommand(input);
    const result = await cognitoClient.send(command);
    return result.AuthenticationResult;
  } catch (error) {
    console.error("❌ Authentication error:", error);
    throw new Error(`Authentication failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * 🔁 Refresh Cognito token using refresh_token
 */
export async function refreshUserToken(refreshToken, username) {
  const input = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      ...(COGNITO_CLIENT_SECRET && { SECRET_HASH: createSecretHash(username) })
    }
  };

  try {
    const command = new InitiateAuthCommand(input);
    const result = await cognitoClient.send(command);
    return result.AuthenticationResult;
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    throw new Error(`Token refresh failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * ✅ Update custom attribute (e.g., storing API key)
 */
export async function storeApiKey(userSub, apiKey) {
  const input = {
    UserPoolId: COGNITO_USER_POOL_ID,
    Username: userSub,
    UserAttributes: [{ Name: "custom:api_key", Value: apiKey }]
  };

  try {
    const command = new AdminUpdateUserAttributesCommand(input);
    await cognitoClient.send(command);
  } catch (error) {
    console.error("❌ Failed to store API key:", error);
    throw new Error(`Failed to store API key: ${error.message || "Unknown error"}`);
  }
}

/**
 * 🔒 Secure logout (token revocation)
 */
export async function logoutUser(accessToken) {
  try {
    const input = { AccessToken: accessToken };
    const command = new GlobalSignOutCommand(input);
    await cognitoClient.send(command);
  } catch (error) {
    console.error("❌ Logout error:", error);
    throw new Error(`Logout failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * 🔐 Role extraction from Cognito token claims
 */
export function getUserRole(decodedToken) {
  return decodedToken["cognito:groups"]?.[0] || "Viewer";
}
