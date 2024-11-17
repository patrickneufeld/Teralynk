// File: /backend/services/notificationDashboardService.js

const { v4: uuidv4 } = require('uuid');

// In-memory notification store (replace with database for production)
const userNotifications = {};

// Add a new notification for a user
const addNotification = (userId, type, message, data = {}) => {
    if (!userId || !type || !message) {
        throw new Error('User ID, type, and message are required to add a notification.');
    }

    const notification = {
        id: uuidv4(),
        type,
        message,
        data,
        timestamp: new Date(),
        read: false,
    };

    if (!userNotifications[userId]) {
        userNotifications[userId] = [];
    }

    userNotifications[userId].push(notification);
    console.log(`Notification added for user ${userId}: ${message}`);
    return notification;
};

// Get all notifications for a user
const getNotifications = (userId) => {
    if (!userNotifications[userId]) {
        return [];
    }

    return userNotifications[userId];
};

// Mark a notification as read
const markAsRead = (userId, notificationId) => {
    if (!userNotifications[userId]) {
        throw new Error(`No notifications found for user ${userId}`);
    }

    const notification = userNotifications[userId].find((n) => n.id === notificationId);

    if (!notification) {
        throw new Error(`Notification ID ${notificationId} not found for user ${userId}`);
    }

    notification.read = true;
    console.log(`Notification ${notificationId} marked as read for user ${userId}`);
    return notification;
};

// Clear all notifications for a user
const clearNotifications = (userId) => {
    if (!userNotifications[userId]) {
        return { message: 'No notifications to clear.' };
    }

    delete userNotifications[userId];
    console.log(`All notifications cleared for user ${userId}`);
    return { message: 'All notifications cleared successfully.' };
};

module.exports = {
    addNotification,
    getNotifications,
    markAsRead,
    clearNotifications,
};
