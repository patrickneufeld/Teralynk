import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
/* File Path: backend/src/ai/aiModelTrainer.js */

const { spawn } = require('child_process');

function trainModel(scriptPath) {
    const process = spawn('python', [scriptPath]);
    process.stdout.on('data', (data) => console.log(`Training: ${data}`));
    process.stderr.on('data', (data) => console.error(`Error: ${data}`));
}

export { trainModel };