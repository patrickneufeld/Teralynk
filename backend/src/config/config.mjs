import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import dotenv from "dotenv";

// ✅ Load local .env file for development
dotenv.config();

// ✅ Set the correct secret name from ENV or default
const rawSecretName = process.env.SECRETS_MANAGER_NAME || "teralynk/env";
const secretName = rawSecretName.trim();

console.log(`🔍 Using AWS Secrets Manager Name: "${secretName}"`);

// ✅ Validate secret name format
if (!/^[a-zA-Z0-9-/_+=.@]+$/.test(secretName)) {
  console.error(`❌ ERROR: Invalid secret name format: "${secretName}"`);
  process.exit(1);
}

// ✅ Initialize AWS Secrets Manager Client
const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

async function getSecrets() {
  try {
    console.log("🔍 Fetching AWS Secrets from Secrets Manager...");

    // ✅ Fetch all secrets from AWS Secrets Manager
    const secretData = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretName }));

    if (!secretData.SecretString) {
      console.error("❌ AWS Secrets Manager returned an empty SecretString.");
      process.exit(1);
    }

    console.log("🔍 Raw SecretString Received."); // Debugging output

    const secrets = JSON.parse(secretData.SecretString.trim());

    // ✅ Define required and optional environment variables
    const requiredKeys = [
      "PORT", "NODE_ENV", "AWS_REGION", "DB_HOST", "DB_NAME", "DB_USER", 
      "DB_PASSWORD", "DB_PORT", "COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID",
      "COGNITO_CLIENT_SECRET", "JWT_SECRET", "OPENAI_API_KEY"
    ];

    const optionalKeys = [
      "VITE_API_URL", "FRONTEND_URL", "BUCKET_NAME", "DB_CONNECTION_STRING",
      "REDIS_URL", "RABBITMQ_URL", "ENABLE_RATE_LIMITING", "LOG_LEVEL",
      "LOG_STORAGE", "DEBUG", "COGNITO_REGION", "COGNITO_AUTH_DOMAIN",
      "COGNITO_REDIRECT_URI", "COGNITO_LOGOUT_URI", "AI_MODEL_NAME",
      "AI_PERFORMANCE_LOGGING", "AI_ERROR_TRACKING", "AI_SELF_OPTIMIZATION",
      "AI_LOGGING_STORAGE", "EMAIL_NOTIFICATIONS_ENABLED", "NOTIFICATION_STORAGE",
      "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_STORAGE_BUCKET",
      "S3_REGION", "FRONTEND_BASE_URL", "BACKEND_BASE_URL"
    ];

    // ✅ Ensure all required keys are set
    const missingKeys = [];
    requiredKeys.forEach((key) => {
      if (secrets[key]) {
        process.env[key] = secrets[key].trim(); // Trim whitespace for safety
      } else {
        console.error(`❌ MISSING Required ENV Variable: ${key}`);
        missingKeys.push(key);
      }
    });

    // ✅ Handle optional keys
    optionalKeys.forEach((key) => {
      if (secrets[key]) {
        process.env[key] = secrets[key].trim();
      }
    });

    console.log("✅ AWS Secrets Loaded Successfully.");

    // ✅ Log missing required environment variables
    if (missingKeys.length > 0) {
      console.warn(`⚠️ Missing Required ENV Variables: ${missingKeys.join(", ")}`);
      console.warn("⚠️ Application may not work as expected.");
      process.exit(1);
    }

    // ✅ Explicitly check for `OPENAI_API_KEY`
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ ERROR: Missing `OPENAI_API_KEY`. Check AWS Secrets Manager.");
      process.exit(1);
    }

    // ✅ Debugging: Log critical variables
    console.log("🔍 Loaded Cognito Variables:");
    console.log("   - COGNITO_USER_POOL_ID:", process.env.COGNITO_USER_POOL_ID || "❌ MISSING");
    console.log("   - COGNITO_CLIENT_ID:", process.env.COGNITO_CLIENT_ID || "❌ MISSING");
    console.log("   - COGNITO_CLIENT_SECRET:", process.env.COGNITO_CLIENT_SECRET ? "✔️ LOADED" : "❌ MISSING");

    return secrets; // ✅ Return secrets for further use if needed
  } catch (error) {
    console.error("❌ AWS Secrets Manager Error:", error.message);
    process.exit(1);
  }
}

// ✅ Export function to load secrets
export default getSecrets;
