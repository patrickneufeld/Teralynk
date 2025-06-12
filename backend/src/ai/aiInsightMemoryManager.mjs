import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.mjs'; // ✅ FIXED: default import
import { computeChecksum } from './aiInsightChecksum.mjs';

const MEMORY_STORE_PATH = path.resolve('ai_data', 'insight_memory.json');
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

let insightMemory = {};

/**
 * Loads the insight memory from disk, with TTL filtering.
 */
export async function loadInsightMemory() {
  try {
    const raw = await fs.readFile(MEMORY_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiInsightMemoryManager.mjs' });
    const now = Date.now();
    insightMemory = Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => !value.expiry || value.expiry > now
      )
    );
    logger.info(`[InsightMemory] Loaded ${Object.keys(insightMemory).length} entries`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error('Failed to load insight memory', { error: err });
    }
    insightMemory = {};
  }
}

/**
 * Saves the current memory to disk.
 */
export async function saveInsightMemory() {
  try {
    await fs.mkdir(path.dirname(MEMORY_STORE_PATH), { recursive: true });
    await fs.writeFile(MEMORY_STORE_PATH, JSON.stringify(insightMemory, null, 2));
    logger.info(`[InsightMemory] Persisted ${Object.keys(insightMemory).length} entries`);
  } catch (err) {
    logger.error('Failed to save insight memory', { error: err });
  }
}

/**
 * Stores an insight in memory with optional TTL and checksum validation.
 */
export async function storeInsight(id, data, ttl = DEFAULT_TTL_MS) {
  const checksum = computeChecksum(data);
  insightMemory[id] = {
    value: data,
    checksum,
    expiry: Date.now() + ttl,
  };
  await saveInsightMemory();
}

/**
 * Retrieves an insight from memory if valid and not expired.
 */
export function getInsight(id) {
  const entry = insightMemory[id];
  if (!entry || (entry.expiry && entry.expiry < Date.now())) {
    delete insightMemory[id];
    return null;
  }
  const isValid = computeChecksum(entry.value) === entry.checksum;
  return isValid ? entry.value : null;
}

/**
 * Clears expired entries from memory.
 */
export async function pruneExpiredInsights() {
  const now = Date.now();
  const before = Object.keys(insightMemory).length;
  insightMemory = Object.fromEntries(
    Object.entries(insightMemory).filter(
      ([, entry]) => !entry.expiry || entry.expiry > now
    )
  );
  const after = Object.keys(insightMemory).length;
  if (before !== after) {
    await saveInsightMemory();
    logger.info(`[InsightMemory] Pruned ${before - after} expired entries`);
  }
}
