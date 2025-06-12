// File Path: backend/src/api/repoRoutes.mjs

const express = require('express');
const UserRepository = require('../models/UserRepository');
const rateLimit = require('express-rate-limit');
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

// Rate limiter for integrations endpoint
const integrationsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the integrations service. Please try again later.',
});

// **Fetch available integrations**
router.get('/integrations', integrationsRateLimiter, authenticateUser, rbacMiddleware('user'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        // Build query for search (if applicable)
        const query = search
            ? { name: { $regex: search, $options: 'i' } } // Case-insensitive search by name
            : {};

        // Fetch integrations with pagination
        const integrations = await UserRepository.find(query, 'name apiBaseUrl')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Count total integrations for pagination metadata
        const totalIntegrations = await UserRepository.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Integrations retrieved successfully.',
            data: {
                integrations,
                total: totalIntegrations,
                page: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (err) {
        console.error('Error fetching integrations:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch integrations.',
        });
    }
});

module.exports = router;
