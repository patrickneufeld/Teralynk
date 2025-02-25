// ✅ FILE: backend/config/cognitoAuth.js

const crypto = require("crypto");
const base64 = require("base-64");
require("dotenv").config();

/**
 * Generate a SECRET_HASH for Cognito authentication
 * @param {string} username - Cognito username
 * @returns {string} - Computed SECRET_HASH
 */
function generateSecretHash(username) {
  if (!process.env.COGNITO_CLIENT_ID || !process.env.COGNITO_CLIENT_SECRET) {
    throw new Error("Missing Cognito Client ID or Secret in environment variables.");
  }

  const message = username + process.env.COGNITO_CLIENT_ID;
  const hmac = crypto.createHmac("sha256", process.env.COGNITO_CLIENT_SECRET);
  hmac.update(message);
  return base64.encode(hmac.digest());
}

module.exports = { generateSecretHash };
