// File: /Users/patrick/Projects/Teralynk/backend/services/auth/modules/authFlow.js
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { tokenBlacklist } from '../tokenBlacklist.mjs';

dotenv.config();

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.COGNITO_REGION || 'us-east-1',
});

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error('❌ CLIENT_ID is not set in environment variables.');
}

/**
 * Authenticate user via Cognito
 */
export const login = async (username, password) => {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const response = await cognito.initiateAuth(params).promise();
    return response.AuthenticationResult;
  } catch (error) {
    console.error('❌ Cognito login error:', error.message);
    throw new Error('Invalid username or password');
  }
};

/**
 * Refresh Cognito session using refresh token
 */
export const refreshSession = async (refreshToken, username) => {
  if (!refreshToken || !username) {
    throw new Error('Missing refresh token or username');
  }

  if (tokenBlacklist.has(refreshToken)) {
    throw new Error('Refresh token is revoked');
  }

  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      USERNAME: username,
    },
  };

  try {
    const response = await cognito.initiateAuth(params).promise();
    return response.AuthenticationResult;
  } catch (error) {
    console.error('❌ Refresh session error:', error.message);
    throw new Error('Unable to refresh session');
  }
};

/**
 * Revoke a user's refresh token
 */
export const logout = async (refreshToken) => {
  if (!refreshToken) {
    console.warn('⚠️ No refresh token provided for logout');
    return false;
  }

  tokenBlacklist.add(refreshToken);
  return true;
};
