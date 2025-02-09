/* File Path: backend/src/ai/aiNotificationManager.js */

const EventEmitter = require('events');
class NotificationManager extends EventEmitter {}
const aiNotifier = new NotificationManager();

function sendNotification(eventType, message) {
    aiNotifier.emit(eventType, message);
}

module.exports = { aiNotifier, sendNotification };