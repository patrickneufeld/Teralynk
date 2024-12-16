// File: /backend/api/notificationDashboard.js

const express = require('express');
const router = express.Router();
const {
    addNotification,
    getNotifications,
    markAsRead,
    clearNotifications,
    getUnreadCount,
    deleteNotification
} = require('../services/notificationDashboardService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Add a new notification**
router.post('/add', rbacMiddleware('user'), validateRequestBody(['userId', 'type', 'message']), async (req, res) => {
    try {
        const { userId, type, message, data } = req.body;

        const notification = await addNotification(userId, type, message, data);
        res.status(201).json({ message: 'Notification added successfully.', notification });
    } catch (error) {
        console.error('Error adding notification:', error);
        res.status(500).json({ error: 'An error occurred while adding the notification.' });
    }
});

// **2️⃣ Get all notifications for a user**
router.get('/list', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const notifications = await getNotifications(userId);
        res.status(200).json({ message: 'Notifications retrieved successfully.', notifications });
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ error: 'An error occurred while retrieving notifications.' });
    }
});

// **3️⃣ Mark a notification as read**
router.post('/mark-as-read', rbacMiddleware('user'), validateRequestBody(['userId', 'notificationId']), async (req, res) => {
    try {
        const { userId, notificationId } = req.body;

        const notification = await markAsRead(userId, notificationId);
        res.status(200).json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while marking the notification as read.' });
    }
});

// **4️⃣ Clear all notifications for a user**
router.delete('/clear', rbacMiddleware('user'), validateRequestBody(['userId']), async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await clearNotifications(userId);
        res.status(200).json({ message: 'User notifications cleared successfully.', response });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'An error occurred while clearing notifications.' });
    }
});

// **5️⃣ Get unread notifications count for a user**
router.get('/unread-count', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const unreadCount = await getUnreadCount(userId);
        res.status(200).json({ message: 'Unread notification count retrieved successfully.', unreadCount });
    } catch (error) {
        console.error('Error retrieving unread count:', error);
        res.status(500).json({ error: 'An error occurred while retrieving unread notifications count.' });
    }
});

// **6️⃣ Delete a specific notification for a user**
router.delete('/delete/:notificationId', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.body;
        const { notificationId } = req.params;

        if (!userId || !notificationId) {
            return res.status(400).json({ error: 'User ID and notification ID are required.' });
        }

        const response = await deleteNotification(userId, notificationId);
        res.status(200).json({ message: 'Notification deleted successfully.', response });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'An error occurred while deleting the notification.' });
    }
});

module.exports = router;
