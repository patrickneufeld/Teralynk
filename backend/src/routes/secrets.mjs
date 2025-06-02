// ✅ File: /Users/patrick/Projects/Teralynk/backend/src/routes/secrets.js

import express from "express";
import dotenv from "dotenv";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

dotenv.config();

const router = express.Router();

// ✅ Fetch secrets once and cache them
let cachedSecrets = null;

const secretName = (process.env.SECRETS_MANAGER_NAME || "teralynk/env").trim();
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

async function fetchSecrets() {
  if (cachedSecrets) return cachedSecrets;

  console.log(`🔍 Fetching secrets from AWS: ${secretName}`);
  const secretData = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretName }));

  if (!secretData.SecretString) throw new Error("Empty SecretString from AWS");

  const parsed = JSON.parse(secretData.SecretString.trim());

  const requiredKeys = ["VITE_API_URL", "FRONTEND_URL"];
  const missing = requiredKeys.filter((key) => !parsed[key]);

  if (missing.length) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }

  cachedSecrets = parsed;
  return parsed;
}

// ✅ GET /api/secrets
router.get("/", async (req, res) => {
  try {
    const secrets = await fetchSecrets();
    res.json(secrets);
  } catch (err) {
    console.error("❌ Error returning secrets:", err.message);
    res.status(500).json({ error: "Failed to load secrets" });
  }
});

export default router;
