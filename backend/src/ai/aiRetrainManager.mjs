
function sanitize(input) {
  return String(input).replace(/[^a-zA-Z0-9@_\-:. ]/g, '').trim();
}


import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: backend/src/ai/aiRetrainManager.js

import { logPerformance } from "./aiPerformanceTracker.mjs";

function triggerRetraining(aiModel, mse, mae, rse) {
    if (mse > 0.15 || mae > 0.07 || rse > 0.25) {
        console.log(`🔄 Retraining AI Model: ${aiModel}`);
        logPerformance(mse, mae, rse);
        // Add AI retraining logic here
    }
}

export { triggerRetraining };


// TODO: Implement rate limiting logic to avoid API abuse (e.g., token bucket or middleware).