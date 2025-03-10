// ✅ File: /frontend/src/config/cognitoConfig.js
import { useSecrets } from "../components/SecretsFetcher";

/**
 * ✅ Dynamic Cognito Config from Secrets Context
 * This hook returns all required Cognito configuration values.
 */
const useCognitoConfig = () => {
  const secrets = useSecrets();

  return {
    // 🔐 Cognito User Pool ID
    userPoolId: secrets?.VITE_COGNITO_USER_POOL_ID || "us-east-1_defaultUserPoolId",

    // 🔐 Cognito App Client ID
    clientId: secrets?.VITE_COGNITO_CLIENT_ID || "defaultClientId",

    // 🌐 Redirect URI after login
    redirectUri: secrets?.VITE_COGNITO_REDIRECT_URI || "http://localhost:5173/auth/callback",

    // Optional: Cognito Identity Pool (for Federated Identities)
    identityPoolId: secrets?.VITE_COGNITO_IDENTITY_POOL_ID || null,

    // 🌎 AWS Region
    region: secrets?.VITE_AWS_REGION || "us-east-1",

    // 🔄 Auth flow strategy (password-based by default)
    authenticationFlowType: secrets?.VITE_AUTH_FLOW_TYPE || "USER_PASSWORD_AUTH",
  };
};

export default useCognitoConfig;
