
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
import { inferUserProfileFromFiles } from './userPersonaAnalyzer.mjs';
import { suggestFileNameFromPatterns } from './namingSuggestionEngine.mjs';

/**
 * Suggests a file name based on user's past naming patterns, file type, and user role.
 * Falls back to best-practice naming conventions if no patterns exist.
 *
 * @param {Object} params - Input parameters
 * @param {string[]} params.existingFileNames - List of user’s current filenames
 * @param {string} params.newFileType - Type of the new file (e.g., "pdf", "jpeg", "js")
 * @param {string} [params.userProfession] - Optional profession hint (e.g., "photographer", "developer")
 * @param {string} [params.userPersona] - Optional persona hint (e.g., "college student", "professor")
 * @returns {string} - Suggested file name
 */
export function suggestSmartFileName({ existingFileNames, newFileType, userProfession, userPersona }) {
  const userProfile = inferUserProfileFromFiles(existingFileNames, userProfession, userPersona);
  return suggestFileNameFromPatterns(userProfile, newFileType, existingFileNames);
}


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).