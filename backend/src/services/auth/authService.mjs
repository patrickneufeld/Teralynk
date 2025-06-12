// ✅ FILE: /backend/src/services/auth/authService.js

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  GlobalSignOutCommand,
  AdminInitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand,
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

import crypto from "crypto";
import dotenv from "dotenv";
import { logger } from '../utils/logger.js';  // Assume you have a logger utility
import { AuthError, AUTH_ERROR_CODES } from '../utils/errors.js';

dotenv.config();

// ✅ Configuration validation
const requiredConfig = {
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
};

const missingConfig = Object.entries(requiredConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  logger.error(`Missing required AWS Cognito configuration: ${missingConfig.join(', ')}`);
  process.exit(1);
}

// ✅ Cognito Client with retry configuration
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  maxAttempts: 3,
  retryMode: 'adaptive'
});

// ✅ Enhanced secret hash generation
function createSecretHash(username) {
  if (!process.env.COGNITO_CLIENT_SECRET) return undefined;
  
  try {
    return crypto
      .createHmac("SHA256", process.env.COGNITO_CLIENT_SECRET)
      .update(username + process.env.COGNITO_CLIENT_ID)
      .digest("base64");
  } catch (error) {
    logger.error('Failed to create secret hash', { error });
    throw new AuthError('Failed to create secret hash', AUTH_ERROR_CODES.CRYPTO_ERROR);
  }
}

// ✅ Cognito command wrapper with error handling
async function executeCognitoCommand(commandName, command, context = {}) {
  try {
    const result = await cognitoClient.send(command);
    logger.debug(`Successfully executed ${commandName}`, { ...context });
    return result;
  } catch (error) {
    logger.error(`Failed to execute ${commandName}`, {
      error: error.message,
      code: error.name,
      ...context
    });

    // Map Cognito errors to our custom AuthError
    switch (error.name) {
      case 'NotAuthorizedException':
        throw new AuthError('Invalid credentials', AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      case 'UserNotFoundException':
        throw new AuthError('User not found', AUTH_ERROR_CODES.USER_NOT_FOUND);
      case 'UsernameExistsException':
        throw new AuthError('User already exists', AUTH_ERROR_CODES.USER_EXISTS);
      case 'LimitExceededException':
        throw new AuthError('Too many attempts', AUTH_ERROR_CODES.RATE_LIMIT);
      case 'InvalidPasswordException':
        throw new AuthError('Password does not meet requirements', AUTH_ERROR_CODES.INVALID_PASSWORD);
      case 'ExpiredTokenException':
        throw new AuthError('Token expired', AUTH_ERROR_CODES.TOKEN_EXPIRED);
      default:
        throw new AuthError(
          `Authentication service error: ${error.message}`,
          AUTH_ERROR_CODES.SERVICE_ERROR
        );
    }
  }
}

/**
 * ✅ Sign up a new user in Cognito with enhanced validation
 */
export async function signUpUser(email, password, userAttributes = {}) {
  // Input validation
  if (!email || !password) {
    throw new AuthError('Email and password are required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  const input = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      ...Object.entries(userAttributes).map(([key, value]) => ({
        Name: key,
        Value: String(value)
      }))
    ],
    ...(process.env.COGNITO_CLIENT_SECRET && { SecretHash: createSecretHash(email) })
  };

  return executeCognitoCommand('SignUp', new SignUpCommand(input), { email });
}

/**
 * ✅ Enhanced user authentication with MFA support
 */
export async function authenticateUser(email, password, mfaCode = null) {
  if (!email || !password) {
    throw new AuthError('Email and password are required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  const input = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      ...(process.env.COGNITO_CLIENT_SECRET && { SECRET_HASH: createSecretHash(email) }),
      ...(mfaCode && { SMS_MFA_CODE: mfaCode })
    }
  };

  const result = await executeCognitoCommand('InitiateAuth', new InitiateAuthCommand(input), { email });

  // Handle MFA challenge if required
  if (result.ChallengeName === 'SMS_MFA' || result.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
    return {
      challengeName: result.ChallengeName,
      session: result.Session,
      challengeParameters: result.ChallengeParameters
    };
  }

  return result.AuthenticationResult;
}

/**
 * ✅ Enhanced token refresh with validation
 */
export async function refreshUserToken(refreshToken, username) {
  if (!refreshToken || !username) {
    throw new AuthError('Refresh token and username are required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  const input = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
      ...(process.env.COGNITO_CLIENT_SECRET && { SECRET_HASH: createSecretHash(username) })
    }
  };

  const result = await executeCognitoCommand('RefreshToken', new InitiateAuthCommand(input), { username });
  return result.AuthenticationResult;
}

/**
 * ✅ Secure API key storage with encryption
 */
export async function storeApiKey(userSub, apiKey) {
  if (!userSub || !apiKey) {
    throw new AuthError('User ID and API key are required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  // Encrypt API key before storage
  const encryptedApiKey = crypto
    .createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
    .update(apiKey, 'utf8', 'hex');

  const input = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: userSub,
    UserAttributes: [{ Name: "custom:api_key", Value: encryptedApiKey }]
  };

  await executeCognitoCommand('UpdateUserAttributes', new AdminUpdateUserAttributesCommand(input), { userSub });
}

/**
 * ✅ Enhanced logout with session cleanup
 */
export async function logoutUser(accessToken, userId) {
  if (!accessToken) {
    throw new AuthError('Access token is required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  await executeCognitoCommand('GlobalSignOut', new GlobalSignOutCommand({ AccessToken: accessToken }), { userId });
  
  // Additional cleanup if needed
  // await cleanupUserSessions(userId);
}

/**
 * ✅ Enhanced user role management
 */
export function getUserRole(decodedToken) {
  if (!decodedToken) {
    throw new AuthError('Token is required', AUTH_ERROR_CODES.VALIDATION_ERROR);
  }

  const groups = decodedToken["cognito:groups"] || [];
  const customRole = decodedToken["custom:role"];
  
  // Priority: Custom role > Group role > Default role
  return customRole || groups[0] || "Viewer";
}

/**
 * ✅ Get user details
 */
export async function getUserDetails(accessToken) {
  const command = new GetUserCommand({ AccessToken: accessToken });
  const result = await executeCognitoCommand('GetUser', command);
  
  return {
    username: result.Username,
    attributes: result.UserAttributes.reduce((acc, attr) => ({
      ...acc,
      [attr.Name]: attr.Value
    }), {})
  };
}

/**
 * ✅ Admin get user details
 */
export async function getAdminUserDetails(username) {
  const command = new AdminGetUserCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username
  });
  
  const result = await executeCognitoCommand('AdminGetUser', command);
  
  return {
    username: result.Username,
    status: result.UserStatus,
    enabled: result.Enabled,
    attributes: result.UserAttributes.reduce((acc, attr) => ({
      ...acc,
      [attr.Name]: attr.Value
    }), {})
  };
}
