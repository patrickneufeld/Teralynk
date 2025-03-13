// File: /frontend/src/utils/awsCognitoClient.js

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getToken, setToken, removeToken } from "./tokenUtils";

let cognitoClient = null;

/**
 * ✅ Fetch secrets from sessionStorage and validate structure
 */
const getAwsSecrets = () => {
  const cached = sessionStorage.getItem("secrets");
  if (!cached) throw new Error("Secrets not loaded yet.");
  const secrets = JSON.parse(cached);

  const {
    VITE_COGNITO_CLIENT_ID,
    VITE_AWS_REGION,
    VITE_COGNITO_CLIENT_SECRET,
  } = secrets;

  if (!VITE_COGNITO_CLIENT_ID || !VITE_AWS_REGION) {
    throw new Error("Cognito configuration is missing.");
  }

  return {
    clientId: VITE_COGNITO_CLIENT_ID,
    clientSecret: VITE_COGNITO_CLIENT_SECRET || "",
    region: VITE_AWS_REGION,
  };
};

/**
 * ✅ Singleton Cognito Client
 */
export const initializeCognitoClient = () => {
  if (!cognitoClient) {
    const { region } = getAwsSecrets();

    cognitoClient = new CognitoIdentityProviderClient({ region });
    console.log("✅ Cognito Client Initialized");
  }

  return cognitoClient;
};

/**
 * ✅ Refresh session using RefreshToken
 */
export const refreshSession = async () => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  const { clientId } = getAwsSecrets();

  if (!refreshToken) throw new Error("No refresh token available.");

  const command = new InitiateAuthCommand({
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });

  const client = initializeCognitoClient();
  const response = await client.send(command);

  if (!response.AuthenticationResult) throw new Error("Token refresh failed.");

  setToken(response.AuthenticationResult.AccessToken, response.AuthenticationResult.ExpiresIn);
  if (response.AuthenticationResult.IdToken) {
    sessionStorage.setItem("idToken", response.AuthenticationResult.IdToken);
  }
  if (response.AuthenticationResult.RefreshToken) {
    sessionStorage.setItem("refreshToken", response.AuthenticationResult.RefreshToken);
  }

  return response.AuthenticationResult;
};

/**
 * ✅ Login with username/password
 */
export const authenticateUser = async (username, password) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = initializeCognitoClient();

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  if (clientSecret) {
    const secretHash = btoa(`${username}${clientId}${clientSecret}`);
    params.AuthParameters.SECRET_HASH = secretHash;
  }

  const command = new InitiateAuthCommand(params);
  const response = await client.send(command);

  if (!response.AuthenticationResult) throw new Error("Authentication failed.");

  setToken(response.AuthenticationResult.AccessToken, response.AuthenticationResult.ExpiresIn);
  sessionStorage.setItem("idToken", response.AuthenticationResult.IdToken);
  sessionStorage.setItem("refreshToken", response.AuthenticationResult.RefreshToken);

  return response.AuthenticationResult;
};

/**
 * ✅ Get User Profile
 */
export const fetchUserProfile = async () => {
  let accessToken = getToken();
  if (!accessToken) throw new Error("No access token found.");
  const client = initializeCognitoClient();

  try {
    return await client.send(new GetUserCommand({ AccessToken: accessToken }));
  } catch (err) {
    if (err.name === "NotAuthorizedException" || err.message.includes("expired")) {
      const refreshed = await refreshSession();
      accessToken = refreshed.AccessToken;
      return await client.send(new GetUserCommand({ AccessToken: accessToken }));
    }
    console.error("❌ User Profile Error:", err);
    throw err;
  }
};

/**
 * ✅ Logout the user
 */
export const logoutUser = async () => {
  const accessToken = getToken();
  const client = initializeCognitoClient();

  if (accessToken) {
    await client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
  }

  removeToken();
  sessionStorage.removeItem("idToken");
  sessionStorage.removeItem("refreshToken");
};

/**
 * ✅ Start password reset
 */
export const forgotPassword = async (username) => {
  const { clientId } = getAwsSecrets();
  const client = initializeCognitoClient();

  await client.send(new ForgotPasswordCommand({ ClientId: clientId, Username: username }));
  return { message: "Password reset code sent." };
};

/**
 * ✅ Confirm new password
 */
export const confirmForgotPassword = async (username, confirmationCode, newPassword) => {
  const { clientId } = getAwsSecrets();
  const client = initializeCognitoClient();

  await client.send(
    new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    })
  );

  return { message: "Password reset successful." };
};

/**
 * ✅ Change password for logged-in user
 */
export const changePassword = async (previousPassword, newPassword) => {
  const accessToken = getToken();
  if (!accessToken) throw new Error("No access token found.");
  const client = initializeCognitoClient();

  await client.send(
    new ChangePasswordCommand({
      PreviousPassword: previousPassword,
      ProposedPassword: newPassword,
      AccessToken: accessToken,
    })
  );

  return { message: "Password changed successfully." };
};

/**
 * ✅ User signup
 */
export const signUpUser = async (username, password, email) => {
  const { clientId } = getAwsSecrets();
  const client = initializeCognitoClient();

  await client.send(
    new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    })
  );

  return { message: "User signed up successfully." };
};

/**
 * ✅ Export Cognito client (singleton)
 */
export const getCognitoClient = () => initializeCognitoClient();

export default {
  authenticateUser,
  fetchUserProfile,
  refreshSession,
  logoutUser,
  forgotPassword,
  confirmForgotPassword,
  changePassword,
  signUpUser,
  initializeCognitoClient,
};
