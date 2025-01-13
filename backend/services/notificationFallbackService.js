// File: backend/services/notificationFallbackService.js

/**
 * Sends a fallback notification via email or another mechanism.
 * @param {string} userId - The user ID to notify.
 * @param {object} notification - The notification data.
 * @returns {Promise<void>}
 */
const sendFallbackNotification = async (userId, notification) => {
    console.log(`Fallback notification sent to user ${userId}:`, notification);
    // Implement your email/SMS or other fallback logic here
};

module.exports = { sendFallbackNotification };
