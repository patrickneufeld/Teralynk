// File Path: backend/api/listWorkflows.js

const express = require('express');
const { getAllWorkflows } = require('../services/workflowService');
const { authenticateUser } = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

const router = express.Router();

/**
 * Retrieve all workflows
 */
router.get('/', authenticateUser, rbacMiddleware(['read'], ['user', 'admin']), async (req, res) => {
    try {
        const workflows = await getAllWorkflows();
        res.status(200).json({ success: true, data: workflows });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch workflows' });
    }
});

module.exports = router;
