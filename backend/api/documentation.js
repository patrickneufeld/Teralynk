// File: /Users/patrick/Projects/Teralynk/backend/api/documentation.js

const express = require('express');
const router = express.Router();
const { generateApiDocs, getEndpointDetails } = require('../services/documentationService');

// Generate API documentation
router.get('/generate', async (req, res) => {
    try {
        const docs = await generateApiDocs();
        res.status(200).json({ message: 'API documentation generated successfully.', docs });
    } catch (error) {
        console.error('Error generating API documentation:', error);
        res.status(500).json({ error: 'An error occurred while generating API documentation.' });
    }
});

// Retrieve details for a specific endpoint
router.get('/endpoint', async (req, res) => {
    try {
        const { endpoint } = req.query;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint parameter is required.' });
        }

        const details = await getEndpointDetails(endpoint);
        res.status(200).json({ endpoint, details });
    } catch (error) {
        console.error('Error retrieving endpoint details:', error);
        res.status(500).json({ error: 'An error occurred while retrieving endpoint details.' });
    }
});

module.exports = router;
