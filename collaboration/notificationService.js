// File Path: backend/collaboration/notificationService.js

const { sendNotificationToUser } = require('./socketServer');
const logger = require('../config/logger'); // Centralized logger

/**
 * Sends a notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} message - The notification message to send.
 * @param {object} [payload] - Additional data to include in the notification.
 */
const notifyUser = async (userId, message, payload = {}) => {
    if (!userId || !message) {
        throw new Error('User ID and message are required to send a notification.');
    }

    try {
        const notification = { message, timestamp: new Date(), ...payload };
        await sendNotificationToUser(userId, notification);
        logger.info(`Notification sent to user ${userId}: ${message}`);
    } catch (error) {
        logger.error(`Failed to send notification to user ${userId}:`, error);
        throw new Error('Failed to send notification.');
    }
};

/**
 * Sends a notification to all users.
 * @param {string} message - The notification message to send.
 * @param {object} [payload] - Additional data to include in the notification.
 */
const notifyAllUsers = async (message, payload = {}) => {
    if (!message) {
        throw new Error('Message is required to send a notification to all users.');
    }

    try {
        const notification = { message, timestamp: new Date(), ...payload };
        await sendNotificationToUser('all', notification);
        logger.info(`Notification sent to all users: ${message}`);
    } catch (error) {
        logger.error('Failed to send notification to all users:', error);
        throw new Error('Failed to send notification to all users.');
    }
};

/**
 * Sends a notification to a list of users.
 * @param {Array<string>} userIds - An array of user IDs to notify.
 * @param {string} message - The notification message to send.
 * @param {object} [payload] - Additional data to include in the notification.
 */
const notifyMultipleUsers = async (userIds, message, payload = {}) => {
    if (!Array.isArray(userIds) || userIds.length === 0 || !message) {
        throw new Error('A list of user IDs and a message are required to send notifications.');
    }

    const errors = [];
    const notification = { message, timestamp: new Date(), ...payload };

    await Promise.all(
        userIds.map(async (userId) => {
            try {
                await sendNotificationToUser(userId, notification);
                logger.info(`Notification sent to user ${userId}: ${message}`);
            } catch (error) {
                logger.error(`Failed to send notification to user ${userId}:`, error);
                errors.push(userId);
            }
        })
    );

    if (errors.length > 0) {
        logger.warn(
            `Notifications failed for the following users: ${errors.join(', ')}`
        );
        throw new Error(`Notifications failed for some users: ${errors.join(', ')}`);
    }
};

/**
 * Tracks the status of sent notifications.
 * @param {string} notificationId - The ID of the notification to track.
 * @returns {object} - The status of the notification.
 */
const trackNotificationStatus = async (notificationId) => {
    if (!notificationId) {
        throw new Error('Notification ID is required to track the status.');
    }

    // Simulated status retrieval logic
    const status = {
        notificationId,
        delivered: true,
        timestamp: new Date(),
    };

    logger.info(`Notification status retrieved for ID ${notificationId}:`, status);
    return status;
};

module.exports = {
    notifyUser,
    notifyAllUsers,
    notifyMultipleUsers,
    trackNotificationStatus,
};
