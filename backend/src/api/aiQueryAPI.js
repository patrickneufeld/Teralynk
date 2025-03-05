// File Path: backend/src/api/aiQueryAPI.js

/**
 * AI Query API
 * Handles API calls for querying AI models.
 */

import express from "express";
const router = express.Router();
const { logUsage } = require('../ai/aiUsageLogger');

router.post('/query', async (req, res) => {
    const { userId, query } = req.body;
    
    if (!userId || !query) {
        return res.status(400).json({ error: "Missing userId or query" });
    }

    const response = `AI Response for query: ${query}`;  // Placeholder

    logUsage(userId, query, response);
    res.json({ response });
});

module.exports = router;
