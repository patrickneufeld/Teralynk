// ✅ FILE: backend/src/routes/authRoutes.js

const express = require("express");
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const crypto = require("crypto");
const base64 = require("base-64");

const router = express.Router();

// ✅ Ensure Required Environment Variables are Set
const requiredEnvVars = [
  "AWS_REGION",
  "COGNITO_CLIENT_ID",
  "COGNITO_CLIENT_SECRET",
  "COGNITO_USER_POOL_ID",
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ ERROR: Missing critical environment variable: ${key}`);
    process.exit(1);
  }
});

// ✅ Initialize Cognito Client
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

/**
 * ✅ Generate the secret hash required for Cognito authentication
 * @param {string} username - The username of the user
 * @returns {string} - The computed secret hash
 */
function generateSecretHash(username) {
  const secretKey = process.env.COGNITO_CLIENT_SECRET;
  const clientId = process.env.COGNITO_CLIENT_ID;

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

  console.log("🔹 Received login request:", { username });

  try {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    console.log("🔹 Cognito Auth Request Params:", params);

    const command = new InitiateAuthCommand(params);
    const authResult = await cognito.send(command);

    console.log("✅ Cognito Response:", JSON.stringify(authResult, null, 2));

    return res.status(200).json({
      message: "Login successful",
      accessToken: authResult.AuthenticationResult.AccessToken,
      idToken: authResult.AuthenticationResult.IdToken,
      refreshToken: authResult.AuthenticationResult.RefreshToken,
    });

  } catch (error) {
    console.error("❌ Authentication Error:", error);
    console.error("🔹 AWS Error Response:", JSON.stringify(error, null, 2));

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
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
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
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
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

module.exports = router;
