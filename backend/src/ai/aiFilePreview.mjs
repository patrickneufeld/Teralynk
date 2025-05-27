// ✅ FILE: /backend/src/ai/aiFilePreview.mjs

/**
 * AI File Preview Module
 * Provides intelligent previews of supported file types using AI models or summarization techniques.
 * Integrates with PostgreSQL and storage layer for metadata and content fetch.
 */

import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';
import { summarizeText, extractKeyPoints } from './nlp/aiSummarizer.mjs'; // hypothetical summarization module
import { getFileContentById } from './aiFileManager.mjs'; // file fetch utility

/**
 * Fetch and preview the content of a given file by ID with summarization.
 * 
 * @param {string} fileId - Unique identifier for the file
 * @param {Object} options - Preview configuration
 * @param {boolean} [options.includeKeyPoints=false] - Whether to include key point extraction
 * @returns {Promise<Object>} - Summarized preview of file
 */
export async function generateFilePreview(fileId, options = {}) {
  try {
    const { includeKeyPoints = false } = options;

    // Retrieve file content
    const fileData = await getFileContentById(fileId);
    if (!fileData || !fileData.content) {
      throw new Error(`No content found for file ID: ${fileId}`);
    }

    // Generate AI summary
    const summary = await summarizeText(fileData.content);
    const keyPoints = includeKeyPoints ? await extractKeyPoints(fileData.content) : [];

    // Log usage
    await query(
      `INSERT INTO ai_logs (action, target_id, metadata)
       VALUES ('generatePreview', $1, $2)`,
      [fileId, { summaryLength: summary?.length, keyPointsIncluded: includeKeyPoints }]
    );

    return {
      fileId,
      summary,
      ...(includeKeyPoints && { keyPoints }),
      generatedAt: new Date().toISOString(),
    };

  } catch (error) {
    logger.logError('generateFilePreview failed', { error, fileId });
    throw new Error('Failed to generate file preview');
  }
}

export default {
  generateFilePreview,
};
