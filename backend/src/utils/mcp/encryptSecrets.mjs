// ============================================================================
// ✅ FILE: /backend/src/utils/mcp/encryptSecrets.mjs
// Handles secure encryption/decryption of customer credentials
// ============================================================================

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MCP_ENCRYPTION_KEY?.padEnd(32, '0'); // 32 chars
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  console.warn('[MCP] ⚠️ No MCP_ENCRYPTION_KEY set. Secrets will not be encrypted.');
}

export function encryptObject(obj) {
  if (!ENCRYPTION_KEY) return obj;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(obj));
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptObject(encryptedString) {
  if (!ENCRYPTION_KEY) return JSON.parse(encryptedString);

  const [ivHex, encryptedHex] = encryptedString.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}
