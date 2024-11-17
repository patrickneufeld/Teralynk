// File: /backend/api/notificationDashboard.js

const express = require('express');
const router = express.Router();
const {
    addNotification,
    getNotifications,
    markAsRead,
    clearNotifications,
} = require('../services/notificationDashboardService');

// Add a new notification
router.post('/add', async (req, res) => {
    try {
        const { userId, type, message, data } = req.body;

        if (!userId || !type || !message) {
            return res.status(400).json({ error: 'User ID, type, and message are required.' });
        }

        const notification = addNotification(userId, type, message, data);
        res.status(201).json({ message: 'Notification added successfully.', notification });
    } catch (error) {
        console.error('Error adding notification:', error);
        res.status(500).json({ error: 'An error occurred while adding the notification.' });
    }
});

// Get all notifications for a user
router.get('/list', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const notifications = getNotifications(userId);
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        res.status(500).json({ error: 'An error occurred while retrieving notifications.' });
    }
});

// Mark a notification as read
router.post('/mark-as-read', async (req, res) => {
    try {
        const { userId, notificationId } = req.body;

        if (!userId || !notificationId) {
            return res.status(400).json({ error: 'User ID and notification ID are required.' });
        }

        const notification = markAsRead(userId, notificationId);
        res.status(200).json({ message: 'Notification marked as read.', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while marking the notification as read.' });
    }
});

// Clear all notifications for a user
router.delete('/clear', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const response = clearNotifications(userId);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'An error occurred while clearing notifications.' });
    }
});

module.exports = router;
