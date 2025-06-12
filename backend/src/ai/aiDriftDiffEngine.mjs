import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// aiDriftDiffEngine.js

import { createHash } from 'crypto';
import { loadModelFingerprint, saveModelFingerprint } from './aiInsightStorage.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { compareJSONStructures } from '../utils/security/dataComparisonUtils.mjs';
import { emitDriftAlert } from './aiNotificationManager.mjs';
import logger from '../config/logger.mjs';

const FINGERPRINT_ALGO = 'sha3-512';

/**
 * Generates a cryptographic fingerprint of a model snapshot or structure.
 */
export function generateFingerprint(payload) {
  const hash = createHash(FINGERPRINT_ALGO);
  hash.update(JSON.stringify(payload));
  return hash.digest('hex');
}

/**
 * Compares two fingerprints and returns a drift score between 0 (identical) and 1 (completely different).
 */
export function calculateDriftScore(oldFingerprint, newFingerprint) {
  let driftScore = 0;
  for (let i = 0; i < oldFingerprint.length; i++) {
    if (oldFingerprint[i] !== newFingerprint[i]) driftScore += 1;
  }
  return driftScore / oldFingerprint.length;
}

/**
 * Determines if drift has occurred based on threshold and optionally emits telemetry and alerts.
 */
export async function detectModelDrift({
  modelId,
  newModelSnapshot,
  threshold = 0.15,
  emitAlert = true,
  autoStore = true,
  traceId = null
}) {
  try {
    const previousFingerprint = await loadModelFingerprint(modelId);
    const currentFingerprint = generateFingerprint(newModelSnapshot);

    if (!previousFingerprint) {
      if (autoStore) await saveModelFingerprint(modelId, currentFingerprint);
      logger.info(`[DriftDiffEngine] No baseline for ${modelId}. Stored initial fingerprint.`);
      return { driftDetected: false, score: 0 };
    }

    const driftScore = calculateDriftScore(previousFingerprint, currentFingerprint);
    const driftDetected = driftScore >= threshold;

    if (driftDetected) {
      logger.warn(`[DriftDiffEngine] Drift detected for ${modelId} | Score: ${driftScore.toFixed(4)}`);
      if (emitAlert) {
        emitDriftAlert({
          modelId,
          score: driftScore,
          severity: driftScore > 0.3 ? 'high' : 'moderate',
          traceId
        });
      }
    } else {
      logger.info(`[DriftDiffEngine] No significant drift for ${modelId} | Score: ${driftScore.toFixed(4)}`);
    }

    if (autoStore) {
      await saveModelFingerprint(modelId, currentFingerprint);
    }

    await recordEventTelemetry('ai.model.driftCheck', {
      modelId,
      score: driftScore,
      driftDetected,
      traceId,
      severity: driftScore > 0.3 ? 'high' : driftScore > 0.15 ? 'moderate' : 'low'
    });

    return { driftDetected, score: driftScore };
  } catch (err) {
    logger.error(`[DriftDiffEngine] Error in drift detection: ${err.message}`, { err });
    return { driftDetected: false, score: null, error: err.message };
  }
}
