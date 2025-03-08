// 📌 File: /Users/patrick/Projects/Teralynk/backend/src/config/db.js

import pkg from "pg";
import dotenv from "dotenv";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

dotenv.config();

const { Client } = pkg;

// ✅ Create an AWS Secrets Manager Client
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

// ✅ Fetch database credentials from AWS Secrets Manager
const getDbCredentials = async () => {
  const secretName = process.env.SECRETS_MANAGER_NAME || "teralynk/env"; // Ensure correct secret name

  try {
    console.log("🔍 Fetching database credentials from AWS Secrets Manager...");
    const secretResponse = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretName }));

    if (!secretResponse.SecretString) {
      throw new Error("❌ No secret string found in AWS Secrets Manager response");
    }

    const secrets = JSON.parse(secretResponse.SecretString);
    console.log("✅ Database credentials loaded successfully.");
    
    return {
      user: secrets.DB_USER || process.env.DB_USER,
      host: secrets.DB_HOST || process.env.DB_HOST,
      database: secrets.DB_NAME || process.env.DB_NAME,
      password: secrets.DB_PASSWORD || process.env.DB_PASSWORD,
      port: secrets.DB_PORT ? parseInt(secrets.DB_PORT, 10) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432),
      ssl: { rejectUnauthorized: false }, // Enforce SSL in secure environments
    };
  } catch (error) {
    console.error("❌ Error fetching database credentials:", error.message);
    console.warn("⚠️ Falling back to local .env values...");

    return {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      ssl: { rejectUnauthorized: false },
    };
  }
};

// ✅ Singleton PostgreSQL client
let dbClient = null; // Make sure this is only declared once

const initializeDbConnection = async () => {
  if (!dbClient) {
    const credentials = await getDbCredentials();

    dbClient = new Client(credentials);

    try {
      await dbClient.connect();
      console.log("✅ PostgreSQL Connected Successfully at:", new Date().toISOString());
    } catch (error) {
      console.error("❌ PostgreSQL Connection Failed:", error.message);
      process.exit(1); // Terminate only if the database connection is critical
    }
  }

  return dbClient;
};

// ✅ Ensure we only export once
const dbInstance = await initializeDbConnection();
export { dbInstance as dbClient };
export default dbInstance;
