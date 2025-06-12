
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiPatchValidationEngine.js

import { sha3Hash } from '../security/quantumResistant.mjs';
import logger from '../utils/logger.mjs';

/**
 * Validates patch integrity using SHA3-512 checksum.
 */
export const validatePatchChecksum = (patch) => {
  try {
    const computedHash = sha3Hash(patch.contents || '');
    const isValid = computedHash === patch.checksum;

    if (!isValid) {
      logger.warn(`[PatchValidation] Invalid checksum for patch ${patch.id}`);
    }

    return isValid;
  } catch (err) {
    logger.error(`[PatchValidation] Error validating patch: ${err.message}`);
    return false;
  }
};

/**
 * Checks if patch metadata meets structural and content requirements.
 */
export const isPatchMetadataValid = (patch) => {
  const requiredFields = ['id', 'contents', 'checksum', 'source', 'appliedAt'];
  const missing = requiredFields.filter((field) => !patch[field]);

  if (missing.length) {
    logger.warn(`[PatchValidation] Missing metadata fields: ${missing.join(', ')}`);
    return false;
  }

  return true;
};


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).