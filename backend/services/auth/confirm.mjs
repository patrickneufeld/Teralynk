// File: backend/services/auth/confirm.js

import { ConfirmSignUpCommand, AdminConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getCognitoClient } from "./aws.mjs";

dotenv.config();

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const JWT_SECRET = process.env.JWT_SECRET;

if (!CLIENT_ID || !USER_POOL_ID || !JWT_SECRET) {
  throw new Error("❌ Required environment variables are missing: CLIENT_ID, USER_POOL_ID, JWT_SECRET");
}

/**
 * Confirm a user's signup using confirmation code
 * @param {string} username - The Cognito username
 * @param {string} confirmationCode - The code sent via email
 */
export const confirmSignup = async (username, confirmationCode) => {
  const client = getCognitoClient();
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
    });
    return await client.send(command);
  } catch (error) {
    console.error("❌ Error confirming signup:", error);
    throw new Error("Failed to confirm signup");
  }
};

/**
 * Admin-confirm a user programmatically without user action
 * @param {string} username - The Cognito username
 */
export const confirmSignupAdmin = async (username) => {
  const client = getCognitoClient();
  try {
    const command = new AdminConfirmSignUpCommand({
      Username: username,
      UserPoolId: USER_POOL_ID,
    });
    return await client.send(command);
  } catch (error) {
    console.error("❌ Error admin-confirming signup:", error);
    throw new Error("Admin confirm signup failed");
  }
};

/**
 * Generate JWT from user object
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} JWT token
 */
export const generateJwtToken = (user) => {
  try {
    return jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
  } catch (error) {
    console.error("❌ JWT generation failed:", error);
    throw new Error("Failed to generate JWT");
  }
};

/**
 * Decode and verify a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyJwtToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("❌ JWT verification failed:", error);
    throw new Error("Invalid or expired token");
  }
};
