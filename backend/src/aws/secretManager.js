// File Path: /Users/patrick/Projects/Teralynk/backend/src/aws/secretManager.js

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import dotenv from 'dotenv';
dotenv.config();

// Initialize SecretsManagerClient with your region
const secretClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

// Function to load secrets from AWS Secrets Manager
const loadSecrets = async () => {
    try {
        // Ensure the SECRET_NAME is set in the .env file
        const secretName = process.env.SECRET_NAME;
        if (!secretName) {
            console.error("❌ SECRET_NAME is missing in your .env file.");
            process.exit(1);
        }

        // Get secret from AWS Secrets Manager
        const secretResponse = await secretClient.send(
            new GetSecretValueCommand({ SecretId: secretName })
        );

        if (secretResponse.SecretString) {
            const secrets = JSON.parse(secretResponse.SecretString); // Parse the JSON string of secrets
            console.log("✅ Secrets Loaded Successfully:");
            console.log(secrets); // Optionally log the secrets for verification
            Object.assign(process.env, secrets); // Assign secret values to environment variables
        } else {
            console.error("❌ No Secret String found for Secret ID:", secretName);
        }
    } catch (error) {
        console.error("❌ Error retrieving secrets:", error.message);
        process.exit(1);
    }
};

// Load secrets when the app starts
loadSecrets();
