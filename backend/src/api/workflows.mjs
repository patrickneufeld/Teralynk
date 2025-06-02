// File: /Users/patrick/Projects/Teralynk/backend/src/api/workflows.mjs

import express from 'express';
import rateLimit from 'express-rate-limit';
import {
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
    scheduleWorkflowExecution
} from '../services/workflowService.mjs';
import { rbacMiddleware } from '../middleware/rbacMiddleware.mjs';

// -----------------------------
// Utilities
// -----------------------------
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

const workflowRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many requests to workflow routes. Please try again later.',
});

const errorHandler = (err, req, res, next) => {
    console.error(`Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(err.status || 500).json({ success: false, error: err.message || 'An internal server error occurred.' });
};

// -----------------------------
// Router Setup
// -----------------------------
const router = express.Router();

// 1️⃣ Create Workflow
router.post('/create', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['name', 'tasks']), async (req, res, next) => {
    try {
        const { name, tasks } = req.body;
        const workflow = await createWorkflow(name, tasks);
        res.status(201).json({ success: true, message: 'Workflow created successfully.', data: workflow });
    } catch (error) { next(error); }
});

// 2️⃣ List Workflows
router.get('/', workflowRateLimiter, rbacMiddleware('user'), async (req, res, next) => {
    try {
        const filters = req.query;
        const workflows = await listWorkflows(filters);
        res.status(200).json({ success: true, message: 'Workflows retrieved successfully.', data: workflows });
    } catch (error) { next(error); }
});

// 3️⃣ Get Workflow Details
router.get('/:workflowId', workflowRateLimiter, rbacMiddleware('user'), async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        const details = await getWorkflowDetails(workflowId);
        res.status(200).json({ success: true, data: details });
    } catch (error) { next(error); }
});

// 4️⃣ Update Workflow
router.put('/:workflowId', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['updates']), async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        const { updates } = req.body;
        const updatedWorkflow = await updateWorkflow(workflowId, updates);
        res.status(200).json({ success: true, data: updatedWorkflow });
    } catch (error) { next(error); }
});

// 5️⃣ Delete Workflow
router.delete('/:workflowId', workflowRateLimiter, rbacMiddleware('admin'), async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        await deleteWorkflow(workflowId);
        res.status(200).json({ success: true, message: 'Workflow deleted.' });
    } catch (error) { next(error); }
});

// 6️⃣ Execute Workflow
router.post('/execute', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const executionResult = await executeWorkflow(workflowId);
        res.status(200).json({ success: true, data: executionResult });
    } catch (error) { next(error); }
});

// 7️⃣ Clone Workflow
router.post('/clone', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const clone = await cloneWorkflow(workflowId);
        res.status(201).json({ success: true, data: clone });
    } catch (error) { next(error); }
});

// 8️⃣ Search Workflows
router.post('/search', workflowRateLimiter, rbacMiddleware('user'), validateRequestBody(['query']), async (req, res, next) => {
    try {
        const { query } = req.body;
        const results = await searchWorkflows(query);
        res.status(200).json({ success: true, data: results });
    } catch (error) { next(error); }
});

// 9️⃣ Schedule Workflow Execution
router.post('/schedule', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'scheduleTime']), async (req, res, next) => {
    try {
        const { workflowId, scheduleTime } = req.body;
        const result = await scheduleWorkflowExecution(workflowId, scheduleTime);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 🔟 Validate Workflow Tasks
router.post('/validate-tasks', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['tasks']), async (req, res, next) => {
    try {
        const { tasks } = req.body;
        const result = await validateWorkflowTasks(tasks);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 1️⃣1️⃣ Save Workflow Version
router.post('/save-version', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'versionData']), async (req, res, next) => {
    try {
        const { workflowId, versionData } = req.body;
        const result = await saveWorkflowVersion(workflowId, versionData);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 1️⃣2️⃣ Get Workflow Version History
router.get('/version-history/:workflowId', workflowRateLimiter, rbacMiddleware('admin'), async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        const history = await getWorkflowVersionHistory(workflowId);
        res.status(200).json({ success: true, data: history });
    } catch (error) { next(error); }
});

// 1️⃣3️⃣ Optimize Workflow
router.post('/optimize', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const optimizedWorkflow = await optimizeWorkflow(workflowId);
        res.status(200).json({ success: true, data: optimizedWorkflow });
    } catch (error) { next(error); }
});

// 1️⃣4️⃣ Resolve Conflicts
router.post('/resolve-conflicts', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'conflicts']), async (req, res, next) => {
    try {
        const { workflowId, conflicts } = req.body;
        const resolution = await resolveConflicts(workflowId, conflicts);
        res.status(200).json({ success: true, data: resolution });
    } catch (error) { next(error); }
});

// 1️⃣5️⃣ Share Workflow
router.post('/share', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'userId']), async (req, res, next) => {
    try {
        const { workflowId, userId } = req.body;
        const result = await shareWorkflow(workflowId, userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 1️⃣6️⃣ Assign Workflow Owner
router.post('/assign-owner', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'ownerId']), async (req, res, next) => {
    try {
        const { workflowId, ownerId } = req.body;
        const result = await assignWorkflowOwner(workflowId, ownerId);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 1️⃣7️⃣ Retrieve Shared Workflows
router.get('/shared', workflowRateLimiter, rbacMiddleware('user'), async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required.' });
        }
        const sharedWorkflows = await getSharedWorkflows(userId);
        res.status(200).json({ success: true, data: sharedWorkflows });
    } catch (error) { next(error); }
});

// 1️⃣8️⃣ Archive Workflow
router.post('/archive', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const result = await archiveWorkflow(workflowId);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 1️⃣9️⃣ Restore Workflow
router.post('/restore', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const result = await restoreWorkflow(workflowId);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 2️⃣0️⃣ Track Workflow Usage
router.post('/track-usage', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId']), async (req, res, next) => {
    try {
        const { workflowId } = req.body;
        const result = await trackWorkflowUsage(workflowId);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 2️⃣1️⃣ Log Workflow Error
router.post('/log-error', workflowRateLimiter, rbacMiddleware('admin'), validateRequestBody(['workflowId', 'errorMessage']), async (req, res, next) => {
    try {
        const { workflowId, errorMessage } = req.body;
        const result = await logWorkflowError(workflowId, errorMessage);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// 2️⃣2️⃣ Generate Workflow Report
router.get('/report/:workflowId', workflowRateLimiter, rbacMiddleware('admin'), async (req, res, next) => {
    try {
        const { workflowId } = req.params;
        const report = await generateWorkflowReport(workflowId);
        res.status(200).json({ success: true, data: report });
    } catch (error) { next(error); }
});

// 🛑 Attach Centralized Error Handler
router.use(errorHandler);

// ✅ Export as Default
export default router;
