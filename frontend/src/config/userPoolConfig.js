// ✅ File Path: frontend/src/config/userPoolConfig.js

const userPoolConfig = {
  // ✅ AWS Region - Dynamically load or fall back to default
  region: process.env.REACT_APP_AWS_REGION || "us-east-1",

  // ✅ Cognito User Pool ID - Securely load from environment variables
  userPoolId: process.env.REACT_APP_USER_POOL_ID || "us-east-1_defaultPoolId",

  // ✅ Cognito App Client ID - Dynamically load or use default
  clientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || "defaultClientId",

  // ✅ Redirect URI for OAuth flows - Flexible for different deployment environments
  redirectUri: process.env.REACT_APP_REDIRECT_URI || "http://localhost:3000/auth/callback",

  // ✅ Optional: Add advanced Cognito configurations
  mandatorySignIn: process.env.REACT_APP_MANDATORY_SIGN_IN === "true" || true, // Default: enforce sign-in
  authenticationFlowType: process.env.REACT_APP_AUTH_FLOW_TYPE || "USER_PASSWORD_AUTH", // Example flow type
};

export default userPoolConfig;
