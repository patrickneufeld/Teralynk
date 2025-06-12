import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiFileNamingService.js

import { extractFileMetadata } from './aiFileMetadataAnalyzer.mjs';
import { detectUserRole, detectUserPersona, addNewPersonaIfNeeded } from './aiUserRoleProfiler.mjs';
import { learnFromHistory, generateSmartName } from './aiNamingStrategyEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';

/**
 * Primary service function to coordinate all steps of adaptive file naming.
 * @param {Object} params
 * @param {string} params.userId - ID of the user.
 * @param {string} params.originalName - Original file name uploaded by user.
 * @param {string} params.mimeType - File MIME type.
 * @param {Buffer|string} params.content - File content (raw string or buffer).
 * @param {string[]} [params.tags=[]] - Optional tags.
 * @returns {Promise<string>} - AI-generated smart filename.
 */
export async function getSmartFilename({
  userId,
  originalName,
  mimeType,
  content,
  tags = [],
}) {
  try {
    logInfo(`🧠 Starting smart filename generation for user ${userId}...`);

    // Step 1: Extract metadata from file
    const metadata = await extractFileMetadata({ originalName, mimeType, content });

    // Step 2: Detect user persona and role
    let persona = await detectUserPersona(userId);
    const role = await detectUserRole(userId);

    if (!persona || persona === 'unknown') {
      logInfo(`🔍 Persona undefined for ${userId}, attempting to infer...`);
      persona = await addNewPersonaIfNeeded(userId, metadata, tags);
    }

    // Step 3: Pull historical naming patterns
    const namingHistory = await learnFromHistory(userId);

    // Step 4: Generate intelligent file name
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
  } catch (err) {
    logError(`❌ Smart filename generation failed for ${originalName}`, err);
    return originalName; // Safe fallback
  }
}
