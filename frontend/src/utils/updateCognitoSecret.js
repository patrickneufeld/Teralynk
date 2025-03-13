// ✅ File: /Users/patrick/Projects/Teralynk/frontend/src/utils/updateCognitoSecret.js

import { SecretsManagerClient, PutSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// === Configuration ===
const region = "us-east-1";
const secretName = "Teralynk_Cognito";

// === SecretsManager Client ===
const secretsClient = new SecretsManagerClient({ region });

/**
 * 🔐 Update Cognito secret in AWS Secrets Manager
 * @param {string} userPoolClientId - The Cognito App Client ID to store
 */
const updateSecret = async (userPoolClientId) => {
  if (!userPoolClientId) {
    throw new Error("userPoolClientId is required to update the secret.");
  }

  const secretPayload = {
    username: "test_user",
    password: "test_password",
    userPoolClientId,
  };

  try {
    const command = new PutSecretValueCommand({
      SecretId: secretName,
      SecretString: JSON.stringify(secretPayload),
    });

    await secretsClient.send(command);
    console.log(`✅ AWS Secrets Manager updated successfully for "${secretName}"`);
  } catch (error) {
    console.error(`❌ Failed to update secret "${secretName}":`, error.message || error);
  }
};

// === CLI Support (only runs if executed directly) ===
const isRunningDirectly = typeof process !== "undefined" &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].endsWith("updateCognitoSecret.js");

if (isRunningDirectly) {
  const userPoolClientId = process.argv[2];

  if (!userPoolClientId) {
    console.error("❌ Missing required argument.");
    console.log("📘 Usage: node updateCognitoSecret.js <userPoolClientId>");
    process.exit(1);
  }

  updateSecret(userPoolClientId);
}

export default updateSecret;
