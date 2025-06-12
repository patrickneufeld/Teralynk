import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiTrainingMetaTracker.js

import fs from 'fs';
import path from 'path';
import { sha3Hash } from '../security/quantumResistant.mjs';
import { logInsightEvent } from './aiTelemetryEngine.mjs';

const META_FILE = path.resolve('backend/src/ai/memory/training_meta.json');

/**
 * Loads existing training metadata.
 */
export function loadTrainingMetadata() {
  if (!fs.existsSync(META_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiTrainingMetaTracker.mjs' });
  } catch (err) {
    logInsightEvent('TRAINING_META_LOAD_ERROR', { error: err.message });
    return {};
  }
}

/**
 * Writes metadata object to disk.
 */
export function saveTrainingMetadata(metadata) {
  fs.writeFileSync(META_FILE, JSON.stringify(metadata, null, 2));
}

/**
 * Updates metadata keys with timestamp, source, and trace info.
 */
export function updateTrainingMetadata(key, value, context = {}) {
  const meta = loadTrainingMetadata();
  const hashKey = sha3Hash(key);
  meta[hashKey] = {
    value,
    updated: new Date().toISOString(),
    ...context,
  };
  saveTrainingMetadata(meta);
  logInsightEvent('TRAINING_META_UPDATED', { key, ...context });
}

/**
 * Fetches metadata value by hashed key.
 */
export function getTrainingMetaValue(key) {
  const meta = loadTrainingMetadata();
  return meta[sha3Hash(key)] || null;
}
