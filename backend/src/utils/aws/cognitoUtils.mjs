// File: /backend/src/utils/aws/cognitoUtils.mjs

import crypto from 'crypto';
import { logInfo, logError } from '../logging/index.mjs';

/**
 * ✅ Securely generates a Cognito SECRET_HASH for authentication
 * @param {string} username - Cognito username
 * @returns {string} - Base64-encoded HMAC-SHA256 secret hash
 * @throws {Error} With detailed trace ID if validation fails
 */
export function generateSecretHash(username) {
  const traceId = crypto.randomBytes(8).toString('hex');

  try {
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;

    // Enhanced validation and logging
    console.log('Cognito credentials check:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length,
      username: username?.substring(0, 3) + '...',
      traceId
    });

    if (!clientId || !clientSecret) {
      throw new Error('Missing COGNITO_CLIENT_ID or COGNITO_CLIENT_SECRET in environment.');
    }

    if (!username) {
      throw new Error('Username is required to generate secret hash.');
    }

    const message = username + clientId;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(message);
    const secretHash = hmac.digest('base64');

    return secretHash;
  } catch (err) {
    logError('cognito.secretHash.failure', {
      traceId,
      username: username?.substring(0, 3) + '...',
      error: err.message,
    });

    throw new Error(`Secret hash generation failed: ${err.message}. Trace ID: ${traceId}`);
  }
}
