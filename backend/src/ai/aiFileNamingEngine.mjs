import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiFileNamingEngine.js

import { detectUserRole, detectUserPersona, addNewPersonaIfNeeded } from './aiUserRoleProfiler.mjs';
import { extractFileMetadata } from './aiFileMetadataAnalyzer.mjs';
import { generateSmartName, learnFromHistory } from './aiNamingStrategyEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';

/**
 * AI-based smart filename generator.
 * Uses metadata, user history, tags, persona, role, and file content to generate adaptive file names.
 * Continuously learns from user preferences and naming behavior.
 * 
 * @param {Object} options
 * @param {string} options.userId - The ID of the uploading user.
 * @param {string} options.originalName - Original file name.
 * @param {string} options.mimeType - MIME type of the uploaded file.
 * @param {Buffer|string} options.content - File content, used for metadata and context analysis.
 * @param {string[]} [options.tags=[]] - Optional tags attached by the user.
 * @returns {Promise<string>} - AI-generated smart file name.
 */
export async function generateAIFileName({ userId, originalName, mimeType, content, tags = [] }) {
  try {
    logInfo(`🧠 AI Naming Engine triggered for user: ${userId}, file: ${originalName}`);

    // Analyze file metadata
    const metadata = await extractFileMetadata({ originalName, mimeType, content });

    // Detect role and persona
    const role = await detectUserRole(userId);
    let persona = await detectUserPersona(userId);

    if (!persona || persona === 'unknown') {
      persona = await addNewPersonaIfNeeded(userId, metadata, tags);
      logInfo(`🆕 Added new persona for user ${userId}: ${persona}`);
    }

    // Learn from naming history
    const namingHistory = await learnFromHistory(userId);

    // Generate smart file name
    const smartName = await generateSmartName({
      userId,
      originalName,
      mimeType,
      metadata,
      role,
      persona,
      namingHistory,
      tags,
    });

    logInfo(`✅ Smart filename generated: ${smartName}`);
    return smartName;
  } catch (error) {
    logError(`❌ Failed to generate smart filename for ${originalName}`, error);
    return originalName; // Fallback
  }
}
