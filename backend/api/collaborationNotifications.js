// File Path: backend/api/collaborationNotifications.js

const express = require('express');
const router = express.Router();
const { notifyUser, notifyAllUsers, notifyMultipleUsers } = require('../services/collaborationNotificationService');

// **Notify a single user**
router.post('/notify', async (req, res) => {
    try {
        const { userId, message } = req.body;
        await notifyUser(userId, message);
        res.status(200).json({ success: true, message: 'Notification sent successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while sending the notification.' });
    }
});

// **Notify all users**
router.post('/notify/all', async (req, res) => {
    try {
        const { message } = req.body;
        await notifyAllUsers(message);
        res.status(200).json({ success: true, message: 'Notification sent to all users.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while sending notifications to all users.' });
    }
});

// **Notify multiple users**
router.post('/notify/multiple', async (req, res) => {
    try {
        const { userIds, message } = req.body;
        await notifyMultipleUsers(userIds, message);
        res.status(200).json({ success: true, message: 'Notification sent to selected users.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while sending notifications to selected users.' });
    }
});

module.exports = router;
