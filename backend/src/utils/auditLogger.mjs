// ✅ FILE: /backend/src/utils/auditLogger.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auditLogPath = path.resolve(__dirname, '../../logs/audit.log');

/**
 * Ensures the audit log directory exists
 */
function ensureLogDirExists() {
  const dir = path.dirname(auditLogPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Writes a single structured audit log entry to file
 */
function writeAuditLog(entry) {
  ensureLogDirExists();
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const line = `${timestamp} | ${entry.eventType || 'UNKNOWN'} | ${entry.traceId || 'no-trace'} | ${entry.actor || 'anonymous'} | ${entry.action || 'none'} | ${JSON.stringify(entry.details || {})}\n`;
  
  fs.appendFile(auditLogPath, line, (err) => {
    if (err) {
      console.error('[AUDIT] Log write failed:', err);
    }
  });
}

/**
 * Main entrypoint for structured audit recording
 */
export function recordAuditEvent({ eventType, actor, action, traceId, details }) {
  writeAuditLog({ eventType, actor, action, traceId, details });
}

/**
 * Alias used in other modules
 */
export function auditEvent(action, context = {}) {
  const { actor = 'system', eventType = 'RBAC', traceId = 'unknown', details = {} } = context;

  writeAuditLog({
    eventType,
    actor,
    action,
    traceId,
    details,
  });
}

// ✅ Optional default export
export default {
  recordAuditEvent,
  auditEvent,
};
