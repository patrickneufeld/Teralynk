import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
/* File Path: backend/src/ai/aiQueryLogs.js */

import fs from "fs";
import path from "path";

const LOG_FILE = path.join(__dirname, 'ai_query_logs.json');

// Function to log AI queries
function logQuery(query, response, user) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user,
        query,
        response
    };
    
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
  logAuditEntry({ action: 'AI operation', result: accessResponse, file: 'aiQueryLogs.mjs' });
    }
    logs.push(logEntry);
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

module.exports = { logQuery };