
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiPromptFingerprintEngine.js

import crypto from 'crypto';
import { logInfo, logError } from '../../utils/logger.mjs';

/**
 * Generates a stable SHA-256 fingerprint of a prompt object or string.
 * @param {string|object} prompt - The prompt content or object to fingerprint.
 * @returns {string} A SHA-256 hex digest representing the fingerprint.
 */
export function generatePromptFingerprint(prompt) {
  try {
    const serialized =
      typeof prompt === 'string'
        ? prompt
        : JSON.stringify(prompt, Object.keys(prompt).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  } catch (err) {
    logError('❌ Failed to generate prompt fingerprint.', err);
    throw new Error('Prompt fingerprinting failed.');
  }
}

/**
 * Compare two prompts and return a diff of semantic and structural deltas.
 * @param {string|object} promptA
 * @param {string|object} promptB
 * @returns {{ changedKeys: string[], isDifferent: boolean }}
 */
export function comparePrompts(promptA, promptB) {
  try {
    const a = typeof promptA === 'string' ? { prompt: promptA } : promptA;
    const b = typeof promptB === 'string' ? { prompt: promptB } : promptB;

    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const changedKeys = [];

    for (const key of allKeys) {
      if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        changedKeys.push(key);
      }
    }

    return {
      changedKeys,
      isDifferent: changedKeys.length > 0,
    };
  } catch (err) {
    logError('❌ Error comparing prompts.', err);
    throw new Error('Prompt comparison failed.');
  }
}

export default {
  generatePromptFingerprint,
  comparePrompts,
};


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).