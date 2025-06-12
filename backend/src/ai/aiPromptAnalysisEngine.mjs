
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiPromptFingerprintEngine.js

import crypto from 'crypto';
import { logInfo, logError } from '../../utils/logger.mjs';

/**
 * Normalize and clean a prompt for fingerprinting.
 * Removes line breaks, extra spaces, and token formatting noise.
 * @param {string} prompt
 * @returns {string} cleanedPrompt
 */
function normalizePrompt(prompt) {
  if (typeof prompt !== 'string') return '';
  return prompt
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x00-\x7F]+/g, '') // strip non-ASCII
    .toLowerCase();
}

/**
 * Generate a SHA-256 fingerprint of a cleaned prompt.
 * Useful for deduplication and insight categorization.
 * @param {string} prompt
 * @returns {string} fingerprint
 */
export function generatePromptFingerprint(prompt) {
  try {
    const cleaned = normalizePrompt(prompt);
    const hash = crypto.createHash('sha256').update(cleaned).digest('hex');
    return hash;
  } catch (err) {
    logError('❌ Failed to generate prompt fingerprint.', err);
    return 'invalid_fingerprint';
  }
}

/**
 * Compare two prompts and calculate token-level delta.
 * Useful for clustering and fuzzy matching.
 * @param {string} promptA
 * @param {string} promptB
 * @returns {object} diffResult
 */
export function comparePromptSimilarity(promptA, promptB) {
  const normA = normalizePrompt(promptA);
  const normB = normalizePrompt(promptB);
  const tokensA = normA.split(' ');
  const tokensB = normB.split(' ');

  const diff = {
    added: tokensB.filter(t => !tokensA.includes(t)),
    removed: tokensA.filter(t => !tokensB.includes(t)),
    overlap: tokensA.filter(t => tokensB.includes(t)),
    similarity: 0,
  };

  const totalTokens = new Set([...tokensA, ...tokensB]).size;
  const shared = diff.overlap.length;
  diff.similarity = totalTokens === 0 ? 1 : shared / totalTokens;

  return diff;
}

/**
 * Get metadata insights from prompt fingerprint structure.
 * Helps in prompt clustering and lineage tracking.
 * @param {string} prompt
 * @returns {object} fingerprintMeta
 */
export function extractPromptMetadata(prompt) {
  const norm = normalizePrompt(prompt);
  const length = norm.length;
  const tokenCount = norm.split(' ').length;
  const fingerprint = generatePromptFingerprint(norm);

  return {
    fingerprint,
    length,
    tokenCount,
    preview: norm.slice(0, 100),
  };
}

export default {
  generatePromptFingerprint,
  comparePromptSimilarity,
  extractPromptMetadata,
};


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).