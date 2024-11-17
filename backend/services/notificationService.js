// File: /backend/services/notificationService.js

const WebSocket = require('ws');
const { hasPermission } = require('./rbacService'); // RBAC integration
const { recordActivity } = require('./activityLogService'); // Activity log integration

// In-memory notification store (replace with a message broker like Redis for production)
const activeConnections = new Map();
const userPreferences = new Map(); // Stores user-specific notification preferences

// Add a new connection
const addConnection = (userId, ws) => {
    if (!userId || !ws) {
        throw new Error('User ID and WebSocket instance are required.');
    }
    activeConnections.set(userId, ws);
    console.log(`Connection added for user: ${userId}`);
};

// Remove a connection
const removeConnection = (userId) => {
    if (activeConnections.has(userId)) {
        activeConnections.delete(userId);
        console.log(`Connection removed for user: ${userId}`);
    }
};

// Send a notification to a specific user
const sendNotification = async (userId, notification) => {
    try {
        // Check RBAC for notification type
        if (!hasPermission(userId, `notify:${notification.type}`)) {
            console.error(`User ${userId} does not have permission for notification type: ${notification.type}`);
            return { success: false, message: 'Permission denied for this notification type.' };
        }

        // Check user preferences
        const preferences = userPreferences.get(userId) || {};
        if (preferences[notification.type] === false) {
            console.log(`Notification of type '${notification.type}' is disabled for user: ${userId}`);
            return { success: false, message: 'Notification type is disabled for the user.' };
        }

        const connection = activeConnections.get(userId);

        if (!connection || connection.readyState !== WebSocket.OPEN) {
            console.error(`Unable to send notification: user ${userId} is not connected.`);
            // Fallback mechanism: send email or push notification
            await sendFallbackNotification(userId, notification);
            return { success: false, message: 'User is offline; fallback notification sent.' };
        }

        connection.send(JSON.stringify(notification));
        console.log(`Notification sent to user: ${userId}`);

        // Log activity
        await recordActivity(userId, 'notification', null, { notification });

        return { success: true };
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        return { success: false, message: 'An error occurred while sending the notification.' };
    }
};

// Broadcast a notification to all connected users
const broadcastNotification = async (notification) => {
    try {
        activeConnections.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(notification));
                console.log(`Notification broadcasted to user: ${userId}`);
            }
        });

        // Log activity
        await recordActivity(null, 'broadcastNotification', null, { notification });

        return { success: true };
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return { success: false, message: 'An error occurred while broadcasting notifications.' };
    }
};

// Fallback mechanism for offline users
const sendFallbackNotification = async (userId, notification) => {
    // Simulate sending an email or push notification
    console.log(`Sending fallback notification to user: ${userId}`, notification);
    return { success: true };
};

// Set user preferences for notifications
const setUserPreferences = (userId, preferences) => {
    userPreferences.set(userId, preferences);
    console.log(`Notification preferences updated for user: ${userId}`);
    return { userId, preferences };
};

// Get user preferences for notifications
const getUserPreferences = (userId) => {
    return userPreferences.get(userId) || {};
};

// Format a notification
const createNotification = (type, message, data = {}) => {
    return {
        id: Date.now(),
        type,
        message,
        data,
        timestamp: new Date(),
    };
};

module.exports = {
    addConnection,
    removeConnection,
    sendNotification,
    broadcastNotification,
    setUserPreferences,
    getUserPreferences,
    createNotification,
};
