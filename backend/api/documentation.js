const express = require('express');
const router = express.Router();
const {
    generateApiDocs,
    getEndpointDetails,
    listAllEndpoints,
    searchApiDocs
} = require('../services/documentationService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate query parameters
const validateQueryParams = (requiredParams) => (req, res, next) => {
    const missingParams = requiredParams.filter(param => !req.query[param]);
    if (missingParams.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required query params: ${missingParams.join(', ')}` });
    }
    next();
};

// **1️⃣ Generate complete API documentation**
router.get('/generate', rbacMiddleware('admin'), async (req, res) => {
    try {
        const docs = await generateApiDocs();
        res.status(200).json({
            success: true,
            message: 'API documentation generated successfully.',
            data: docs,
        });
    } catch (error) {
        console.error('Error generating API documentation:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while generating API documentation.',
        });
    }
});

// **2️⃣ Retrieve details for a specific endpoint**
router.get('/endpoint', rbacMiddleware('user'), validateQueryParams(['endpoint']), async (req, res) => {
    try {
        const { endpoint } = req.query;

        const details = await getEndpointDetails(endpoint);
        if (!details) {
            return res.status(404).json({
                success: false,
                error: `Endpoint '${endpoint}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            message: `Details for endpoint '${endpoint}' retrieved successfully.`,
            data: details,
        });
    } catch (error) {
        console.error('Error retrieving endpoint details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving endpoint details.',
        });
    }
});

// **3️⃣ List all available endpoints**
router.get('/endpoints', rbacMiddleware('user'), async (req, res) => {
    try {
        const endpoints = await listAllEndpoints();
        res.status(200).json({
            success: true,
            message: 'List of all available API endpoints retrieved successfully.',
            data: endpoints,
        });
    } catch (error) {
        console.error('Error retrieving list of API endpoints:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving the list of endpoints.',
        });
    }
});

// **4️⃣ Search API documentation**
router.get('/search', rbacMiddleware('user'), validateQueryParams(['query']), async (req, res) => {
    try {
        const { query } = req.query;

        const searchResults = await searchApiDocs(query);
        res.status(200).json({
            success: true,
            message: 'Search results retrieved successfully.',
            data: searchResults,
        });
    } catch (error) {
        console.error('Error searching API documentation:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while searching API documentation.',
        });
    }
});

module.exports = router;
