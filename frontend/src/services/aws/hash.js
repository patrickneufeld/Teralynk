// File: /frontend/src/services/aws/hash.js

/**
 * Generates a Cognito-compatible secret hash using Web Crypto API.
 * This replaces insecure btoa or Buffer usage.
 *
 * @param {string} username
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {Promise<string>} base64-encoded HMAC SHA256 hash
 */
export async function generateSecretHash(username, clientId, clientSecret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(username + clientId);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(clientSecret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );
  
    const signature = await crypto.subtle.sign("HMAC", key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  