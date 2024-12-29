const express = require('express');
const router = express.Router();
const {
    generateEntityId,
    analyzeFileContent,
    queryInsights,
    deleteEntity,
    getEntityInsights,
    listEntities
} = require('../services/aiInsightsService');
const privacyMiddleware = require('../middleware/privacyMiddleware');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Analyze a file's content and extract insights**
router.post('/analyze', privacyMiddleware('user'), validateRequestBody(['entityId', 'filePath']), async (req, res) => {
    try {
        const { entityId, filePath } = req.body;

        const insights = await analyzeFileContent(entityId, filePath);
        res.status(200).json({ success: true, message: 'File analyzed successfully.', data: insights });
    } catch (error) {
        console.error('Error analyzing file content:', error);
        res.status(500).json({ success: false, error: 'An error occurred while analyzing the file content.' });
    }
});

// **2️⃣ Query AI insights for specific queries**
router.post('/query', privacyMiddleware('user'), validateRequestBody(['entityId', 'query']), async (req, res) => {
    try {
        const { entityId, query } = req.body;

        const results = await queryInsights(entityId, query);
        res.status(200).json({ success: true, message: 'Query executed successfully.', data: results });
    } catch (error) {
        console.error('Error querying AI insights:', error);
        res.status(500).json({ success: false, error: 'An error occurred while querying AI insights.' });
    }
});

// **3️⃣ Generate a unique entity ID**
router.post('/generate-entity-id', validateRequestBody(['entityType', 'entityName']), (req, res) => {
    try {
        const { entityType, entityName } = req.body;

        const entityId = generateEntityId(entityType, entityName);
        res.status(200).json({ success: true, message: 'Entity ID generated successfully.', data: { entityId } });
    } catch (error) {
        console.error('Error generating entity ID:', error);
        res.status(500).json({ success: false, error: 'An error occurred while generating the entity ID.' });
    }
});

// **4️⃣ Delete an entity**
router.delete('/entity/:id', privacyMiddleware('admin'), async (req, res) => {
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
router.get('/entity/:id/insights', privacyMiddleware('user'), async (req, res) => {
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
router.get('/entities', privacyMiddleware('admin'), async (req, res) => {
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
