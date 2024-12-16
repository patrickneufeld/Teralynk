const WebSocket = require('ws');
const { hasPermission } = require('./rbacService'); // RBAC integration
const { recordActivity } = require('./activityLogService'); // Activity log integration
const Redis = require('redis'); // Redis for persistence and message brokering
const { sendEmailNotification, sendPushNotification } = require('./notificationFallbackService'); // Fallback notifications

// In-memory notification store (replace with Redis or database for production)
const activeConnections = new Map();
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

// Stores user-specific notification preferences (could be moved to Redis or a database)
const userPreferences = new Map();

// Rate limiter for notification sending
const rateLimit = new Map();

// Add a new WebSocket connection for a user
const addConnection = (userId, ws) => {
    if (!userId || !ws) {
        throw new Error('User ID and WebSocket instance are required.');
    }
    activeConnections.set(userId, ws);
    console.log(`Connection added for user: ${userId}`);
};

// Remove a WebSocket connection for a user
const removeConnection = (userId) => {
    if (activeConnections.has(userId)) {
        activeConnections.delete(userId);
        console.log(`Connection removed for user: ${userId}`);
    }
};

// Send a notification to a specific user
const sendNotification = async (userId, notification) => {
    try {
        // Check if user has permission to receive this notification type
        if (!hasPermission(userId, `notify:${notification.type}`)) {
            console.error(`User ${userId} does not have permission for notification type: ${notification.type}`);
            return { success: false, message: 'Permission denied for this notification type.' };
        }

        // Rate limit logic
        const now = Date.now();
        const userRateLimit = rateLimit.get(userId) || { lastSent: 0, count: 0 };

        if (now - userRateLimit.lastSent < 60000 && userRateLimit.count >= 10) {
            console.log(`User ${userId} has exceeded the notification rate limit.`);
            return { success: false, message: 'Rate limit exceeded. Please try again later.' };
        }

        if (now - userRateLimit.lastSent >= 60000) {
            rateLimit.set(userId, { lastSent: now, count: 0 });
        }

        rateLimit.get(userId).count += 1;

        // Check user preferences (if notifications are enabled for the type)
        const preferences = userPreferences.get(userId) || {};
        if (preferences[notification.type] === false) {
            console.log(`Notification of type '${notification.type}' is disabled for user: ${userId}`);
            return { success: false, message: 'Notification type is disabled for the user.' };
        }

        // Send notification to the WebSocket connection if online
        const connection = activeConnections.get(userId);
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(notification));
            console.log(`Notification sent to user: ${userId}`);

            // Log activity for sending a notification
            await recordActivity(userId, 'sendNotification', null, { notification });

            return { success: true };
        } else {
            // Fallback if user is offline (send email or push notification)
            await sendFallbackNotification(userId, notification);
            return { success: false, message: 'User is offline; fallback notification sent.' };
        }
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

        // Log activity for broadcasting a notification
        await recordActivity(null, 'broadcastNotification', null, { notification });

        return { success: true };
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return { success: false, message: 'An error occurred while broadcasting notifications.' };
    }
};

// Fallback mechanism for offline users (email or push notification)
const sendFallbackNotification = async (userId, notification) => {
    try {
        // Simulate sending an email or push notification
        console.log(`Sending fallback notification to user: ${userId}`, notification);
        await sendEmailNotification(userId, notification);
        await sendPushNotification(userId, notification);

        return { success: true };
    } catch (error) {
        console.error('Error sending fallback notification:', error);
        return { success: false, message: 'An error occurred while sending fallback notification.' };
    }
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
