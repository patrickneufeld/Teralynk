const express = require('express');
const router = express.Router();
const { 
    startSession, 
    endSession, 
    getSessionDetails, 
    getActiveSessions 
} = require('../services/collaborationService');
const { validateSessionStart, validateSessionEnd } = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Start a collaboration session
router.post('/sessions', authMiddleware, validateSessionStart, async (req, res) => {
    try {
        const { fileId, participants } = req.body;
        const session = await startSession(fileId, participants);
        res.status(201).json({ message: 'Session started successfully.', session });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'An error occurred while starting the session.' });
    }
});

// End a collaboration session
router.delete('/sessions/:id', authMiddleware, validateSessionEnd, async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        await endSession(sessionId);
        res.status(200).json({ message: 'Session ended successfully.' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'An error occurred while ending the session.' });
    }
});

// Get details of a specific session
router.get('/sessions/:id', authMiddleware, async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const session = await getSessionDetails(sessionId);
        res.status(200).json({ session });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'An error occurred while fetching session details.' });
    }
});

// Get all active collaboration sessions
router.get('/sessions', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const sessions = await getActiveSessions(page, limit);
        res.status(200).json({ sessions });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({ error: 'An error occurred while fetching active sessions.' });
    }
});

module.exports = router;
