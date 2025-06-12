// File: /backend/src/ai/aiFileMetadataAnalyzer.js

import path from 'path';
import mime from 'mime-types';
import { logInfo, logError } from '../utils/logging/logging.mjs';

/**
 * Extracts relevant metadata from file name, type, and content.
 * This includes extension, inferred keywords, and potential purpose.
 * @param {Object} options
 * @param {string} options.originalName
 * @param {string} options.mimeType
 * @param {Buffer|string} options.content
 * @returns {Promise<Object>} - Metadata object for AI use
 */
export async function extractFileMetadata({ originalName, mimeType, content }) {
  try {
    const extension = path.extname(originalName).replace('.', '').toLowerCase();
    const baseName = path.basename(originalName, path.extname(originalName));
    const keywords = [];

    if (baseName.match(/invoice|receipt|payment/i)) keywords.push('finance');
    if (baseName.match(/lecture|syllabus|notes/i)) keywords.push('education');
    if (baseName.match(/track|mix|audio/i)) keywords.push('music');
    if (baseName.match(/script|test|module/i)) keywords.push('code');
    if (baseName.match(/design|mockup|figma/i)) keywords.push('design');

    const inferredMime = mime.lookup(extension) || mimeType || 'application/octet-stream';

    return {
      extension,
      mimeType: inferredMime,
      keywords,
      fileSizeKB: Buffer.byteLength(content) / 1024
    };
  } catch (err) {
    logError(`❌ Error extracting metadata for file ${originalName}:`, err);
    return {
      extension: 'unknown',
      mimeType: 'unknown',
      keywords: [],
      fileSizeKB: 0
    };
  }
}
