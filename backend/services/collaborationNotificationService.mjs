const { sendNotificationToUser } = require('../utils/socketServer'); // Assuming socketServer sends messages to connected users

/**
 * Sends a notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} message - The notification message.
 * @param {string} priority - The priority of the notification (normal, urgent).
 */
const notifyUser = async (userId, message, priority = 'normal') => {
    if (!userId || !message) {
        throw new Error('User ID and message are required to send a notification.');
    }

    try {
        const notification = { message, priority, timestamp: new Date() };
        await sendNotificationToUser(userId, notification);
        console.log(`Notification sent to user ${userId}: ${message} with priority: ${priority}`);
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
};

/**
 * Sends a notification to all users in the collaboration session.
 * @param {string} message - The notification message.
 * @param {string} priority - The priority of the notification.
 */
const notifyAllUsers = async (message, priority = 'normal') => {
    if (!message) {
        throw new Error('Message is required to send a notification to all users.');
    }

    try {
        const notification = { message, priority, timestamp: new Date() };
        await sendNotificationToUser('all', notification);
        console.log(`Notification sent to all users: ${message}`);
    } catch (error) {
        console.error('Error sending notification to all users:', error);
    }
};

/**
 * Sends a notification to a list of users.
 * @param {Array<string>} userIds - The list of user IDs to notify.
 * @param {string} message - The notification message.
 * @param {string} priority - The priority of the notification.
 */
const notifyMultipleUsers = async (userIds, message, priority = 'normal') => {
    if (!Array.isArray(userIds) || userIds.length === 0 || !message) {
        throw new Error('A list of user IDs and a message are required to send notifications.');
    }

    try {
        for (const userId of userIds) {
            const notification = { message, priority, timestamp: new Date() };
            await sendNotificationToUser(userId, notification);
            console.log(`Notification sent to user ${userId}: ${message}`);
        }
    } catch (error) {
        console.error('Error sending notification to multiple users:', error);
    }
};

/**
 * Sends an acknowledgment request to a user and waits for their response.
 * @param {string} userId - The user ID.
 * @param {string} notificationId - The notification ID to acknowledge.
 */
const sendAcknowledgmentRequest = async (userId, notificationId) => {
    try {
        const ackMessage = {
            type: 'acknowledgment',
            notificationId,
            timestamp: new Date(),
        };
        await sendNotificationToUser(userId, ackMessage);
        console.log(`Acknowledgment request sent to user ${userId} for notification ${notificationId}`);
    } catch (error) {
        console.error('Error sending acknowledgment request:', error);
    }
};

/**
 * Handle notification analytics, e.g., count sent notifications.
 */
const logNotificationAnalytics = async (message, priority) => {
    // Simulate logging to an analytics service
    console.log(`Logged notification analytics: Message: "${message}", Priority: ${priority}`);
};

module.exports = {
    notifyUser,
    notifyAllUsers,
    notifyMultipleUsers,
    sendAcknowledgmentRequest,
    logNotificationAnalytics,
};
