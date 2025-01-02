// File: backend/api/metrics.js

const express = require('express');
const { getGlobalAnalytics, getActiveSessionsAnalytics, getSessionAnalytics } = require('../services/analyticsService');
const router = express.Router();

// **Get global metrics**
router.get('/global', async (req, res) => {
    try {
        const analytics = await getGlobalAnalytics();
        res.status(200).json(analytics);
    } catch (error) {
        console.error('Error fetching global metrics:', error);
        res.status(500).json({ error: 'Failed to retrieve global metrics.' });
    }
});

// **Get metrics for active sessions**
router.get('/active-sessions', async (req, res) => {
    try {
        const analytics = await getActiveSessionsAnalytics();
        res.status(200).json(analytics);
    } catch (error) {
        console.error('Error fetching active session metrics:', error);
        res.status(500).json({ error: 'Failed to retrieve active session metrics.' });
    }
});

// **Get metrics for a specific session**
router.get('/sessions/:id', async (req, res) => {
    const { id: sessionId } = req.params;

    try {
        const analytics = await getSessionAnalytics(sessionId);
        res.status(200).json(analytics);
    } catch (error) {
        console.error(`Error fetching metrics for session ${sessionId}:`, error);
        res.status(500).json({ error: `Failed to retrieve metrics for session ${sessionId}.` });
    }
});

module.exports = router;
