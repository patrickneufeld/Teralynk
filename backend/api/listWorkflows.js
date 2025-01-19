// File Path: backend/api/listWorkflows.js

const express = require('express');
const { getWorkflows } = require('../services/workflowService'); // Import the function to fetch all workflows
const rbacMiddleware = require('../middleware/rbacMiddleware'); // Middleware for role-based access control
const { authenticateUser } = require('../middleware/authMiddleware'); // Middleware to authenticate user

const router = express.Router();

/**
 * GET /workflows/list
 * Endpoint to retrieve all workflows.
 * Requires user authentication and proper role-based access control (RBAC).
 */
router.get('/', authenticateUser, rbacMiddleware('user'), async (req, res) => {
    try {
        // Fetch workflows from the service layer
        const workflows = await getWorkflows();

        // Send a successful response
        res.status(200).json({
            success: true,
            message: 'Workflows retrieved successfully.',
            data: workflows,
        });
    } catch (error) {
        // Log error and send a failure response
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows.',
            error: error.message,
        });
    }
});

module.exports = router;
