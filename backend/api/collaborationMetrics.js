// File Path: backend/api/collaborationMetrics.js

const express = require('express');
const router = express.Router();
const { getMetrics } = require('../services/collaborationMetricsService');

// **Get collaboration metrics**
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await getMetrics();
        res.status(200).json({ success: true, message: 'Metrics retrieved successfully', data: metrics });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred while retrieving metrics.' });
    }
});

module.exports = router;
