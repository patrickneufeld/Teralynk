import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
// File Path: backend/src/ai/aiPerformanceTracker.js

import fs from "fs";
import path from "path";

const logFilePath = path.join(__dirname, "ai_performance_log.json");

function logPerformance(mse, mae, rse, timestamp = new Date().toISOString()) {
    const logEntry = { timestamp, mse, mae, rse };
    let logs = [];

    if (fs.existsSync(logFilePath)) {
        logs = JSON.parse(fs.readFileSync(logFilePath));
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiPerformanceTracker.mjs' });
    }

    logs.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
}

module.exports = { logPerformance };
