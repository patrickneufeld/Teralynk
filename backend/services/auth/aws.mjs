// File: backend/services/auth/aws.js

import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import dotenv from "dotenv";

dotenv.config();

let cognitoClientInstance = null;

/**
 * Initializes and returns the CognitoIdentityProviderClient
 * Ensures singleton behavior.
 * @returns {CognitoIdentityProviderClient}
 */
export const getCognitoClient = () => {
  if (!cognitoClientInstance) {
    const region = process.env.COGNITO_REGION || "us-east-1";

    if (!region) {
      console.error("❌ AWS region is not configured");
      throw new Error("AWS region is missing for Cognito client");
    }

    cognitoClientInstance = new CognitoIdentityProviderClient({ region });
    console.info("✅ CognitoIdentityProviderClient initialized");
  }
  return cognitoClientInstance;
};
