// ===================================================
// ✅ FILE: /backend/src/utils/secretManager.mjs
// AWS Secrets Manager integration for Teralynk
// Version: 1.2.0 — Fully hardened and ESM compliant
// ===================================================

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

import {
  fromEnv,
  fromIni,
  fromProcess,
  fromNodeProviderChain,
} from '@aws-sdk/credential-providers';

import { debugLog as logInfo } from '../utils/debug.mjs';
const logError = (...args) => logInfo('Error', ...args);

// ==========================
// 🔐 Secret Manager Factory
// ==========================
const createSecretsManagerClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const provider = fromNodeProviderChain({
    profile: process.env.AWS_PROFILE || 'default',
    timeout: 3000,
  });

  return new SecretsManagerClient({
    region,
    credentials: provider,
  });
};

// ==========================
// 🔑 Secret Fetch Function
// ==========================
export async function getSecretValue(secretId) {
  if (!secretId || typeof secretId !== 'string') {
    throw new Error(`Invalid secretId: ${secretId}`);
  }

  const client = createSecretsManagerClient();
  const command = new GetSecretValueCommand({ SecretId: secretId });

  try {
    const response = await client.send(command);
    if (response.SecretString) {
      const parsed = JSON.parse(response.SecretString);
      logInfo('SecretManager', `✅ Loaded secret: ${secretId}`);
      return parsed;
    } else {
      throw new Error(`Empty SecretString for ${secretId}`);
    }
  } catch (err) {
    logError('SecretManager', `❌ Failed to fetch ${secretId}`, err.message);
    throw err;
  }
}

// ==========================
// 🧪 Health Check
// ==========================
export async function testSecretAccess() {
  const testId = process.env.TEST_SECRET_ID;
  if (!testId) {
    logInfo('SecretManager', 'ℹ️ No TEST_SECRET_ID set, skipping test');
    return;
  }

  try {
    const secret = await getSecretValue(testId);
    logInfo('SecretManager', `🧪 Test fetch success for ${testId}: ${Object.keys(secret).length} keys`);
  } catch (err) {
    logError('SecretManager', `❌ Test fetch failed for ${testId}`, err.message);
  }
}
