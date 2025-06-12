
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// ✅ FILE: /backend/src/ai/aiPatchEngine.js

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

import { evaluateModelDrift, getVulnerableModules } from './aiDiagnostics.mjs';
import { scheduleSelfImprovementTask } from './aiSelfImprovementScheduler.mjs';
import { recordEventTelemetry } from './aiTelemetryService.mjs';
import { logInfo, logError } from '../utils/logger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PATCH_HISTORY_FILE = path.join(os.tmpdir(), 'ai_patch_history.json');
const PATCH_QUEUE_FILE = path.join(os.tmpdir(), 'ai_patch_queue.json');

// Private functions (not exported)
function loadPatchHistory() {
  // ... existing implementation ...
}

function savePatchHistory(history) {
  // ... existing implementation ...
}

function loadPatchQueue() {
  // ... existing implementation ...
}

function savePatchQueue(queue) {
  // ... existing implementation ...
}

async function applyPatch(patch) {
  // ... existing implementation ...
}

// Create an object to hold all the functions we want to export
const aiPatchEngine = {
  queueHotfix(patch) {
    try {
      const queue = loadPatchQueue();
      queue.push(patch);
      savePatchQueue(queue);
      logInfo('🕸️ Patch added to fallback queue', { patchId: patch.patchId });
    } catch (error) {
      logError('❌ Failed to enqueue fallback patch', error);
    }
  },

  getHotfixQueue() {
    return loadPatchQueue();
  },

  getPatchHistory() {
    return loadPatchHistory();
  },

  async executeAutoPatch() {
    const traceId = uuidv4();
    const patchHistory = loadPatchHistory();
    const appliedPatches = [];

    try {
      const driftInfo = await evaluateModelDrift(traceId);
      const vulnerableModules = await getVulnerableModules(traceId);

      const generatedPatches = vulnerableModules.map(mod => ({
        patchId: uuidv4(),
        type: 'module_update',
        module: mod.name,
        risk: mod.risk,
        reason: mod.reason,
        traceId,
        timestamp: new Date().toISOString()
      }));

      for (const patch of generatedPatches) {
        const success = await applyPatch(patch);
        if (success) {
          patchHistory.push(patch);
          appliedPatches.push(patch);
        }
      }

      savePatchHistory(patchHistory);

      if (appliedPatches.length > 0) {
        await scheduleSelfImprovementTask({
          traceId,
          reason: 'Post-patch self-optimization',
          patchCount: appliedPatches.length
        });
      }

      await recordEventTelemetry('ai_patch_cycle_complete', {
        traceId,
        patchCount: appliedPatches.length,
        appliedPatches
      });

      return { traceId, appliedPatches };
    } catch (error) {
      logError('❌ Auto Patch Engine Failure', error);
      await recordEventTelemetry('ai_patch_cycle_error', { traceId, error: error.message });
      throw error;
    }
  }
};

// Export the entire aiPatchEngine object as default
export default aiPatchEngine;

// Also export individual functions if needed
export const {
  queueHotfix,
  getHotfixQueue,
  getPatchHistory,
  executeAutoPatch
} = aiPatchEngine;


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).