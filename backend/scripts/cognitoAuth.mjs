// ✅ FILE: /backend/config/cognitoAuth.js

const crypto = require("crypto");
require("dotenv").config();
const { logSecurityEvent } = require("../src/logger/securityLogger");
const { generateTraceId } = require("../src/logger/traceUtil");

/**
 * ✅ Securely generates a Cognito SECRET_HASH using HMAC-SHA256
 * @param {string} username - Cognito username
 * @returns {string} - Base64-encoded SECRET_HASH
 * @throws {Error} With trace ID for telemetry if failed
 */
function generateSecretHash(username) {
  const traceId = generateTraceId();

  try {
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing Cognito Client ID or Secret in environment variables.");
    }

    if (!username) {
      throw new Error("Username is required for secret hash generation.");
    }

    const message = username + clientId;
    const hmac = crypto.createHmac("sha256", clientSecret);
    hmac.update(message);

    return hmac.digest("base64");
  } catch (err) {
    logSecurityEvent("cognito.secretHash.failure", {
      traceId,
      username,
      error: err.message,
    });

    throw new Error(`❌ SecretHash generation failed. Trace ID: ${traceId}`);
  }
}

module.exports = { generateSecretHash };
