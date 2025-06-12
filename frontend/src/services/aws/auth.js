// ================================================
// ✅ FILE: /frontend/src/services/aws/auth.js
// AWS Cognito Auth Service for Teralynk
// ================================================

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { getAwsSecrets } from './config.js';
import { generateSecretHash } from './hash.js';
import {
  setToken,
  getToken,
  removeToken,
  setRefreshToken,
  getRefreshToken,
  setIdToken,
  setUsername,
  getUsername,
  removeAllTokens,
} from './token.js';
import { PERMISSION_SETS, SECURITY_POLICIES } from './permissions.js';

// ================================================
// 🧠 Cognito Client Singleton
// ================================================
let cognitoClient = null;

const getCognitoClient = () => {
  if (!cognitoClient) {
    const { region } = getAwsSecrets();
    cognitoClient = new CognitoIdentityProviderClient({ region });
    console.log('✅ Cognito client initialized');
  }
  return cognitoClient;
};

// ================================================
// 🔐 Login User
// ================================================
export const loginUser = async (username, password) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const authParams = {
    USERNAME: username,
    PASSWORD: password,
  };

  if (clientSecret) {
    const hash = await generateSecretHash(username, clientId, clientSecret);
    if (hash) authParams.SECRET_HASH = hash;
  }

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: clientId,
    AuthParameters: authParams,
  });

  try {
    const response = await client.send(command);
    const result = response.AuthenticationResult;
    if (!result) throw new Error('Missing AuthenticationResult');

    setToken(result.AccessToken, result.ExpiresIn);
    setRefreshToken(result.RefreshToken);
    setIdToken(result.IdToken);
    setUsername(username);

    console.log('✅ Login successful for', username);
    return result;
  } catch (err) {
    removeAllTokens();
    console.error('❌ Authentication failed:', err);
    throw err;
  }
};

// ================================================
// 👤 Register User
// ================================================
export const registerUser = async ({ email, password, name }) => {
  const { clientId } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password,
    UserAttributes: [
      { Name: 'email', Value: email },
      ...(name ? [{ Name: 'name', Value: name }] : []),
    ],
  });

  try {
    const result = await client.send(command);
    console.log('✅ User registered:', email);
    return result;
  } catch (err) {
    console.error('❌ Signup failed:', err);
    throw err;
  }
};

// ================================================
// 🚪 Logout User
// ================================================
export const logoutUser = () => {
  try {
    removeAllTokens();
    console.log('✅ User logged out');
  } catch (err) {
    console.error('❌ Logout failed:', err);
    throw err;
  }
};

// ================================================
// 🔁 Send Password Reset Code
// ================================================
export const sendPasswordResetCode = async (username) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new ForgotPasswordCommand({
    ClientId: clientId,
    Username: username,
    ...(clientSecret && {
      SecretHash: await generateSecretHash(username, clientId, clientSecret),
    }),
  });

  try {
    const result = await client.send(command);
    console.log('✅ Password reset code sent:', username);
    return result;
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    throw err;
  }
};

// ================================================
// ✅ Confirm Password Reset
// ================================================
export const confirmPasswordReset = async (username, code, newPassword) => {
  const { clientId, clientSecret } = getAwsSecrets();
  const client = getCognitoClient();

  const command = new ConfirmForgotPasswordCommand({
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword,
    ...(clientSecret && {
      SecretHash: await generateSecretHash(username, clientId, clientSecret),
    }),
  });

  try {
    const result = await client.send(command);
    console.log('✅ Password reset confirmed:', username);
    return result;
  } catch (err) {
    console.error('❌ Confirm password reset error:', err);
    throw err;
  }
};

// ================================================
// 🔓 Permissions from Cognito Groups
// ================================================
export const extractPermissionsFromGroups = (groups = []) => {
  const permissions = new Set();
  const matchedPolicies = [];

  for (const group of groups) {
    if (SECURITY_POLICIES[group]) matchedPolicies.push(group);

    const perms = PERMISSION_SETS[group];
    if (Array.isArray(perms)) {
      perms.forEach((p) => permissions.add(p));
    }
  }

  return {
    rawGroups: groups,
    matchedPolicies,
    permissions: Array.from(permissions),
  };
};

// ================================================
// ✅ Service Export
// ================================================
const AuthService = {
  PERMISSION_SETS,
  SECURITY_POLICIES,
  loginUser,
  registerUser,
  logoutUser,
  sendPasswordResetCode,
  confirmPasswordReset,
  extractPermissionsFromGroups,
};

export default AuthService;
