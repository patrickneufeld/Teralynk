import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiFileSearch.mjs

import { query } from '../config/db.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

/**
 * Search user files by filename, tag, or content keyword.
 * Supports full-text search across indexed file metadata.
 * 
 * @param {Object} options
 * @param {string} options.userId - Authenticated user ID
 * @param {string} options.query - Search keyword or phrase
 * @param {string} [options.type] - Optional file type filter (e.g., 'pdf', 'docx')
 * @returns {Promise<Object[]>} Matching file metadata
 */
export async function searchUserFiles({ userId, query: keyword, type }) {
  try {
    logInfo('🔍 Initiating file search', { userId, keyword, type });

    const values = [userId, `%${keyword}%`];
    let sql = `
      SELECT *
      FROM user_files
      WHERE user_id = $1
        AND (
          filename ILIKE $2
          OR tags ILIKE $2
          OR content_preview ILIKE $2
        )
    `;

    if (type) {
      sql += ' AND file_type = $3';
      values.push(type);
    }

    const result = await query(sql, values);
    logInfo('✅ File search completed', {
      userId,
      keyword,
      resultCount: result.rows.length,
    });

    return result.rows;
  } catch (error) {
    logError('❌ File search failed', { error, userId, keyword });
    throw new Error('Failed to search user files');
  }
}

/**
 * Fetch search suggestions from recent queries and metadata.
 * This enhances predictive typing UX on the frontend.
 * 
 * @param {string} userId - Current user
 * @returns {Promise<string[]>} Array of suggested search terms
 */
export async function getSearchSuggestions(userId) {
  try {
    const result = await query(
      `
      SELECT DISTINCT unnest(string_to_array(tags, ',')) AS tag
      FROM user_files
      WHERE user_id = $1
      LIMIT 20
      `,
      [userId]
    );

    const suggestions = result.rows.map((row) => row.tag.trim()).filter(Boolean);
    logInfo('✅ Search suggestions retrieved', {
      userId,
      count: suggestions.length,
    });

    return suggestions;
  } catch (error) {
    logError('❌ Failed to retrieve search suggestions', { error, userId });
    return [];
  }
}

export default {
  searchUserFiles,
  getSearchSuggestions,
};
