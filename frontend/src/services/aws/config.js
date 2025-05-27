// ✅ File: /frontend/src/services/aws/config.js

export const getCognitoConfig = () => {
  return {
    region: import.meta.env.VITE_AWS_REGION || "us-east-1",
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
    clientSecret: import.meta.env.VITE_COGNITO_CLIENT_SECRET || "",
  };
};

export const getAwsSecrets = () => {
  return {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || "",
  };
};
