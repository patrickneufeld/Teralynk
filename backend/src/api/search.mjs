// File Path: backend/src/api/search.mjs

const express = require('express');
const router = express.Router();
const {
    searchFiles,
    getSearchHistory,
    clearSearchHistory,
} = require('../services/searchService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Rate limiter for search endpoints
const searchRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the search service. Please try again later.',
});

// **1️⃣ Handle search requests**
router.post('/search', searchRateLimiter, rbacMiddleware('user'), validateRequestBody(['query', 'userId']), async (req, res) => {
    try {
        const {
            query,
            userId,
            limit = 10,
            page = 1,
            filters = {}, // Metadata filters (e.g., fileType, dateCreated)
            sortBy = 'relevance', // Sorting options: relevance, dateCreated, fileName
            sortOrder = 'desc', // Sorting order: asc or desc
        } = req.body;

        // Validate sorting options
        const validSortBy = ['relevance', 'dateCreated', 'fileName'];
        const validSortOrder = ['asc', 'desc'];

        if (!validSortBy.includes(sortBy) || !validSortOrder.includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                error: `Invalid sortBy or sortOrder. Valid sortBy options: ${validSortBy.join(', ')}, sortOrder: ${validSortOrder.join(', ')}`,
            });
        }

        // Perform the search
        const results = await searchFiles(query, userId, filters);

        // Apply sorting
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

        res.status(200).json({
            success: true,
            message: 'Search results retrieved successfully.',
            data: {
                results: paginatedResults,
                totalResults: results.length,
                page,
                totalPages: Math.ceil(results.length / limit),
            },
        });
    } catch (error) {
        console.error('Error in search API:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while performing the search.',
        });
    }
});

// **2️⃣ Get search history for a user**
router.get('/history', searchRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const history = await getSearchHistory(userId);
        res.status(200).json({
            success: true,
            message: 'Search history retrieved successfully.',
            data: history,
        });
    } catch (error) {
        console.error('Error retrieving search history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving search history.',
        });
    }
});

// **3️⃣ Clear search history for a user**
router.delete('/history', searchRateLimiter, rbacMiddleware('user'), validateRequestBody(['userId']), async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await clearSearchHistory(userId);
        res.status(200).json({
            success: true,
            message: 'Search history cleared successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error clearing search history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while clearing search history.',
        });
    }
});

module.exports = router;
