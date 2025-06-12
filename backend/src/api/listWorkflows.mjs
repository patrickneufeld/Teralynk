// File Path: backend/src/api/listWorkflows.mjs

const express = require('express');
const { getAllWorkflows, getWorkflowInsights } = require('../services/workflowService'); // AI-driven insights
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for the workflows endpoint
const workflowsRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the workflows endpoint. Please try again later.',
});

/**
 * Retrieve all workflows with optional AI insights, pagination, filtering, and sorting
 */
router.get('/', workflowsRateLimiter, authenticateUser, rbacMiddleware(['read'], ['user', 'admin']), async (req, res) => {
    try {
        const { page = 1, limit = 10, sort, filter } = req.query;

        // Fetch workflows with pagination and filtering
        const workflows = await getAllWorkflows({ page: parseInt(page), limit: parseInt(limit), sort, filter });

        // Optional: Get AI-driven workflow insights
        const insights = await getWorkflowInsights(workflows);

        res.status(200).json({
            success: true,
            message: 'Workflows retrieved successfully.',
            data: workflows,
            insights, // Include AI insights if available
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows.',
        });
    }
});

module.exports = router;
