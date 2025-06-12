const AWS = require('aws-sdk');

// Configure Cognito client
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1', // Replace with your AWS region
});

// User Pool and App Client IDs
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!USER_POOL_ID || !CLIENT_ID) {
  throw new Error('Cognito User Pool ID and Client ID must be set in environment variables.');
}

// Sign Up a new user
async function signUp(username, password, email) {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
    ],
  };

  return cognito.signUp(params).promise();
}

// Confirm Sign Up
async function confirmSignUp(username, confirmationCode) {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
  };

  return cognito.confirmSignUp(params).promise();
}

// Sign In a user
async function signIn(username, password) {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  return cognito.initiateAuth(params).promise();
}

// Forgot Password
async function forgotPassword(username) {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
  };

  return cognito.forgotPassword(params).promise();
}

// Confirm Password Reset
async function confirmForgotPassword(username, confirmationCode, newPassword) {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: confirmationCode,
    Password: newPassword,
  };

  return cognito.confirmForgotPassword(params).promise();
}

module.exports = {
  signUp,
  confirmSignUp,
  signIn,
  forgotPassword,
  confirmForgotPassword,
};
