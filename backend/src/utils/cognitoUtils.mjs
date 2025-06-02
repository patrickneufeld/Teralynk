// File: /backend/src/utils/cognitoUtils.js

import crypto from "crypto";
import dotenv from "dotenv";
import { logSecurityEvent } from "../logger/securityLogger.mjs";
import { generateTraceId } from "../logger/traceUtil.mjs";

dotenv.config();

/**
 * ✅ Securely generates a Cognito SECRET_HASH for authentication
 * @param {string} username - Cognito username
 * @returns {string} - Base64-encoded HMAC-SHA256 secret hash
 * @throws {Error} With detailed trace ID if validation fails
 */
export function generateSecretHash(username) {
  const traceId = generateTraceId();

  try {
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing COGNITO_CLIENT_ID or COGNITO_CLIENT_SECRET in environment.");
    }

    if (!username) {
      throw new Error("Username is required to generate secret hash.");
    }

    const message = username + clientId;
    const hmac = crypto.createHmac("sha256", clientSecret);
    hmac.update(message);
    const secretHash = hmac.digest("base64");

    return secretHash;
  } catch (err) {
    logSecurityEvent("cognito.secretHash.failure", {
      traceId,
      username,
      error: err.message,
    });

    throw new Error(`Secret hash generation failed. Trace ID: ${traceId}`);
  }
}
