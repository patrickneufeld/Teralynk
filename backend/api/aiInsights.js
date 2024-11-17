// File: /backend/api/aiInsights.js

const express = require('express');
const router = express.Router();
const {
    generateEntityId,
    analyzeFileContent,
    queryInsights,
} = require('../services/aiInsightsService');
const privacyMiddleware = require('../middleware/privacyMiddleware');

// Analyze a file's content and extract insights
router.post('/analyze', privacyMiddleware('user'), async (req, res) => {
    try {
        const { entityId, filePath } = req.body;

        if (!entityId || !filePath) {
            return res.status(400).json({ error: 'Entity ID and file path are required.' });
        }

        const insights = await analyzeFileContent(entityId, filePath);
        res.status(200).json({ message: 'File analyzed successfully.', insights });
    } catch (error) {
        console.error('Error analyzing file content:', error);
        res.status(500).json({ error: 'An error occurred while analyzing the file content.' });
    }
});

// Query AI insights for specific queries
router.post('/query', privacyMiddleware('user'), async (req, res) => {
    try {
        const { entityId, query } = req.body;

        if (!entityId || !query) {
            return res.status(400).json({ error: 'Entity ID and query are required.' });
        }

        const results = await queryInsights(entityId, query);
        res.status(200).json({ message: 'Query executed successfully.', results });
    } catch (error) {
        console.error('Error querying AI insights:', error);
        res.status(500).json({ error: 'An error occurred while querying AI insights.' });
    }
});

// Generate a unique entity ID
router.post('/generate-entity-id', (req, res) => {
    try {
        const { entityType, entityName } = req.body;

        if (!entityType || !entityName) {
            return res.status(400).json({ error: 'Entity type and entity name are required.' });
        }

        const entityId = generateEntityId(entityType, entityName);
        res.status(200).json({ message: 'Entity ID generated successfully.', entityId });
    } catch (error) {
        console.error('Error generating entity ID:', error);
        res.status(500).json({ error: 'An error occurred while generating the entity ID.' });
    }
});

module.exports = router;
