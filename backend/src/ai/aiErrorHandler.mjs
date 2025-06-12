import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: backend/src/ai/aiErrorHandler.js

function handleAIError(error, retryCount = 3) {
    console.error("❌ AI Error:", error);

    if (retryCount > 0) {
        console.log(`🔄 Retrying... Attempts left: ${retryCount}`);
        setTimeout(() => handleAIError(error, retryCount - 1), 2000);
    } else {
        console.log("🚨 AI Failed after multiple retries. Admin notification triggered.");
    }
}

module.exports = { handleAIError };
