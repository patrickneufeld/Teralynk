// File Path: backend/collaboration/notificationController.js

const express = require('express');
const {
    notifyUser,
    notifyAllUsers,
    notifyMultipleUsers,
} = require('../services/notificationService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// **1️⃣ Notify a specific user**
router.post('/notify/user', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                error: 'User ID and message are required.',
            });
        }

        await notifyUser(userId, message);
        res.status(200).json({
            success: true,
            message: `Notification sent to user ${userId}.`,
        });
    } catch (error) {
        console.error('Error notifying user:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while notifying the user.',
            details: error.message,
        });
    }
});

// **2️⃣ Notify all users**
router.post('/notify/all', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required to notify all users.',
            });
        }

        await notifyAllUsers(message);
        res.status(200).json({
            success: true,
            message: 'Notification sent to all users.',
        });
    } catch (error) {
        console.error('Error notifying all users:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while notifying all users.',
            details: error.message,
        });
    }
});

// **3️⃣ Notify multiple users**
router.post('/notify/multiple', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userIds, message } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0 || !message) {
            return res.status(400).json({
                success: false,
                error: 'A list of user IDs and a message are required.',
            });
        }

        await notifyMultipleUsers(userIds, message);
        res.status(200).json({
            success: true,
            message: `Notification sent to ${userIds.length} users.`,
        });
    } catch (error) {
        console.error('Error notifying multiple users:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while notifying multiple users.',
            details: error.message,
        });
    }
});

module.exports = router;
