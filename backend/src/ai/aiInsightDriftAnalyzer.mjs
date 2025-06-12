import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// aiInsightDriftAnalyzer.js
import { analyzeDrift } from './aiDriftMonitor.mjs';
import { fetchInsightSnapshots } from './aiInsightStorage.mjs';
import logger from '../utils/logger.mjs';

export async function detectInsightDrift(insightId, timeWindow = '30d') {
  const snapshots = await fetchInsightSnapshots(insightId, timeWindow);
  if (!snapshots || snapshots.length < 2) {
    return { driftDetected: false, reason: 'Insufficient historical data' };
  }

  const result = analyzeDrift(snapshots);
  logger.info('Insight drift analysis result', { insightId, driftDetected: result?.drift });

  return {
    driftDetected: result?.drift || false,
    driftScore: result?.score || 0,
    anomalies: result?.anomalies || [],
    timeWindow
  };
}
