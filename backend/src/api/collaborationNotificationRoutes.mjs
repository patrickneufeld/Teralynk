///Users/patrick/Projects/Teralynk/backend/src/api/collaborationNotificationRoutes.mjs
const express = require('express');
const router = express.Router();
const { 
    notifyUser, 
    notifyAllUsers, 
    notifyMultipleUsers 
} = require('../services/collaborationNotificationService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// **1️⃣ Send notification to a specific user**
router.post('/user', rbacMiddleware('user'), async (req, res) => {
    const { userId, message } = req.body;
    try {
        await notifyUser(userId, message);
        res.status(200).json({ success: true, message: 'Notification sent successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error sending notification.' });
    }
});

// **2️⃣ Send notification to all users in session**
router.post('/all', rbacMiddleware('user'), async (req, res) => {
    const { message } = req.body;
    try {
        await notifyAllUsers(message);
        res.status(200).json({ success: true, message: 'Notification sent to all users.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error sending notification to all users.' });
    }
});

// **3️⃣ Send notification to multiple users**
router.post('/multiple', rbacMiddleware('user'), async (req, res) => {
    const { userIds, message } = req.body;
    try {
        await notifyMultipleUsers(userIds, message);
        res.status(200).json({ success: true, message: 'Notification sent to multiple users.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error sending notification to multiple users.' });
    }
});

module.exports = router;
