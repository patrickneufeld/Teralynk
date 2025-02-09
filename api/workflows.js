// File Path: backend/api/workflows.js

const express = require('express');
const router = express.Router();
const {
    createWorkflow,
    listWorkflows,
    getWorkflowDetails,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    cloneWorkflow,
    searchWorkflows,
    pauseWorkflowExecution,
    resumeWorkflowExecution,
    cancelWorkflowExecution,
    getWorkflowExecutionLogs,
    validateWorkflowTasks,
    saveWorkflowVersion,
    getWorkflowVersionHistory,
    optimizeWorkflow,
    resolveConflicts,
    shareWorkflow,
    assignWorkflowOwner,
    getSharedWorkflows,
    archiveWorkflow,
    restoreWorkflow,
    trackWorkflowUsage,
    logWorkflowError,
    generateWorkflowReport,
    scheduleWorkflowExecution,
} = require('../services/workflowService');
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

// Rate limiter for workflow routes
const workflowRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to workflow routes. Please try again later.',
});

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    console.error(`Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'An internal server error occurred.',
    });
};

// **Routes for Workflow Management**

/**
 * 1️⃣ Create a new workflow
 */
router.post(
    '/create',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['name', 'tasks']),
    async (req, res, next) => {
        try {
            const { name, tasks } = req.body;
            const workflow = await createWorkflow(name, tasks);
            res.status(201).json({
                success: true,
                message: 'Workflow created successfully.',
                data: workflow,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 2️⃣ List all workflows with optional filters
 */
router.get(
    '/',
    workflowRateLimiter,
    rbacMiddleware('user'),
    async (req, res, next) => {
        try {
            const filters = req.query;
            const workflows = await listWorkflows(filters);
            res.status(200).json({
                success: true,
                message: 'Workflows retrieved successfully.',
                data: workflows,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 3️⃣ Schedule workflow execution
 */
router.post(
    '/schedule',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId', 'scheduleTime']),
    async (req, res, next) => {
        try {
            const { workflowId, scheduleTime } = req.body;
            const result = await scheduleWorkflowExecution(workflowId, scheduleTime);
            res.status(200).json({
                success: true,
                message: 'Workflow scheduled successfully.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 4️⃣ Optimize workflow using AI
 */
router.post(
    '/optimize',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId']),
    async (req, res, next) => {
        try {
            const { workflowId } = req.body;
            const optimizedWorkflow = await optimizeWorkflow(workflowId);
            res.status(200).json({
                success: true,
                message: 'Workflow optimized successfully.',
                data: optimizedWorkflow,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 5️⃣ Resolve workflow conflicts
 */
router.post(
    '/resolve-conflicts',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId', 'conflicts']),
    async (req, res, next) => {
        try {
            const { workflowId, conflicts } = req.body;
            const resolution = await resolveConflicts(workflowId, conflicts);
            res.status(200).json({
                success: true,
                message: 'Conflicts resolved successfully.',
                data: resolution,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 6️⃣ Retrieve shared workflows
 */
router.get(
    '/shared',
    workflowRateLimiter,
    rbacMiddleware('user'),
    async (req, res, next) => {
        try {
            const { userId } = req.query;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required.' });
            }
            const sharedWorkflows = await getSharedWorkflows(userId);
            res.status(200).json({
                success: true,
                message: 'Shared workflows retrieved successfully.',
                data: sharedWorkflows,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 7️⃣ Retrieve workflow logs
 */
router.get(
    '/logs/:workflowId',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    async (req, res, next) => {
        try {
            const { workflowId } = req.params;
            const logs = await getWorkflowExecutionLogs(workflowId);
            res.status(200).json({
                success: true,
                message: 'Workflow execution logs retrieved successfully.',
                data: logs,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 8️⃣ Pause workflow execution
 */
router.post(
    '/pause',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId']),
    async (req, res, next) => {
        try {
            const { workflowId } = req.body;
            const result = await pauseWorkflowExecution(workflowId);
            res.status(200).json({
                success: true,
                message: 'Workflow paused successfully.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 9️⃣ Resume workflow execution
 */
router.post(
    '/resume',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId']),
    async (req, res, next) => {
        try {
            const { workflowId } = req.body;
            const result = await resumeWorkflowExecution(workflowId);
            res.status(200).json({
                success: true,
                message: 'Workflow resumed successfully.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * 🔟 Cancel workflow execution
 */
router.post(
    '/cancel',
    workflowRateLimiter,
    rbacMiddleware('admin'),
    validateRequestBody(['workflowId']),
    async (req, res, next) => {
        try {
            const { workflowId } = req.body;
            const result = await cancelWorkflowExecution(workflowId);
            res.status(200).json({
                success: true,
                message: 'Workflow cancelled successfully.',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Attach Error Handling Middleware
 */
router.use(errorHandler);

/**
 * Export the router
 */
module.exports = router;
