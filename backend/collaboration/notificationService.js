// File Path: backend/collaboration/notificationService.js

const { sendNotificationToUser } = require('./socketServer');

/**
 * Sends a notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} message - The notification message to send.
 */
const notifyUser = (userId, message) => {
    if (!userId || !message) {
        throw new Error('User ID and message are required to send a notification.');
    }

    sendNotificationToUser(userId, { message, timestamp: new Date() });
    console.log(`Notification sent to user ${userId}: ${message}`);
};

/**
 * Sends a notification to all users.
 * @param {string} message - The notification message to send.
 */
const notifyAllUsers = (message) => {
    if (!message) {
        throw new Error('Message is required to send a notification to all users.');
    }

    sendNotificationToUser('all', { message, timestamp: new Date() });
    console.log(`Notification sent to all users: ${message}`);
};

/**
 * Sends a notification to a list of users.
 * @param {Array<string>} userIds - An array of user IDs to notify.
 * @param {string} message - The notification message to send.
 */
const notifyMultipleUsers = (userIds, message) => {
    if (!Array.isArray(userIds) || userIds.length === 0 || !message) {
        throw new Error('A list of user IDs and a message are required to send notifications.');
    }

    userIds.forEach((userId) => {
        sendNotificationToUser(userId, { message, timestamp: new Date() });
        console.log(`Notification sent to user ${userId}: ${message}`);
    });
};

module.exports = {
    notifyUser,
    notifyAllUsers,
    notifyMultipleUsers,
};
