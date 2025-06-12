// File: /frontend/src/services/aws/password.js

import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { getCognitoConfig } from "./config";
import { logError, logInfo } from "../../utils/logging/logging";

/**
 * Initializes and returns a Cognito Identity Provider client.
 * @returns {CognitoIdentityProviderClient}
 */
const getClient = () => {
  try {
    const config = getCognitoConfig();
    if (!config?.region) {
      throw new Error('Invalid Cognito configuration: region is required');
    }
    return new CognitoIdentityProviderClient({ region: config.region });
  } catch (error) {
    logError("Failed to initialize Cognito client", error);
    throw new Error("Authentication service initialization failed");
  }
};

/**
 * Starts the password reset flow by requesting a confirmation code to the user's email.
 *
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} The response from Cognito
 * @throws {Error} If the request fails
 */
export const requestPasswordReset = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const config = getCognitoConfig();
  if (!config?.clientId) {
    throw new Error("Invalid configuration: Client ID is required");
  }

  const client = getClient();
  
  const command = new ForgotPasswordCommand({
    ClientId: config.clientId,
    Username: email.toLowerCase().trim(),
  });

  try {
    const response = await client.send(command);
    logInfo("Password reset requested successfully", { email });
    return {
      success: true,
      message: "Reset code sent successfully",
      delivery: response.CodeDeliveryDetails
    };
  } catch (err) {
    logError("Failed to request password reset", { error: err, email });
    
    // Handle specific AWS Cognito errors
    switch (err.name) {
      case 'UserNotFoundException':
        throw new Error("No account found with this email address");
      case 'LimitExceededException':
        throw new Error("Too many attempts. Please try again later");
      case 'InvalidParameterException':
        throw new Error("Invalid email address format");
      default:
        throw new Error(err.message || "Unable to send reset code. Please try again.");
    }
  }
};

/**
 * Confirms the new password using the confirmation code sent to the user.
 *
 * @param {string} email - The user's email address
 * @param {string} code - The confirmation code sent to the user
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} The response from Cognito
 * @throws {Error} If the confirmation fails
 */
export const confirmPasswordReset = async (email, code, newPassword) => {
  if (!email || !code || !newPassword) {
    throw new Error("Email, code, and new password are required");
  }

  const config = getCognitoConfig();
  if (!config?.clientId) {
    throw new Error("Invalid configuration: Client ID is required");
  }

  const client = getClient();

  const command = new ConfirmForgotPasswordCommand({
    ClientId: config.clientId,
    Username: email.toLowerCase().trim(),
    ConfirmationCode: code.trim(),
    Password: newPassword,
  });

  try {
    await client.send(command);
    logInfo("Password reset confirmed successfully", { email });
    return {
      success: true,
      message: "Password reset successful"
    };
  } catch (err) {
    logError("Failed to confirm password reset", { error: err, email });
    
    // Handle specific AWS Cognito errors
    switch (err.name) {
      case 'CodeMismatchException':
        throw new Error("Invalid verification code");
      case 'ExpiredCodeException':
        throw new Error("Verification code has expired");
      case 'InvalidPasswordException':
        throw new Error("Password does not meet requirements");
      case 'LimitExceededException':
        throw new Error("Too many attempts. Please try again later");
      default:
        throw new Error(err.message || "Unable to reset password. Please try again.");
    }
  }
};

/**
 * Changes the password for an authenticated user.
 *
 * @param {string} accessToken - The user's current access token
 * @param {string} oldPassword - The user's current password
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} The response from Cognito
 * @throws {Error} If the password change fails
 */
export const changePassword = async (accessToken, oldPassword, newPassword) => {
  if (!accessToken || !oldPassword || !newPassword) {
    throw new Error("Access token, old password, and new password are required");
  }

  const client = getClient();

  const command = new ChangePasswordCommand({
    AccessToken: accessToken,
    PreviousPassword: oldPassword,
    ProposedPassword: newPassword,
  });

  try {
    await client.send(command);
    logInfo("Password changed successfully");
    return {
      success: true,
      message: "Password changed successfully"
    };
  } catch (err) {
    logError("Failed to change password", { error: err });
    
    // Handle specific AWS Cognito errors
    switch (err.name) {
      case 'InvalidPasswordException':
        throw new Error("New password does not meet requirements");
      case 'NotAuthorizedException':
        throw new Error("Current password is incorrect");
      case 'LimitExceededException':
        throw new Error("Too many attempts. Please try again later");
      default:
        throw new Error(err.message || "Unable to change password. Please try again.");
    }
  }
};

// Export all password-related functions
export const passwordService = {
  requestPasswordReset,
  confirmPasswordReset,
  changePassword
};

export default passwordService;
