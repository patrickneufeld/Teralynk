// File: /Users/patrick/Projects/Teralynk/backend/services/auth/modules/passwordReset.js
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: process.env.COGNITO_REGION || 'us-east-1',
});

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error('❌ CLIENT_ID is not set in environment variables.');
}

/**
 * Start the "Forgot Password" flow for a Cognito user.
 * @param {string} username - The username of the user.
 * @returns {Promise<{ success: boolean }>}
 */
export const initiateForgotPassword = async (username) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
  };

  try {
    await cognito.forgotPassword(params).promise();
    return { success: true };
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    throw new Error('Unable to initiate password reset');
  }
};

/**
 * Confirm the new password using the verification code from Cognito.
 * @param {string} username - The username of the user.
 * @param {string} confirmationCode - The verification code sent by Cognito.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<{ success: boolean }>}
 */
export const confirmNewPassword = async (username, confirmationCode, newPassword) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
    Password: newPassword,
  };

  try {
    await cognito.confirmForgotPassword(params).promise();
    return { success: true };
  } catch (error) {
    console.error('❌ Confirm forgot password error:', error.message);
    throw new Error('Failed to confirm password reset');
  }
};
