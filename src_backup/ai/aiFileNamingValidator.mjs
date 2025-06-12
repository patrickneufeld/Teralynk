// File: /backend/src/ai/aiFileNamingValidator.js

import mime from 'mime-types';

/**
 * Validates incoming payload for AI file naming requests.
 * @param {Object} payload - Incoming payload from the client.
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateFileNamingInput(payload) {
  const { userId, originalName, mimeType, content } = payload;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return { valid: false, message: 'Invalid or missing userId' };
  }

  if (!originalName || typeof originalName !== 'string' || originalName.trim() === '') {
    return { valid: false, message: 'Invalid or missing originalName' };
  }

  if (!mimeType || typeof mimeType !== 'string' || mime.lookup(mimeType) === false) {
    return { valid: false, message: 'Invalid or missing MIME type' };
  }

  if (!content || (typeof content !== 'string' && !Buffer.isBuffer(content))) {
    return { valid: false, message: 'Missing or invalid file content' };
  }

  return { valid: true };
}
