// File: /backend/src/ai/aiPersonaSuggestionEngine.js

import { getAllPersonas, getTemplatesForPersona } from './aiNamingTemplateEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';
import { learnFromUserFiles } from './aiNamingTemplateEngine.mjs';

/**
 * Suggests a user persona based on historical filenames and tags.
 * Can help identify the correct naming logic for unknown or evolving users.
 *
 * @param {Object} options
 * @param {string} options.userId
 * @param {string[]} options.filenames - List of past filenames
 * @param {string[]} [options.tags] - Optional tags to enhance suggestion accuracy
 * @returns {string} - Suggested persona (e.g. 'developer', 'photographer')
 */
export function suggestPersonaFromFilenames({ userId, filenames, tags = [] }) {
  try {
    logInfo(`🔍 Running persona suggestion for user: ${userId}`);

    const personaScores = {};
    const allPersonas = getAllPersonas();

    for (const persona of allPersonas) {
      const templates = getTemplatesForPersona(persona);
      let score = 0;

      for (const file of filenames) {
        for (const template of templates) {
          const regex = new RegExp(template.replace(/{\w+}/g, '.*'), 'i');
          if (regex.test(file)) {
            score += 1;
            break;
          }
        }
      }

      if (score > 0) {
        personaScores[persona] = score;
      }
    }

    const sorted = Object.entries(personaScores).sort((a, b) => b[1] - a[1]);
    const bestMatch = sorted[0]?.[0] || 'unknown';

    logInfo(`👤 Suggested persona for user ${userId}: ${bestMatch}`);
    return bestMatch;
  } catch (error) {
    logError(`❌ Failed to suggest persona for user ${userId}:`, error);
    return 'unknown';
  }
}

/**
 * Learns and adds new template suggestions to a persona based on file usage.
 * @param {string} persona
 * @param {string[]} filenames
 */
export function refinePersonaTemplates(persona, filenames) {
  try {
    learnFromUserFiles(persona, filenames);
    logInfo(`📚 Updated templates for persona: ${persona}`);
  } catch (error) {
    logError(`❌ Failed to refine templates for ${persona}:`, error);
  }
}
