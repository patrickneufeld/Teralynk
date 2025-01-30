// File Path: backend/controllers/collaborationNotificationController.js

const { notifyUser, notifyAllUsers, notifyMultipleUsers } = require('../services/collaborationNotificationService');

/**
 * Send a notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} message - The message to send.
 * @param {string} type - The type of notification (e.g., 'session-start', 'session-end').
 */
const sendUserNotification = async (userId, message, type) => {
    try {
        await notifyUser(userId, message);
        console.log(`Sent ${type} notification to user ${userId}: ${message}`);
    } catch (error) {
        console.error(`Error sending ${type} notification to user ${userId}:`, error);
    }
};

/**
 * Send a notification to all users in a collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} message - The message to send.
 * @param {string} type - The type of notification (e.g., 'session-update').
 */
const sendAllUsersNotification = async (sessionId, message, type) => {
    try {
        // Assuming we have a method to retrieve all users in the session
        const participants = await getParticipants(sessionId);  // This method would need to be implemented
        await notifyMultipleUsers(participants, message);
        console.log(`Sent ${type} notification to all users in session ${sessionId}: ${message}`);
    } catch (error) {
        console.error(`Error sending ${type} notification to all users in session ${sessionId}:`, error);
    }
};

/**
 * Send notifications to multiple users.
 * @param {Array<string>} userIds - An array of user IDs.
 * @param {string} message - The message to send.
 */
const sendMultipleUserNotifications = async (userIds, message) => {
    try {
        await notifyMultipleUsers(userIds, message);
        console.log(`Sent notification to multiple users: ${message}`);
    } catch (error) {
        console.error('Error sending notification to multiple users:', error);
    }
};

module.exports = {
    sendUserNotification,
    sendAllUsersNotification,
    sendMultipleUserNotifications,
};
