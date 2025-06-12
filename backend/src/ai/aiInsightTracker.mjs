import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FULLY FIXED /backend/src/ai/aiInsightTracker.js

import logger from '../utils/logger.mjs';
import { recordTelemetryEvent } from './aiTelemetryService.mjs';
import { getInsight, storeInsight } from './aiInsightMemoryManager.mjs';

const DEFAULT_CATEGORIES = ['security', 'performance', 'compliance', 'reliability'];
const TRACKER_SOURCE = 'aiSelfLearningCore';

async function trackInsight(insight, metadata = {}) {
  if (!insight || typeof insight !== 'string') {
    logger.logWarn?.('[InsightTracker] Invalid insight string');
    return;
  }

  const id = generateInsightId(insight, metadata);
  const existing = getInsight(id);

  if (existing) {
    logger.logInfo?.(`[InsightTracker] Insight already tracked: ${id}`);
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = {
    id,
    message: insight,
    source: TRACKER_SOURCE,
    categories: metadata.categories || DEFAULT_CATEGORIES,
    severity: metadata.severity || 'info',
    tags: metadata.tags || [],
    traceId: metadata.traceId || null,
    timestamp,
  };

  await storeInsight(id, payload);
  await recordTelemetryEvent('ai.insight.tracked', payload);

  logger.logInfo?.(`[InsightTracker] Tracked new insight: ${id}`);
}

function generateInsightId(insight, metadata) {
  const base = insight.trim().toLowerCase().replace(/\s+/g, '_');
  const tags = (metadata.tags || []).join('_');
  const scope = metadata.scope || 'global';
  return `${scope}_${base}_${tags}`.replace(/[^a-zA-Z0-9_]/g, '');
}

// ✅ Named and default export
const aiInsightTracker = {
  trackInsight,
};

export { trackInsight, aiInsightTracker };
export default aiInsightTracker;
