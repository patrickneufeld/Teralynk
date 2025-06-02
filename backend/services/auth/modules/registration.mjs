// File: /Users/patrick/Projects/Teralynk/backend/services/auth/modules/registration.js
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
 * Sign up a user to Cognito
 * @param {string} username - The user's username
 * @param {string} password - The user's password
 * @param {string} email - The user's email
 */
export const signUpUser = async (username, password, email) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
    ],
  };

  try {
    const result = await cognito.signUp(params).promise();
    return { success: true, userSub: result.UserSub };
  } catch (error) {
    console.error('❌ Cognito Sign Up Error:', error.message);
    throw new Error('Failed to sign up user');
  }
};

/**
 * Confirm a Cognito user using the confirmation code
 * @param {string} username - The user's username
 * @param {string} confirmationCode - The code sent by Cognito
 */
export const confirmUser = async (username, confirmationCode) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
  };

  try {
    await cognito.confirmSignUp(params).promise();
    return { success: true };
  } catch (error) {
    console.error('❌ Cognito Confirm Sign Up Error:', error.message);
    throw new Error('Failed to confirm user');
  }
};
