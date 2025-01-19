const express = require('express');
const router = express.Router();
const {
    createWorkflow,
    listWorkflows,
    executeWorkflow,
    getWorkflowDetails,
    updateWorkflow,
    deleteWorkflow,
    cloneWorkflow,
    searchWorkflows,
    pauseWorkflowExecution,
    resumeWorkflowExecution,
    cancelWorkflowExecution,
    getWorkflowExecutionLogs,
    validateWorkflowTasks,
    saveWorkflowVersion,
    getWorkflowVersionHistory
} = require('../services/workflowService'); // Ensure these are correctly imported
const rbacMiddleware = require('../middleware/rbacMiddleware');
const { authenticateUser } = require('../middleware/authMiddleware');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Define API routes for workflow management
router.post('/create', rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res) => {
    try {
        const { name, tasks } = req.body;

        if (!Array.isArray(tasks)) {
            return res.status(400).json({ success: false, error: 'Tasks must be an array.' });
        }

        const result = await createWorkflow(name, tasks);
        res.status(201).json({
            success: true,
            message: 'Workflow created successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error creating workflow:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while creating the workflow.',
            details: error.message,
        });
    }
});

// Other route handlers like /list, /execute, etc., continue here...

module.exports = router;
