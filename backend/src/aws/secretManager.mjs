// ================================================
// ✅ FILE: /backend/src/aws/secretManager.mjs
// AWS Secrets Manager Loader for Teralynk Backend
// ================================================

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import dotenv from 'dotenv';

dotenv.config(); // Load .env first (fallback)

// 🛑 Required for AWS operation
const region = process.env.AWS_REGION;
const secretName = process.env.SECRET_NAME;

if (!region) {
  console.error('❌ FATAL: AWS_REGION is missing from .env or env vars.');
  process.exit(1);
}
if (!secretName) {
  console.error('❌ FATAL: SECRET_NAME is missing from .env or env vars.');
  process.exit(1);
}

const secretClient = new SecretsManagerClient({ region });

// Optional: You can require specific keys like JWT_SECRET to be present in secrets
const REQUIRED_SECRET_KEYS = [
  'JWT_SECRET',
  'COGNITO_CLIENT_ID',
  'COGNITO_CLIENT_SECRET',
  'COGNITO_USER_POOL_ID'
];

/**
 * Loads secrets from AWS Secrets Manager and merges them into process.env
 * @param {Object} options
 * @param {boolean} options.log - Whether to log loaded keys
 * @returns {Promise<object>} The secrets object
 */
export async function loadSecrets({ log = false } = {}) {
  try {
    const response = await secretClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    if (!response.SecretString) {
      console.error(`❌ FATAL: No SecretString found for Secret ID: ${secretName}`);
      process.exit(1);
    }

    const secrets = JSON.parse(response.SecretString);

    // 🔐 Inject only if not already defined in process.env
    for (const [key, value] of Object.entries(secrets)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }

    // ✅ Validate required secret keys
    const missing = REQUIRED_SECRET_KEYS.filter(
      (key) => !process.env[key] || process.env[key].length < 8
    );
    if (missing.length > 0) {
      console.error(`❌ FATAL: Missing or invalid secrets: ${missing.join(', ')}`);
      process.exit(1);
    }

    if (log || process.env.NODE_ENV !== 'production') {
      console.log('✅ Secrets loaded (keys):', Object.keys(secrets));
    }

    return secrets;
  } catch (err) {
    console.error('❌ FATAL: Failed to load secrets from AWS:', err);
    process.exit(1);
  }
}

// Immediately load secrets at module startup
await loadSecrets();
