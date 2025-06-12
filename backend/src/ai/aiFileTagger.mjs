import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
/**
 * AI File Tagging Module
 * Automatically assigns intelligent tags to files based on content,
 * metadata, and historical tagging behavior using rule-based + ML pipelines.
 */

import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

/**
 * Generate intelligent tags based on file content and metadata
 * @param {object} fileMeta - File metadata (name, size, type)
 * @param {string} content - File content (plain text or parsed text)
 * @returns {Promise<string[]>} - Array of suggested tags
 */
export async function generateTags(fileMeta, content) {
  try {
    logInfo('🏷️ Generating tags for file', { file: fileMeta.name });

    const tags = new Set();

    // Basic keyword detection
    if (/invoice|receipt|payment/i.test(content)) tags.add('Finance');
    if (/project|timeline|milestone/i.test(content)) tags.add('Project');
    if (/contract|agreement|terms/i.test(content)) tags.add('Legal');
    if (/AI|machine learning|model/i.test(content)) tags.add('AI');

    // File type-based tag
    if (fileMeta.type === 'application/pdf') tags.add('PDF');
    if (fileMeta.type?.includes('spreadsheet')) tags.add('Spreadsheet');

    // Fallback tag
    if (tags.size === 0) tags.add('General');

    const result = Array.from(tags);
    logInfo('✅ Tags generated', { tags: result });
    return result;
  } catch (error) {
    logError('❌ Tag generation failed', { error });
    return ['Uncategorized'];
  }
}

/**
 * Save tags to database for future file retrieval and search
 * @param {string} fileId 
 * @param {string[]} tags 
 */
export async function saveFileTags(fileId, tags) {
  try {
    await query(
      `INSERT INTO file_tags (file_id, tag)
       SELECT $1, unnest($2::text[])`,
      [fileId, tags]
    );
    logInfo('📌 Tags saved for file', { fileId, tags });
  } catch (error) {
    logError('❌ Failed to save tags', { error });
  }
}

/**
 * Retrieve tags associated with a specific file
 * @param {string} fileId 
 * @returns {Promise<string[]>}
 */
export async function getFileTags(fileId) {
  try {
    const result = await query(
      `SELECT tag FROM file_tags WHERE file_id = $1`,
      [fileId]
    );
    return result.rows.map(r => r.tag);
  } catch (error) {
    logError('❌ Failed to fetch file tags', { error });
    return [];
  }
}

export default {
  generateTags,
  saveFileTags,
  getFileTags,
};
