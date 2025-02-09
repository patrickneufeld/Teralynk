const cognito = require("../config/cognitoConfig");

/**
 * Sign Up a New User
 */
async function signUpUser(email, password) {
  const params = {
    ClientId: process.env.COGNITO_APP_CLIENT_ID, // App Client ID from Cognito
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
    ],
  };

  try {
    const result = await cognito.signUp(params).promise();
    return result;
  } catch (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

/**
 * Authenticate User
 */
async function authenticateUser(email, password) {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };

  try {
    const result = await cognito.initiateAuth(params).promise();
    return result.AuthenticationResult; // Tokens are included here
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Store API Key as a Custom Attribute
 */
async function storeApiKey(userSub, apiKey) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: userSub, // User's unique identifier
    UserAttributes: [
      { Name: "custom:api_key", Value: apiKey }, // Custom attribute
    ],
  };

  try {
    await cognito.adminUpdateUserAttributes(params).promise();
  } catch (error) {
    throw new Error(`Failed to store API key: ${error.message}`);
  }
}

module.exports = {
  signUpUser,
  authenticateUser,
  storeApiKey,
};
