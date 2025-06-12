import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiSelfImprovementScheduler.js

import cron from 'node-cron';
import { logInfo, logError, logWarn } from '../utils/logger.mjs';
// In aiSelfImprovementScheduler.js
import { runSelfLearningCycle } from './aiSelfLearningCore.mjs';  // Make sure this path is correct
import { executeAutoPatch, getPatchHistory } from './aiPatchEngine.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';

let isRunning = false;
let lastExecution = null;
const MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * ✅ Prevent overlapping scheduler cycles
 */
function preventOverlap() {
  if (isRunning) {
    logWarn('🛑 Self-Improvement Scheduler already running. Overlap prevented.');
    return true;
  }
  isRunning = true;
  return false;
}

/**
 * ✅ Restore scheduler state after completion
 */
function releaseLock() {
  isRunning = false;
  lastExecution = Date.now();
}
export const scheduleSelfImprovementTask = runImprovementNow;

/**
 * ✅ Run full self-learning + patch cycle
 */
export async function runImprovementNow(triggerSource = 'manual') {
  if (preventOverlap()) return;

  const telemetryBase = {
    triggeredBy: triggerSource,
    startedAt: new Date().toISOString()
  };

  try {
    logInfo('🧠 Initiating Self-Improvement Scheduler...');
    await runSelfLearningCycle();

    const patchHistory = getPatchHistory().slice(-10); // get latest 10 for log
    telemetryBase.patchHistory = patchHistory;

    await recordEventTelemetry('self_improvement_cycle_success', telemetryBase);
    logInfo('✅ Self-Improvement Cycle Completed.');
  } catch (err) {
    telemetryBase.error = err.message;
    await recordEventTelemetry('self_improvement_cycle_failure', telemetryBase);
    logError('❌ Self-Improvement Cycle Failed.', err);
  } finally {
    releaseLock();
  }
}

/**
 * ✅ Schedule self-improvement every 30 minutes
 */
export function scheduleImprovementCycle() {
  cron.schedule('*/30 * * * *', async () => {
    await runImprovementNow('scheduler');
  });

  logInfo('⏰ Self-Improvement Scheduler initialized to run every 30 minutes.');
}
