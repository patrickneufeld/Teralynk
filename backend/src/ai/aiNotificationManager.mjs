import { logAuditEntry } from "../guardrails/AuditLogger.mjs";
import { isKillSwitchEnabled } from "../guardrails/KillSwitch.mjs";
/* File Path: backend/src/ai/aiNotificationManager.js */

import EventEmitter from "events";
class NotificationManager extends EventEmitter {}
const aiNotifier = new NotificationManager();

function sendNotification(eventType, message) {
    aiNotifier.emit(eventType, message);
}

module.exports = { aiNotifier, sendNotification };