import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiDiagnostics.js

import crypto from 'crypto';
import db from '../config/db.mjs';
import { logInfo, logError, logWarn } from '../utils/logger.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { publishToChannel } from '../utils/pubsub.mjs';
import { sendSystemAlert } from '../utils/notifier.mjs';

/**
 * Create a fingerprint of the current model’s operational config
 * - Compares version, config, and telemetry counters
 */
export async function fingerprintModelSnapshot(traceId = null) {
  try {
    const { rows } = await db.query(`
      SELECT config_key, config_value FROM ai_config ORDER BY config_key ASC
    `);

    const baseString = rows.map(row => `${row.config_key}:${row.config_value}`).join('|');
    const hash = crypto.createHash('sha256').update(baseString).digest('hex');

    logInfo('🔍 Model fingerprint generated.', { traceId, hash });
    return { hash, fields: rows.length };
  } catch (error) {
    logError('❌ Fingerprint generation failed', { traceId, error: error.message });
    return { hash: null, fields: 0 };
  }
}

/**
 * Evaluate model drift score based on anomalies and feedback
 * Score scale: 0.0 (no drift) → 1.0 (high drift)
 */
export async function evaluateModelDrift(traceId = null) {
  try {
    const { rows: feedbackRows } = await db.query(`
      SELECT COUNT(*)::int AS count FROM ai_feedback
      WHERE created_at >= NOW() - interval '6 hours'
    `);

    const { rows: anomalyRows } = await db.query(`
      SELECT COUNT(*)::int AS count FROM ai_telemetry_events
      WHERE event_type = 'anomaly_detected'
      AND created_at >= NOW() - interval '6 hours'
    `);

    const feedbackCount = feedbackRows[0]?.count || 0;
    const anomalyCount = anomalyRows[0]?.count || 0;

    const driftScore = Math.min((feedbackCount + anomalyCount) / 20, 1.0); // Normalized
    const metrics = { feedbackCount, anomalyCount, driftScore };

    await recordEventTelemetry('model_drift_evaluated', { traceId, metrics });
    logInfo('📊 Model drift evaluated.', { traceId, ...metrics });

    return { score: driftScore, ...metrics };
  } catch (error) {
    logError('❌ Model drift evaluation failed', { traceId, error: error.message });
    return { score: 0, error: error.message };
  }
}

/**
 * Summarize log activity across AI system for diagnostics dashboards
 */
export async function summarizeLogs(traceId = null) {
  try {
    const summary = {};

    const { rows: errorEvents } = await db.query(`
      SELECT event_type, COUNT(*)::int AS count
      FROM ai_telemetry_events
      WHERE created_at >= NOW() - interval '12 hours'
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const { rows: actionLogs } = await db.query(`
      SELECT action, COUNT(*)::int AS count
      FROM ai_logs
      WHERE timestamp >= NOW() - interval '12 hours'
      GROUP BY action
      ORDER BY count DESC
    `);

    summary.telemetry = Object.fromEntries(errorEvents.map(e => [e.event_type, e.count]));
    summary.actions = Object.fromEntries(actionLogs.map(l => [l.action, l.count]));

    logInfo('📈 AI log summary generated.', { traceId, ...summary });
    return summary;
  } catch (error) {
    logError('❌ Failed to summarize AI logs', { traceId, error: error.message });
    return { error: error.message };
  }
}

/**
 * Broadcast drift alerts to notify system admins and auto-monitors
 */
export async function broadcastDriftAlert(drift, traceId = null) {
  const payload = {
    title: '🚨 AI Model Drift Alert',
    severity: 'high',
    driftScore: drift.score,
    feedbackCount: drift.feedbackCount,
    anomalyCount: drift.anomalyCount,
    triggeredAt: new Date().toISOString(),
    traceId,
  };

  try {
    await Promise.all([
      sendSystemAlert(payload),
      publishToChannel('ai.alerts', payload),
      recordEventTelemetry('model_drift_alert', { traceId, ...payload }),
    ]);

    logWarn('⚠️ Drift alert broadcasted to admins and watchers.', payload);
  } catch (error) {
    logError('❌ Drift alert broadcasting failed', { traceId, error: error.message });
  }
}

/**
 * Analyze recent logs for modules likely to cause failures (used for auto-patching)
 */
export async function getVulnerableModules(traceId = null) {
  try {
    const { rows } = await db.query(`
      SELECT module, COUNT(*)::int AS errors
      FROM ai_logs
      WHERE severity = 'error'
        AND timestamp >= NOW() - interval '24 hours'
        AND module IS NOT NULL
      GROUP BY module
      ORDER BY errors DESC
      LIMIT 10
    `);

    const vulnerable = rows.map(r => ({
      module: r.module,
      errorCount: r.errors
    }));

    logInfo('🧪 Vulnerable modules extracted.', { traceId, vulnerable });
    return vulnerable;
  } catch (error) {
    logError('❌ Failed to analyze vulnerable modules', { traceId, error: error.message });
    return [];
  }
}
