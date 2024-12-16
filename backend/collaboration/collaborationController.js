const express = require('express');
const router = express.Router();
const { 
    startSession, 
    endSession, 
    getSessionDetails, 
    getActiveSessions 
} = require('../services/collaborationService');

// **Start a collaboration session via API**
router.post('/start', async (req, res) => {
    try {
        const { fileId, participants } = req.body;

        const session = await startSession(fileId, participants);
        res.status(201).json({ message: 'Session started successfully.', session });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'An error occurred while starting the session.' });
    }
});

// **End a collaboration session via API**
router.post('/end', async (req, res) => {
    try {
        const { sessionId } = req.body;

        await endSession(sessionId);
        res.status(200).json({ message: 'Session ended successfully.' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'An error occurred while ending the session.' });
    }
});

// **Get details of a session**
router.get('/details', async (req, res) => {
    try {
        const { sessionId } = req.query;

        const session = await getSessionDetails(sessionId);
        res.status(200).json({ session });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'An error occurred while fetching session details.' });
    }
});

// **Get all active collaboration sessions**
router.get('/active-sessions', async (req, res) => {
    try {
        const sessions = await getActiveSessions();
        res.status(200).json({ sessions });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({ error: 'An error occurred while fetching active sessions.' });
    }
});

module.exports = router;
