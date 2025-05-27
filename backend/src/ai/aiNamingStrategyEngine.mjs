// File: /backend/src/ai/aiNamingStrategyEngine.js

import { suggestFilename, learnFromUserFiles, addPersonaTemplate } from './aiNamingTemplateEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';
import {
  recordNamingHistory,
  getUserNamingHistory,
  fetchUserHistoryPatterns,
} from './aiNamingHistoryService.mjs';

/**
 * Generates a smart filename based on user role, persona, history, and file metadata.
 * @param {Object} options
 * @param {string} options.userId
 * @param {string} options.originalName
 * @param {string} options.mimeType
 * @param {Object} options.metadata
 * @param {string} options.role
 * @param {string} options.persona
 * @param {Array<Object>} options.namingHistory
 * @param {Array<string>} [options.tags=[]]
 * @returns {Promise<string>}
 */
export async function generateSmartName({
  userId,
  originalName,
  mimeType,
  metadata,
  role,
  persona,
  namingHistory,
  tags = [],
}) {
  try {
    const context = {
      ...metadata,
      ...parseTags(tags),
      role,
      mimeType,
    };

    // 1. Learn from recent history (if any)
    const recentPatterns = await fetchUserHistoryPatterns(userId);
    if (recentPatterns.length) {
      learnFromUserFiles(persona, recentPatterns);
    }

    // 2. Generate a filename using persona-aligned strategy
    const filename = suggestFilename(persona, context);

    // 3. Persist to historical context
    await saveNamingHistory(userId, {
      originalName,
      generatedName: filename,
      metadata,
      tags,
      role,
      persona,
    });

    logInfo(`🧠 Smart name generated: ${filename}`);
    return filename;
  } catch (err) {
    logError(`❌ generateSmartName failed for ${originalName}`, err);
    return fallbackName(originalName);
  }
}

function fallbackName(original) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${original.split('.')[0]}_fallback_${timestamp}`;
}

function parseTags(tags = []) {
  const out = {};
  for (const tag of tags) {
    const [key, value] = tag.split(':');
    if (key && value) out[key.trim()] = value.trim();
  }
  return out;
}

/**
 * Internal wrapper to record history using the naming history service.
 */
async function saveNamingHistory(userId, data) {
  try {
    await recordNamingHistory(userId, data);
  } catch (err) {
    logError(`❌ Failed to save naming history for user ${userId}`, err);
  }
}

/**
 * Allows external systems to pretrain naming logic.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function learnFromHistory(userId) {
  try {
    const patterns = await fetchUserHistoryPatterns(userId);
    if (patterns.length) {
      await learnFromUserFiles('default', patterns);
    }
    return patterns;
  } catch (err) {
    logError(`❌ learnFromHistory failed for ${userId}`, err);
    return [];
  }
}
