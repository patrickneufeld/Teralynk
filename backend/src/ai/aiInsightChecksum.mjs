// /backend/src/ai/aiInsightChecksum.js

import { createHash } from 'crypto';
import logger from '../utils/logger.mjs'; // ✅ fixed default import

/**
 * Generates a SHA-256 checksum from a given data string or Buffer.
 * This is used to validate insight integrity and detect tampering.
 *
 * @param {string|Buffer} data
 * @returns {string} SHA-256 checksum (hex encoded)
 */
export function computeChecksum(data) {
  try {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
    return createHash('sha256').update(buffer).digest('hex');
  } catch (err) {
    logger.error('Failed to compute checksum for insight', { error: err });
    throw new Error('Checksum computation failed');
  }
}

/**
 * Validates that the checksum matches the expected value.
 *
 * @param {string|Buffer} data - The data to validate.
 * @param {string} expectedChecksum - The expected SHA-256 checksum.
 * @returns {boolean} Whether the data is valid.
 */
export function isChecksumValid(data, expectedChecksum) {
  try {
    const actualChecksum = computeChecksum(data);
    return actualChecksum === expectedChecksum;
  } catch (err) {
    logger.error('Checksum validation failed', { error: err });
    return false;
  }
}
