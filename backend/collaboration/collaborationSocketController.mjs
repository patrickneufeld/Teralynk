// File Path: backend/collaboration/collaborationSocketController.js

const express = require('express');
const WebSocket = require('ws');
const {
    startSocketServer,
    sendNotificationToUser,
    broadcastNotification,
    triggerNotification,
    forceDisconnectUser,
} = require('../services/socketServer');
const { addParticipant, removeParticipant } = require('../services/participantService');
const { updateUserPresence, getUserPresence } = require('../services/livePresenceService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Start the WebSocket server for collaboration.
 * This is a placeholder for initiating the WebSocket server in collaboration.
 */
router.post('/start-websocket', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const server = req.app.get('server'); // Assuming you pass the HTTP server to the app
        startSocketServer(server);
        res.status(200).json({ success: true, message: 'WebSocket server started for collaboration.' });
    } catch (error) {
        console.error('Error starting WebSocket server:', error);
        res.status(500).json({ success: false, error: 'An error occurred while starting the WebSocket server.' });
    }
});

/**
 * Handle adding participants via WebSocket
 */
router.post('/add-participant', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        await addParticipant(sessionId, userId);
        res.status(200).json({ success: true, message: `User ${userId} added to session ${sessionId}.` });
    } catch (error) {
        console.error('Error adding participant:', error);
        res.status(500).json({ success: false, error: 'An error occurred while adding a participant.' });
    }
});

/**
 * Handle removing participants via WebSocket
 */
router.post('/remove-participant', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        await removeParticipant(sessionId, userId);
        res.status(200).json({ success: true, message: `User ${userId} removed from session ${sessionId}.` });
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ success: false, error: 'An error occurred while removing a participant.' });
    }
});

/**
 * Notify a user via WebSocket
 */
router.post('/notify-user', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId, message } = req.body;
        await sendNotificationToUser(userId, { message });
        res.status(200).json({ success: true, message: `Notification sent to user ${userId}.` });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, error: 'An error occurred while sending notification.' });
    }
});

/**
 * Broadcast a notification to all users via WebSocket
 */
router.post('/broadcast-notification', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { message } = req.body;
        await broadcastNotification({ message });
        res.status(200).json({ success: true, message: 'Notification broadcasted to all users.' });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({ success: false, error: 'An error occurred while broadcasting notification.' });
    }
});

/**
 * Force disconnect a user from the collaboration WebSocket
 */
router.post('/force-disconnect', authMiddleware, rbacMiddleware('admin'), async (req, res) => {
    try {
        const { userId } = req.body;
        forceDisconnectUser(userId);
        res.status(200).json({ success: true, message: `User ${userId} has been forcibly disconnected.` });
    } catch (error) {
        console.error('Error disconnecting user:', error);
        res.status(500).json({ success: false, error: 'An error occurred while disconnecting the user.' });
    }
});

/**
 * Get current user presence in a session.
 */
router.get('/presence/:sessionId', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const presenceData = await getUserPresence(sessionId);
        res.status(200).json({ success: true, data: presenceData });
    } catch (error) {
        console.error('Error retrieving user presence:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving user presence.' });
    }
});

module.exports = router;
