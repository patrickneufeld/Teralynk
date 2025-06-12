// ✅ FILE: /backend/src/guardrails/AuditLogger.mjs
import fs from 'fs';
import path from 'path';

const logFile = path.resolve("logs", "ai_patch_audit.log");

export function logAuditEntry(entry) {
  const record = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + "\n";
  fs.appendFileSync(logFile, record);
}