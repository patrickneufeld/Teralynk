// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/authRoutes.js

import express from "express";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import base64 from "base-64";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// ✅ Express Router
const router = express.Router();

// ✅ AWS Secrets Manager Client
const secretsManagerClient = new SecretsManagerClient({ region: "us-east-1" });

/**
 * ✅ Load Cognito Secrets from AWS Secrets Manager
 */
async function loadCognitoSecrets() {
  try {
    console.log("🔍 Fetching Cognito secrets from AWS...");
    const secretResponse = await secretsManagerClient.send(
      new GetSecretValueCommand({ SecretId: "cognito_credentials" })
    );

    const secrets = JSON.parse(secretResponse.SecretString);
    console.log("✅ Cognito Secrets Loaded Successfully.");

    return {
      AWS_REGION: secrets.AWS_REGION,
      COGNITO_USER_POOL_ID: secrets.COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: secrets.COGNITO_CLIENT_ID,
      COGNITO_CLIENT_SECRET: secrets.COGNITO_CLIENT_SECRET,
    };
  } catch (error) {
    console.error("❌ AWS Secrets Manager Error:", error);
    process.exit(1);
  }
}

// ✅ Load Secrets and Initialize Cognito Client
const cognitoSecrets = await loadCognitoSecrets();
const cognito = new CognitoIdentityProviderClient({ region: cognitoSecrets.AWS_REGION });

/**
 * ✅ Generate the secret hash required for Cognito authentication
 * @param {string} username - The username of the user
 * @returns {string} - The computed secret hash
 */
function generateSecretHash(username) {
  const secretKey = cognitoSecrets.COGNITO_CLIENT_SECRET;
  const clientId = cognitoSecrets.COGNITO_CLIENT_ID;

  if (!secretKey || !clientId) {
    throw new Error("Cognito client secret or client ID is missing");
  }

  return base64.encode(
    crypto.createHmac("sha256", secretKey)
      .update(username + clientId)
      .digest()
  );
}

/**
 * ✅ @route POST /api/auth/login
 * ✅ Authenticate user with AWS Cognito
 * ✅ Public Access
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: cognitoSecrets.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: generateSecretHash(username), // ✅ Add secret hash for enhanced security
      },
    };

    const command = new InitiateAuthCommand(params);
    const authResult = await cognito.send(command);

    return res.status(200).json({
      message: "Login successful",
      accessToken: authResult.AuthenticationResult.AccessToken,
      idToken: authResult.AuthenticationResult.IdToken,
      refreshToken: authResult.AuthenticationResult.RefreshToken,
    });

  } catch (error) {
    console.error("❌ Authentication Error:", error);
    return res.status(401).json({ error: "Authentication failed", details: error.message });
  }
});

/**
 * ✅ @route POST /api/auth/register
 * ✅ Register a new user in AWS Cognito
 * ✅ Public Access
 */
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Username, password, and email are required" });
  }

  try {
    // ✅ Step 1: Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: cognitoSecrets.COGNITO_USER_POOL_ID,
      Username: username,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" }
      ],
      MessageAction: "SUPPRESS",
    });

    await cognito.send(createUserCommand);

    // ✅ Step 2: Set the user's permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: cognitoSecrets.COGNITO_USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    });

    await cognito.send(setPasswordCommand);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: "User registration failed", details: error.message });
  }
});

/**
 * ✅ @route POST /api/auth/logout
 * ✅ Logs out the user by invalidating the session (Handled on the frontend)
 * ✅ Public Access
 */
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout Error:", error);
    res.status(500).json({ error: "Logout failed", details: error.message });
  }
});

/**
 * ✅ @route GET /api/auth/status
 * ✅ Checks the user's authentication status
 * ✅ Public Access
 */
router.get("/status", async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    res.status(200).json({ message: "User is authenticated" });
  } catch (error) {
    console.error("❌ Auth Check Error:", error);
    res.status(500).json({ error: "Failed to verify authentication", details: error.message });
  }
});

// ✅ Export Router
export default router;
