
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiPatchScoreEngine.js

import { sha3Hash } from '../security/quantumResistant.mjs';
import logger from '../utils/logger.mjs';

/**
 * Scores a patch based on metadata, impact range, and recency.
 * @param {Object} patch - Patch metadata object
 * @returns {number} Score from 0 (low value) to 100 (critical + recent)
 */
export const scorePatch = (patch) => {
  try {
    const { severity = 'low', timestamp, module, author } = patch;

    const severityWeights = {
      critical: 50,
      high: 40,
      medium: 30,
      low: 10,
    };

    const timeWeight = computeRecencyWeight(timestamp);
    const authorWeight = author ? 5 : 0;
    const moduleWeight = module ? 5 : 0;

    const score =
      (severityWeights[severity.toLowerCase()] || 10) +
      timeWeight +
      authorWeight +
      moduleWeight;

    return Math.min(score, 100);
  } catch (err) {
    logger.error(`[PatchScoreEngine] Scoring failed: ${err.message}`);
    return 0;
  }
};

/**
 * Computes time decay weight for patch age.
 */
const computeRecencyWeight = (timestamp) => {
  if (!timestamp) return 0;
  const now = Date.now();
  const ageMs = now - new Date(timestamp).getTime();
  const oneDayMs = 86400000;

  if (ageMs < oneDayMs) return 30;
  if (ageMs < 3 * oneDayMs) return 20;
  if (ageMs < 7 * oneDayMs) return 10;
  return 0;
};

/**
 * Generates a fingerprint for the patch content.
 */
export const getPatchFingerprint = (patchData) => {
  try {
    const raw = JSON.stringify(patchData);
    return sha3Hash(raw);
  } catch (err) {
    logger.error(`[PatchScoreEngine] Fingerprint generation failed: ${err.message}`);
    return null;
  }
};


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).