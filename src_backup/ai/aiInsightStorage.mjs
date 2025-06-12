// /backend/src/ai/aiInsightStorage.js

import { AILogModel } from '../src/models/AILogModel.mjs';
import { sha3Hash } from '../security/quantumResistant.mjs';
import { logInsightEvent } from './aiTelemetryEngine.mjs';

/**
 * Stores an insight in the database with metadata and hash.
 */
export async function storeInsight(insight, metadata = {}) {
  const fingerprint = sha3Hash(insight);
  const timestamp = new Date();

  try {
    const existing = await AILogModel.findOne({ where: { fingerprint } });

    if (existing) {
      await existing.update({ lastSeen: timestamp, occurrences: existing.occurrences + 1 });
    } else {
      await AILogModel.create({
        fingerprint,
        insight,
        categories: metadata.categories?.join(',') || 'general',
        traceId: metadata.traceId || `trace_${Date.now()}`,
        severity: metadata.severity || 'info',
        source: metadata.source || 'aiSelfLearningCore',
        createdAt: timestamp,
        lastSeen: timestamp,
        occurrences: 1,
      });
    }

    logInsightEvent('INSIGHT_STORED', { fingerprint, categories: metadata.categories, traceId: metadata.traceId });
  } catch (error) {
    console.error(`[InsightStorage] Failed to store insight:`, error);
    throw error;
  }
}

/**
 * Retrieves recent insights with optional filters.
 */
export async function fetchInsights({ limit = 50, category = null } = {}) {
  const where = {};
  if (category) {
    where.categories = { $like: `%${category}%` };
  }

  return AILogModel.findAll({
    where,
    order: [['lastSeen', 'DESC']],
    limit,
  });
}

/**
 * Deletes old insights beyond a certain age (in days).
 */
export async function pruneOldInsights(days = 30) {
  const cutoff = new Date(Date.now() - days * 86400000);
  return AILogModel.destroy({
    where: { lastSeen: { $lt: cutoff } },
  });
}
