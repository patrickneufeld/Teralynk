// File: /backend/api/notification.js

const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const {
    addConnection,
    removeConnection,
    sendNotification,
    broadcastNotification,
    createNotification,
    setUserPreferences,
    getUserPreferences,
} = require('../services/notificationService');
const { hasPermission } = require('../services/rbacService'); // RBAC integration

// WebSocket endpoint for notifications
const setupNotificationWebSocket = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/notifications' });

    console.log('WebSocket server for notifications initialized.');

    wss.on('connection', (ws, req) => {
        const userId = req.url.split('?userId=')[1]; // Extract userId from the query string

        if (!userId) {
            console.error('Connection rejected: No userId provided.');
            ws.close();
            return;
        }

        console.log(`WebSocket connection established for user: ${userId}`);
        addConnection(userId, ws);

        // Handle WebSocket close event
        ws.on('close', () => {
            console.log(`WebSocket connection closed for user: ${userId}`);
            removeConnection(userId);
        });

        // Handle WebSocket errors
        ws.on('error', (error) => {
            console.error(`WebSocket error for user: ${userId}`, error);
        });
    });
};

// Send a notification to a specific user
router.post('/send', async (req, res) => {
    try {
        const { userId, type, message, data } = req.body;

        if (!userId || !type || !message) {
            return res.status(400).json({ error: 'UserId, type, and message are required.' });
        }

        // Enforce RBAC
        if (!hasPermission(userId, `notify:${type}`)) {
            return res.status(403).json({ error: 'Permission denied for this notification type.' });
        }

        const notification = createNotification(type, message, data);
        const response = await sendNotification(userId, notification);

        res.status(200).json({ message: 'Notification sent.', response });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'An error occurred while sending the notification.' });
    }
});

// Broadcast a notification to all users
router.post('/broadcast', async (req, res) => {
    try {
        const { type, message, data } = req.body;

        if (!type || !message) {
            return res.status(400).json({ error: 'Type and message are required.' });
        }

        const notification = createNotification(type, message, data);
        const response = await broadcastNotification(notification);

        res.status(200).json({ message: 'Notification broadcasted.', response });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({ error: 'An error occurred while broadcasting the notification.' });
    }
});

// Set user notification preferences
router.post('/preferences', async (req, res) => {
    try {
        const { userId, preferences } = req.body;

        if (!userId || !preferences) {
            return res.status(400).json({ error: 'UserId and preferences are required.' });
        }

        const updatedPreferences = setUserPreferences(userId, preferences);

        res.status(200).json({ message: 'Notification preferences updated.', preferences: updatedPreferences });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'An error occurred while updating preferences.' });
    }
});

// Get user notification preferences
router.get('/preferences', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'UserId is required.' });
        }

        const preferences = getUserPreferences(userId);

        res.status(200).json({ preferences });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'An error occurred while fetching preferences.' });
    }
});

module.exports = { router, setupNotificationWebSocket };
