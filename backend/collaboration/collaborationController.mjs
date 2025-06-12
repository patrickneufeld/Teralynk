// File Path: backend/collaboration/collaborationController.js

const express = require('express');
const {
    startSession,
    endSession,
    getSessionDetails,
    getActiveSessions,
} = require('../services/collaborationService');
const {
    addParticipant,
    removeParticipant,
    getParticipants,
    getTotalParticipants,
} = require('../services/participantService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// **1️⃣ Start a collaboration session**
router.post('/sessions', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { fileId, participants } = req.body;
        const session = await startSession(fileId, participants);
        res.status(201).json({ message: 'Session started successfully.', session });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'An error occurred while starting the session.' });
    }
});

// **2️⃣ End a collaboration session**
router.delete('/sessions/:id', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        await endSession(sessionId);
        res.status(200).json({ message: 'Session ended successfully.' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'An error occurred while ending the session.' });
    }
});

// **3️⃣ Get session details**
router.get('/sessions/:id', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const session = await getSessionDetails(sessionId);
        res.status(200).json({ session });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'An error occurred while fetching session details.' });
    }
});

// **4️⃣ Get all active collaboration sessions**
router.get('/sessions', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const sessions = await getActiveSessions(page, limit);
        res.status(200).json({ sessions });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({ error: 'An error occurred while fetching active sessions.' });
    }
});

// **5️⃣ Add a participant to a session**
router.post('/sessions/:id/participants', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const { userId } = req.body;
        await addParticipant(sessionId, userId);
        res.status(200).json({ message: 'Participant added successfully.' });
    } catch (error) {
        console.error('Error adding participant:', error);
        res.status(500).json({ error: 'An error occurred while adding participant.' });
    }
});

// **6️⃣ Remove a participant from a session**
router.delete('/sessions/:id/participants/:userId', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { id: sessionId, userId } = req.params;
        await removeParticipant(sessionId, userId);
        res.status(200).json({ message: 'Participant removed successfully.' });
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ error: 'An error occurred while removing participant.' });
    }
});

// **7️⃣ Get participants in a session**
router.get('/sessions/:id/participants', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const { id: sessionId } = req.params;
        const participants = await getParticipants(sessionId);
        res.status(200).json({ participants });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ error: 'An error occurred while fetching participants.' });
    }
});

// **8️⃣ Get total participants across all sessions**
router.get('/participants/total', authMiddleware, rbacMiddleware('user'), async (req, res) => {
    try {
        const total = await getTotalParticipants();
        res.status(200).json({ total });
    } catch (error) {
        console.error('Error fetching total participants:', error);
        res.status(500).json({ error: 'An error occurred while fetching total participants.' });
    }
});

module.exports = router;
