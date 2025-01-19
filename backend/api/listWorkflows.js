// File: backend/api/listWorkflows.js

const express = require('express');
const { getAllWorkflows } = require('../services/workflowService'); // Import the function to fetch all workflows
const rbacMiddleware = require('../middleware/rbacMiddleware'); // Ensure this middleware is used for authorization
const { authenticateUser } = require('../middleware/authMiddleware'); // Middleware to authenticate user

const router = express.Router();

/**
 * GET /workflows/list
 * Endpoint to retrieve all workflows
 * Requires user authentication and proper role-based access control (RBAC)
 */
router.get('/', authenticateUser, rbacMiddleware('user'), async (req, res) => {
    try {
        const workflows = await getAllWorkflows(); // Fetch workflows from the service layer
        res.status(200).json({
            success: true,
            message: 'Workflows retrieved successfully.',
            data: workflows,
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workflows',
            error: error.message,
        });
    }
});

module.exports = router;
