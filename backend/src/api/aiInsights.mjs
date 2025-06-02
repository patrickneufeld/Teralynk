// File Path: backend/src/api/aiInsightsRoutes.mjs

const express = require('express');
const router = express.Router();
const {
    generateEntityId,
    analyzeFileContent,
    queryInsights,
    deleteEntity,
    getEntityInsights,
    listEntities,
    queryMultipleAIs, // New functionality for querying multiple AIs
    getAIGroupSuggestions, // Suggest AI groupings
} = require('../services/aiInsightsService');
const privacyMiddleware = require('../middleware/privacyMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Rate limiter for AI-related routes
const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

// **1️⃣ Analyze a file's content and extract insights**
router.post('/analyze', aiRateLimiter, privacyMiddleware('user'), validateRequestBody(['entityId', 'filePath']), async (req, res) => {
    try {
        const { entityId, filePath } = req.body;

        const insights = await analyzeFileContent(entityId, filePath);
        res.status(200).json({ success: true, message: 'File analyzed successfully.', data: insights });
    } catch (error) {
        console.error('Error analyzing file content:', error);
        res.status(500).json({ success: false, error: 'An error occurred while analyzing the file content.' });
    }
});

// **2️⃣ Query multiple AIs based on a single command**
router.post('/query-multiple', aiRateLimiter, privacyMiddleware('user'), validateRequestBody(['aiGroup', 'query']), async (req, res) => {
    try {
        const { aiGroup, query } = req.body;

        const results = await queryMultipleAIs(aiGroup, query);
        res.status(200).json({ success: true, message: 'AI query executed successfully.', data: results });
    } catch (error) {
        console.error('Error querying multiple AIs:', error);
        res.status(500).json({ success: false, error: 'An error occurred while querying multiple AIs.' });
    }
});

// **3️⃣ Generate suggestions for AI groupings**
router.get('/ai-groups/suggestions', aiRateLimiter, privacyMiddleware('user'), async (req, res) => {
    try {
        const suggestions = await getAIGroupSuggestions();
        res.status(200).json({ success: true, message: 'AI group suggestions retrieved successfully.', data: suggestions });
    } catch (error) {
        console.error('Error retrieving AI group suggestions:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving AI group suggestions.' });
    }
});

// **4️⃣ Delete an entity**
router.delete('/entity/:id', aiRateLimiter, privacyMiddleware('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Entity ID is required.' });
        }

        const result = await deleteEntity(id);
        if (result) {
            res.status(200).json({ success: true, message: 'Entity deleted successfully.' });
        } else {
            res.status(404).json({ success: false, error: 'Entity not found.' });
        }
    } catch (error) {
        console.error('Error deleting entity:', error);
        res.status(500).json({ success: false, error: 'An error occurred while deleting the entity.' });
    }
});

// **5️⃣ Retrieve insights for a specific entity**
router.get('/entity/:id/insights', aiRateLimiter, privacyMiddleware('user'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Entity ID is required.' });
        }

        const insights = await getEntityInsights(id);
        if (insights) {
            res.status(200).json({ success: true, message: 'Entity insights retrieved successfully.', data: insights });
        } else {
            res.status(404).json({ success: false, error: 'Entity not found.' });
        }
    } catch (error) {
        console.error('Error retrieving entity insights:', error);
        res.status(500).json({ success: false, error: 'An error occurred while retrieving the entity insights.' });
    }
});

// **6️⃣ List all entities with pagination**
router.get('/entities', aiRateLimiter, privacyMiddleware('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const entities = await listEntities({ page: parseInt(page), limit: parseInt(limit) });
        res.status(200).json({ success: true, message: 'Entities listed successfully.', data: entities });
    } catch (error) {
        console.error('Error listing entities:', error);
        res.status(500).json({ success: false, error: 'An error occurred while listing entities.' });
    }
});

module.exports = router;
