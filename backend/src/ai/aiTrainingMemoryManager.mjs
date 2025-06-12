import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// /backend/src/ai/aiTrainingMemoryManager.js

import fs from 'fs';
import path from 'path';
import { sha3Hash } from '../security/quantumResistant.mjs';
import { logInsightEvent } from './aiTelemetryEngine.mjs';

const MEMORY_FILE = path.resolve('backend/src/ai/memory/training_memory.json');
const TTL_DAYS = 30;

/**
 * Loads the AI training memory from disk.
 */
export function loadTrainingMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiTrainingMemoryManager.mjs' });
    return data.filter(entry => !isExpired(entry.timestamp));
  } catch (err) {
    logInsightEvent('TRAINING_MEMORY_LOAD_ERROR', { error: err.message });
    return [];
  }
}

/**
 * Saves the full training memory set to disk.
 */
export function saveTrainingMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

/**
 * Adds a new memory entry with hash and timestamp.
 */
export function appendToTrainingMemory(entry) {
  const memory = loadTrainingMemory();
  const fingerprint = sha3Hash(JSON.stringify(entry));
  const enrichedEntry = {
    ...entry,
    fingerprint,
    timestamp: new Date().toISOString(),
  };
  memory.push(enrichedEntry);
  saveTrainingMemory(memory);
  logInsightEvent('TRAINING_MEMORY_APPEND', enrichedEntry);
}

/**
 * Removes expired entries and persists updated memory.
 */
export function pruneExpiredMemory() {
  const memory = loadTrainingMemory();
  const pruned = memory.filter(entry => !isExpired(entry.timestamp));
  saveTrainingMemory(pruned);
  logInsightEvent('TRAINING_MEMORY_PRUNED', { before: memory.length, after: pruned.length });
  return pruned;
}

/**
 * Checks if an entry is expired based on TTL.
 */
function isExpired(timestamp) {
  const expiryDate = new Date(timestamp);
  expiryDate.setDate(expiryDate.getDate() + TTL_DAYS);
  return new Date() > expiryDate;
}
