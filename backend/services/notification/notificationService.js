// File: /backend/services/notificationService.js

const WebSocket = require('ws');
const Redis = require('redis'); // Redis for persistence and message brokering
const { hasPermission } = require('../common/rbacService'); // RBAC integration
const { recordActivity } = require('../activityLogService'); // Activity log integration
const { sendEmailNotification, sendPushNotification } = require('./notificationFallbackService'); // Fallback notifications

// **Redis client for session persistence and notifications**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// **In-memory notification store (to be replaced with Redis or database in production)**
const activeConnections = new Map();
const userPreferences = new Map();

// **Rate limiter for notifications (can be replaced with Redis for distributed systems)**
const rateLimit = new Map();

// **Add a new WebSocket connection for a user**
const addConnection = (userId, ws) => {
    if (!userId || !ws) {
        throw new Error('User ID and WebSocket instance are required.');
    }
    activeConnections.set(userId, ws);
    console.log(`Connection added for user: ${userId}`);
};

// **Remove a WebSocket connection for a user**
const removeConnection = (userId) => {
    if (activeConnections.has(userId)) {
        activeConnections.delete(userId);
        console.log(`Connection removed for user: ${userId}`);
    }
};

// **Send a notification to a specific user**
const sendNotification = async (userId, notification) => {
    try {
        // **RBAC permission check**
        if (!hasPermission(userId, `notify:${notification.type}`)) {
            console.error(`User ${userId} does not have permission for notification type: ${notification.type}`);
            return { success: false, message: 'Permission denied for this notification type.' };
        }

        // **Rate limiting logic**
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

        // **User preferences check**
        const preferences = userPreferences.get(userId) || {};
        if (preferences[notification.type] === false) {
            console.log(`Notification of type '${notification.type}' is disabled for user: ${userId}`);
            return { success: false, message: 'Notification type is disabled for the user.' };
        }

        // **Send notification via WebSocket if online**
        const connection = activeConnections.get(userId);
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify(notification));
            console.log(`Notification sent to user: ${userId}`);

            // **Log activity**
            await recordActivity(userId, 'sendNotification', null, { notification });
            return { success: true };
        } else {
            // **Fallback for offline users**
            await sendEmailNotification(userId, notification);
            await sendPushNotification(userId, notification);
            return { success: false, message: 'User is offline; fallback notifications sent.' };
        }
    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        return { success: false, message: 'An error occurred while sending the notification.' };
    }
};

// **Broadcast a notification to all connected users**
const broadcastNotification = async (notification) => {
    try {
        activeConnections.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(notification));
                console.log(`Notification broadcasted to user: ${userId}`);
            }
        });

        // **Log activity**
        await recordActivity(null, 'broadcastNotification', null, { notification });

        return { success: true };
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return { success: false, message: 'An error occurred while broadcasting notifications.' };
    }
};

// **Set user preferences for notifications**
const setUserPreferences = (userId, preferences) => {
    userPreferences.set(userId, preferences);
    console.log(`Notification preferences updated for user: ${userId}`);
    return { userId, preferences };
};

// **Get user preferences for notifications**
const getUserPreferences = (userId) => {
    return userPreferences.get(userId) || {};
};

// **Format a notification**
const createNotification = (type, message, data = {}) => {
    return {
        id: uuidv4(),
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
};
