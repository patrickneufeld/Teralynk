/* File Path: backend/src/ai/aiNotificationManager.js */

import EventEmitter from "events";
class NotificationManager extends EventEmitter {}
const aiNotifier = new NotificationManager();

function sendNotification(eventType, message) {
    aiNotifier.emit(eventType, message);
}

module.exports = { aiNotifier, sendNotification };