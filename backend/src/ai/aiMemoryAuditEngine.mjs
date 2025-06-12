import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File: /backend/src/ai/aiMemoryAuditEngine.js

import { loadInsightMemory } from './aiSelfLearningCore.mjs';
import { generatePromptFingerprint } from './aiPromptFingerprintEngine.mjs';
import { logInfo, logError } from '../../utils/logger.mjs';

/**
 * Audits AI insight memory and returns statistics on memory structure and usage.
 * @returns {object} Audit summary
 */
export function auditInsightMemory() {
  try {
    const memory = loadInsightMemory();
    const countByType = {};
    const recentEntries = [];

    memory.forEach(entry => {
      const type = entry.type || 'unknown';
      countByType[type] = (countByType[type] || 0) + 1;
      if (recentEntries.length < 10) {
        recentEntries.push({
          type,
          context: entry?.content?.context || 'n/a',
          timestamp: entry?.content?.createdAt || null,
        });
      }
    });

    const auditReport = {
      totalEntries: memory.length,
      byType: countByType,
      recentEntries,
    };

    logInfo('🧠 Insight memory audited.', auditReport);
    return auditReport;
  } catch (err) {
    logError('❌ Insight memory audit failed.', err);
    throw new Error('Insight memory audit failure');
  }
}

/**
 * Detect duplicate prompt fingerprints in memory to optimize learning compression.
 * @returns {Array<string>} - Fingerprint hashes that are duplicates
 */
export function findDuplicatePromptFingerprints() {
  try {
    const memory = loadInsightMemory();
    const fingerprintMap = {};
    const duplicates = new Set();

    for (const entry of memory) {
      const prompt = entry?.content?.query || entry?.content?.prompt;
      if (!prompt) continue;

      const fingerprint = generatePromptFingerprint(prompt);
      if (fingerprintMap[fingerprint]) {
        duplicates.add(fingerprint);
      } else {
        fingerprintMap[fingerprint] = true;
      }
    }

    return Array.from(duplicates);
  } catch (err) {
    logError('❌ Error detecting duplicate prompt fingerprints.', err);
    return [];
  }
}

export default {
  auditInsightMemory,
  findDuplicatePromptFingerprints,
};
