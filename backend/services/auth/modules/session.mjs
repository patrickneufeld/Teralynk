
// File: backend/services/auth/modules/session.js

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    GlobalSignOutCommand,
  } from "@aws-sdk/client-cognito-identity-provider";
  import dotenv from "dotenv";
  
  dotenv.config();
  
  const cognito = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || "us-east-1",
  });
  
  const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
  
  if (!CLIENT_ID) {
    console.error("❌ Missing COGNITO_CLIENT_ID in environment variables.");
    process.exit(1);
  }
  
  // In-memory refresh token blacklist (can be replaced with Redis or DB)
  const refreshTokenBlacklist = new Set();
  
  /**
   * Refresh access token using Cognito Refresh Flow
   * @param {string} refreshToken
   * @param {string} username
   * @returns {object} - AuthenticationResult
   */
  export const refreshToken = async (refreshToken, username) => {
    if (!refreshToken || !username) {
      throw new Error("Missing refresh token or username");
    }
  
    if (refreshTokenBlacklist.has(refreshToken)) {
      throw new Error("Refresh token is blacklisted");
    }
  
    const authParams = {
      REFRESH_TOKEN: refreshToken,
      USERNAME: username,
    };
  
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: authParams,
    });
  
    try {
      const response = await cognito.send(command);
  
      if (!response.AuthenticationResult) {
        throw new Error("No AuthenticationResult in refresh response");
      }
  
      return response.AuthenticationResult;
    } catch (error) {
      console.error("❌ Failed to refresh token:", error.message);
      throw new Error("Unable to refresh session");
    }
  };
  
  /**
   * Logs out the user by revoking their access token via Cognito
   * @param {string} accessToken
   */
  export const logoutUser = async (accessToken) => {
    if (!accessToken) return;
  
    const command = new GlobalSignOutCommand({ AccessToken: accessToken });
  
    try {
      await cognito.send(command);
    } catch (error) {
      console.error("❌ Logout error:", error.message);
    }
  };
  
  /**
   * Add a refresh token to the blacklist
   * @param {string} token
   */
  export const addToBlacklist = (token) => {
    if (token) {
      refreshTokenBlacklist.add(token);
    }
  };
  
  /**
   * Check if a refresh token is blacklisted
   * @param {string} token
   * @returns {boolean}
   */
  export const isTokenRevoked = (token) => {
    return refreshTokenBlacklist.has(token);
  };
  