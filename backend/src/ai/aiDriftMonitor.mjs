// /backend/src/ai/aiDriftMonitor.js

import { sha3Hash } from '../security/quantumResistant.mjs';
import { getInsightHistory, getModelSnapshot } from './aiTrainingMetaTracker.mjs';
import { emitTelemetryEvent } from './aiTelemetryService.mjs';
import logger from '../utils/logger.mjs';

/**
 * Monitors model drift by comparing current snapshot against baseline.
 */
export const detectDrift = async (modelId) => {
  try {
    const baseline = await getModelSnapshot(modelId, 'baseline');
    const current = await getModelSnapshot(modelId, 'latest');

    if (!baseline || !current) {
      logger.warn(`[DriftMonitor] Missing snapshots for model: ${modelId}`);
      return { drifted: false, reason: 'Incomplete snapshot data' };
    }

    const baselineHash = sha3Hash(JSON.stringify(baseline));
    const currentHash = sha3Hash(JSON.stringify(current));

    const drifted = baselineHash !== currentHash;

    if (drifted) {
      emitTelemetryEvent('model_drift_detected', {
        modelId,
        baselineHash,
        currentHash,
      });
      logger.warn(`[DriftMonitor] Drift detected for model ${modelId}`);
    }

    return { drifted, baselineHash, currentHash };
  } catch (err) {
    logger.error(`[DriftMonitor] Error detecting drift: ${err.message}`);
    return { drifted: false, error: err.message };
  }
};

/**
 * Registers a new snapshot to be used as baseline.
 */
export const registerBaseline = async (modelId, snapshot) => {
  try {
    await getModelSnapshot(modelId, 'baseline', snapshot);
    logger.info(`[DriftMonitor] Baseline registered for model: ${modelId}`);
  } catch (err) {
    logger.error(`[DriftMonitor] Failed to register baseline: ${err.message}`);
  }
};
