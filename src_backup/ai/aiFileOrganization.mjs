// ✅ FILE: /backend/src/ai/aiFileOrganization.mjs

/**
 * AI File Organization Module
 * ----------------------------------------------
 * Responsible for clustering, tagging, and organizing
 * files based on content, metadata, and AI-driven heuristics.
 * ----------------------------------------------
 * Dependencies: PostgreSQL, AI classification pipeline
 */

import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * Organize a batch of files by category based on AI-tagged metadata.
 * 
 * @param {Array<Object>} files - Array of file metadata objects
 * @returns {Promise<Array<Object>>} Organized file structure
 */
export async function organizeFilesByCategory(files = []) {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for organization');
    }

    const categorized = {};

    for (const file of files) {
      const { id, name, metadata = {} } = file;
      const category = metadata.category || 'uncategorized';

      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({ id, name, ...metadata });
    }

    logger.logInfo('Files successfully categorized', { count: files.length });
    return categorized;
  } catch (error) {
    logger.logError('organizeFilesByCategory failed', { error });
    throw error;
  }
}

/**
 * Persist file classification results to the database.
 * 
 * @param {string} fileId - File's UUID
 * @param {string} category - AI-assigned category
 * @param {string} confidence - Classification confidence (0–1)
 * @returns {Promise<void>}
 */
export async function saveFileClassification(fileId, category, confidence) {
  try {
    await query(
      `INSERT INTO file_classifications (file_id, category, confidence)
       VALUES ($1, $2, $3)
       ON CONFLICT (file_id) DO UPDATE
       SET category = EXCLUDED.category, confidence = EXCLUDED.confidence`,
      [fileId, category, confidence]
    );
    logger.logInfo('File classification saved', { fileId, category, confidence });
  } catch (error) {
    logger.logError('saveFileClassification failed', { error, fileId });
    throw error;
  }
}

/**
 * Retrieve classification metadata for a file.
 * 
 * @param {string} fileId - File's UUID
 * @returns {Promise<Object|null>}
 */
export async function getFileClassification(fileId) {
  try {
    const result = await query(
      `SELECT file_id, category, confidence, updated_at
       FROM file_classifications
       WHERE file_id = $1`,
      [fileId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.logError('getFileClassification failed', { error, fileId });
    throw error;
  }
}

export default {
  organizeFilesByCategory,
  saveFileClassification,
  getFileClassification
};
