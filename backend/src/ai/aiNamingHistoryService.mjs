import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiNamingHistoryService.js

import AiNamingHistory from './aiNamingHistoryModel.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';

/**
 * Records a new filename entry to the naming history database.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.originalName
 * @param {string} params.suggestedName
 * @param {string} params.mimeType
 * @param {string[]} [params.tags=[]]
 * @returns {Promise<void>}
 */
export async function recordNamingHistory({ userId, originalName, suggestedName, mimeType, tags = [] }) {
  try {
    await AiNamingHistory.create({
      userId,
      originalName,
      suggestedName,
      mimeType,
      tags,
    });

    logInfo(`📚 Naming history recorded for user ${userId}: "${originalName}" → "${suggestedName}"`);
  } catch (error) {
    logError('❌ Failed to record naming history:', error);
  }
}

/**
 * Retrieves the last 50 naming entries for a user to power pattern recognition.
 * @param {string} userId
 * @returns {Promise<Array>} Array of { originalName, suggestedName, mimeType, tags }
 */
export async function getUserNamingHistory(userId) {
  try {
    const history = await AiNamingHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return history.map(entry => ({
      originalName: entry.originalName,
      suggestedName: entry.suggestedName,
      mimeType: entry.mimeType,
      tags: entry.tags,
    }));
  } catch (error) {
    logError('❌ Failed to fetch naming history:', error);
    return [];
  }
}

/**
 * Converts user naming history into pattern input for AI learning.
 * @param {string} userId
 * @returns {Promise<Array>} Array of pattern objects
 */
export async function fetchUserHistoryPatterns(userId) {
  try {
    const history = await getUserNamingHistory(userId);
    return history.map(entry => ({
      name: entry.suggestedName,
      mimeType: entry.mimeType,
      tags: entry.tags,
    }));
  } catch (error) {
    logError('❌ Failed to extract patterns from naming history:', error);
    return [];
  }
}

/**
 * Retrieves all entries across users for analysis and persona aggregation.
 * @returns {Promise<Array>}
 */
export async function getAllNamingHistory() {
  try {
    const history = await AiNamingHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1000,
    });

    return history;
  } catch (error) {
    logError('❌ Error retrieving global naming history:', error);
    return [];
  }
}
