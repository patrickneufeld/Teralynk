// /backend/src/ai/aiModelDiffAnalyzer.js

import fs from 'fs';
import path from 'path';
import { createHash } from 'node:crypto';
import { sha3Hash } from '../security/quantumResistant.mjs';
import { logInsightEvent } from './aiTelemetryEngine.mjs';

const BASELINE_FILE = path.resolve('backend/src/ai/baselines/model_baseline.json');

/**
 * Generates a fingerprint hash of a given model file.
 */
export function generateModelFingerprint(filePath) {
  const data = fs.readFileSync(filePath);
  return sha3Hash(data.toString());
}

/**
 * Loads the model baseline from disk.
 */
export function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'));
}

/**
 * Saves a new model baseline.
 */
export function saveBaseline({ fingerprint, version, modelName }) {
  const baseline = { fingerprint, version, modelName, timestamp: new Date().toISOString() };
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  logInsightEvent('MODEL_BASELINE_SAVED', baseline);
  return baseline;
}

/**
 * Compares current fingerprint with baseline to detect drift.
 */
export function compareWithBaseline({ fingerprint, version, modelName }) {
  const baseline = loadBaseline();
  if (!baseline) {
    return { driftDetected: false, reason: 'No baseline exists', status: 'unknown' };
  }

  const driftDetected = baseline.fingerprint !== fingerprint || baseline.version !== version;
  const result = {
    driftDetected,
    baseline,
    current: { fingerprint, version, modelName },
    status: driftDetected ? 'mismatch' : 'match',
  };

  logInsightEvent('MODEL_DIFF_ANALYSIS', result);
  return result;
}
