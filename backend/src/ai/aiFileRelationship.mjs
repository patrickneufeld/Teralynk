import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
import { query } from '../config/db.mjs';
import logger from '../utils/logger.mjs';

/**
 * Analyzes file relationships based on metadata, tags, references, or workflows.
 * Builds graph-style connections between user files.
 * 
 * @param {number} userId - Authenticated user ID
 * @param {Object[]} files - Array of file metadata objects
 * @returns {Promise<Object>} Graph of relationships (nodes and edges)
 */
export async function analyzeFileRelationships(userId, files = []) {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for relationship analysis.');
    }

    const nodes = [];
    const edges = [];

    // Index by ID for cross-reference lookup
    const fileMap = new Map(files.map(file => [file.id, file]));

    for (const file of files) {
      const { id, filename, tags = [], references = [] } = file;
      nodes.push({ id, label: filename });

      for (const refId of references) {
        if (fileMap.has(refId)) {
          edges.push({
            from: id,
            to: refId,
            label: 'references',
            type: 'internal',
          });
        } else {
          edges.push({
            from: id,
            to: refId,
            label: 'external-reference',
            type: 'external',
          });
        }
      }

      for (const tag of tags) {
        edges.push({
          from: id,
          to: `tag-${tag}`,
          label: 'tagged',
          type: 'tag',
        });
        if (!nodes.find(n => n.id === `tag-${tag}`)) {
          nodes.push({ id: `tag-${tag}`, label: tag, group: 'tag' });
        }
      }
    }

    return { nodes, edges };
  } catch (error) {
    logger.logError('analyzeFileRelationships failed', { error, userId });
    throw error;
  }
}

/**
 * Loads basic file metadata for the user from the database.
 * 
 * @param {number} userId
 * @returns {Promise<Object[]>}
 */
export async function loadUserFileMetadata(userId) {
  try {
    const result = await query(
      `SELECT id, filename, tags, references
       FROM user_files
       WHERE user_id = $1 AND is_deleted = false`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.logError('loadUserFileMetadata failed', { error, userId });
    throw error;
  }
}

/**
 * Main entry point for file relationship analysis.
 * 
 * @param {number} userId
 * @returns {Promise<Object>} Relationship graph for visualization
 */
export async function generateFileRelationshipGraph(userId) {
  try {
    const files = await loadUserFileMetadata(userId);
    return await analyzeFileRelationships(userId, files);
  } catch (error) {
    logger.logError('generateFileRelationshipGraph failed', { error, userId });
    throw error;
  }
}

export default {
  generateFileRelationshipGraph,
  analyzeFileRelationships,
  loadUserFileMetadata,
};
