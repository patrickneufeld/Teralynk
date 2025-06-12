// File: /backend/src/ai/aiUserRoleProfiler.js

import { getUserById } from '../services/userService.mjs';
import { getTemplatesForPersona, registerNewPersona } from './aiNamingTemplateEngine.mjs';
import { logInfo, logError } from '../utils/logging/logging.mjs';

/**
 * Attempts to classify a user into a known role based on profile data.
 * @param {string} userId
 * @returns {Promise<string>} - e.g. 'developer', 'photographer', or 'unknown'
 */
export async function detectUserRole(userId) {
  try {
    const user = await getUserById(userId);
    if (!user || !user.profession) return 'unknown';

    const normalized = user.profession.toLowerCase().replace(/\s+/g, '_');
    return normalized;
  } catch (err) {
    logError(`Failed to detect role for user ${userId}:`, err);
    return 'unknown';
  }
}

/**
 * Attempts to classify a user into a known persona based on prior file naming behavior.
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function detectUserPersona(userId) {
  try {
    const role = await detectUserRole(userId);
    const knownTemplates = getTemplatesForPersona(role);

    if (knownTemplates.length > 0) return role;
    return 'unknown';
  } catch (err) {
    logError(`Error detecting persona for user ${userId}:`, err);
    return 'unknown';
  }
}

/**
 * Adds a new persona dynamically based on file tags or metadata.
 * If tags like "blueprint" or "spec" appear repeatedly, assign a role such as "engineer".
 */
export async function addNewPersonaIfNeeded(userId, metadata = {}, tags = []) {
  try {
    const keywords = [...tags, ...(metadata?.keywords || [])].map(k => k.toLowerCase());
    const keywordMap = {
      developer: ['code', 'js', 'script', 'module'],
      photographer: ['photo', 'raw', 'shoot', 'camera'],
      professor: ['syllabus', 'lecture', 'research'],
      musician: ['track', 'mix', 'bpm'],
      designer: ['mockup', 'figma', 'ui', 'screen'],
      engineer: ['blueprint', 'spec', 'revision'],
      writer: ['manuscript', 'chapter', 'draft'],
      data_scientist: ['model', 'dataset', 'analysis']
    };

    for (const [persona, terms] of Object.entries(keywordMap)) {
      if (keywords.some(k => terms.includes(k))) {
        registerNewPersona(persona);
        return persona;
      }
    }

    const fallback = 'general_user';
    registerNewPersona(fallback);
    return fallback;
  } catch (err) {
    logError(`❌ Failed to add new persona dynamically:`, err);
    return 'unknown';
  }
}
