// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/services/auth/authService.js

import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, AdminUpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import dotenv from "dotenv";
dotenv.config();

// ✅ Ensure all required env variables exist
const {
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  AWS_REGION
} = process.env;

if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID || !AWS_REGION) {
  console.error("❌ Missing Cognito config env vars.");
  process.exit(1);
}

// ✅ Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * 🧠 Utility: Create Cognito secret hash if secret is set
 */
import crypto from "crypto";
function createSecretHash(username) {
  if (!COGNITO_CLIENT_SECRET) return undefined;
  return crypto
    .createHmac("SHA256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}

/**
 * ✅ Sign up user
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
    const result = await cognitoClient.send(command);
    return result;
  } catch (error) {
    console.error("❌ SignUp error:", error);
    throw new Error(`Sign up failed: ${error.message || "Unknown error"}`);
  }
}

/**
 * ✅ Authenticate user
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
 * ✅ Update custom attribute (store API key or others)
 */
export async function storeApiKey(userSub, apiKey) {
  const input = {
    UserPoolId: COGNITO_USER_POOL_ID,
    Username: userSub,
    UserAttributes: [
      { Name: "custom:api_key", Value: apiKey }
    ]
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
 * 🔒 Placeholder for token revocation
 * Add proper token store and blacklist if needed later.
 */
export function revokeToken(token) {
  console.log("🚫 Token revoked (placeholder):", token);
}

/**
 * 🔐 Utility: Return role from user object
 */
export function getUserRole(user) {
  return user?.role || user["cognito:groups"]?.[0] || "Viewer";
}
