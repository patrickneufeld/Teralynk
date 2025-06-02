// ================================================
// ✅ File: /frontend/src/services/aws/config.js
// AWS Cognito and Credential Configuration Utility
// ================================================

/**
 * Returns configuration for AWS Cognito User Pool
 * Fallbacks are provided to prevent runtime crashes
 */
export const getCognitoConfig = () => {
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
  const clientSecret = import.meta.env.VITE_COGNITO_CLIENT_SECRET || '';

  if (!userPoolId || !clientId) {
    console.warn('⚠️ Missing Cognito configuration: check VITE_COGNITO_* env vars');
  }

  return { region, userPoolId, clientId, clientSecret };
};

/**
 * Returns AWS SDK credentials (used for signed requests)
 */
export const getAwsSecrets = () => {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
  const sessionToken = import.meta.env.VITE_AWS_SESSION_TOKEN || '';

  if (!accessKeyId || !secretAccessKey) {
    console.warn('⚠️ Missing AWS credentials: check VITE_AWS_* env vars');
  }

  return { accessKeyId, secretAccessKey, sessionToken };
};
