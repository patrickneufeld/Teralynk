// /Users/patrick/Projects/Teralynk/frontend/src/utils/awsCognitoClient.js

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

/**
 * ✅ AWS Cognito Client Module
 * Dynamically loads AWS configuration and provides a Cognito client.
 */

const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || "us-east-1",
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "mock-user-pool-id",
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "mock-client-id",
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
};

// ✅ Validate Required AWS Configurations
const requiredConfigKeys = ["region", "userPoolId", "userPoolWebClientId"];
requiredConfigKeys.forEach((key) => {
  if (!awsConfig[key]) {
    console.error(`❌ Missing AWS Config: ${key} is undefined.`);
  }
});

// ✅ CognitoIdentityProviderClient instance
const cognitoClient = new CognitoIdentityProviderClient({
  region: awsConfig.region,
  credentials:
    awsConfig.accessKeyId && awsConfig.secretAccessKey
      ? {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        }
      : undefined, // Use default credentials if keys are not explicitly provided
});

/**
 * ✅ Helper function to get Cognito Client instance
 */
const getCognitoClient = () => cognitoClient;

// ✅ Export the awsConfig, cognitoClient, and helper function explicitly
export { awsConfig, cognitoClient, getCognitoClient };

