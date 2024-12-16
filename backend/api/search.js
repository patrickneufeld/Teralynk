// File: /backend/api/search.js

const express = require('express');
const router = express.Router();
const {
    searchFiles,
    getSearchHistory,
    clearSearchHistory
} = require('../services/searchService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Route to handle search requests**
router.post('/search', rbacMiddleware('user'), validateRequestBody(['query', 'userId']), async (req, res) => {
    try {
        const {
            query,
            userId,
            limit = 10,
            page = 1,
            filters = {}, // Filters for metadata (e.g., fileType, dateCreated)
            sortBy = 'relevance', // Sorting options: relevance, dateCreated, fileName
            sortOrder = 'desc', // Sorting order: asc or desc
        } = req.body;

        // Perform the search
        const results = await searchFiles(query, userId, filters);

        // Sort results
        results.sort((a, b) => {
            if (sortBy === 'relevance') {
                return sortOrder === 'asc' ? a.relevance - b.relevance : b.relevance - a.relevance;
            } else if (sortBy === 'dateCreated') {
                return sortOrder === 'asc'
                    ? new Date(a.dateCreated) - new Date(b.dateCreated)
                    : new Date(b.dateCreated) - new Date(a.dateCreated);
            } else if (sortBy === 'fileName') {
                return sortOrder === 'asc'
                    ? a.fileName.localeCompare(b.fileName)
                    : b.fileName.localeCompare(a.fileName);
            }
            return 0;
        });

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedResults = results.slice(startIndex, startIndex + limit);

        // Return response
        res.status(200).json({
            results: paginatedResults,
            totalResults: results.length,
            page,
            totalPages: Math.ceil(results.length / limit),
        });
    } catch (error) {
        console.error('Error in search API:', error);
        res.status(500).json({ error: 'An error occurred while performing the search.', details: error.message });
    }
});

// **2️⃣ Get search history for a user**
router.get('/history', rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const history = await getSearchHistory(userId);
        res.status(200).json({ message: 'Search history retrieved successfully.', history });
    } catch (error) {
        console.error('Error retrieving search history:', error);
        res.status(500).json({ error: 'An error occurred while retrieving search history.', details: error.message });
    }
});

// **3️⃣ Clear search history for a user**
router.delete('/history', rbacMiddleware('user'), validateRequestBody(['userId']), async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await clearSearchHistory(userId);
        res.status(200).json({ message: 'Search history cleared successfully.', response });
    } catch (error) {
        console.error('Error clearing search history:', error);
        res.status(500).json({ error: 'An error occurred while clearing search history.', details: error.message });
    }
});

module.exports = router;
