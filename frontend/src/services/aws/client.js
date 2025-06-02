// File: /frontend/src/services/aws/client.js

import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

/**
 * AWS Cognito Client initialized with region and credentials
 * loaded from environment variables or SecretsFetcher context.
 */
const client = new CognitoIdentityProviderClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ""
  }
});

export default client;
