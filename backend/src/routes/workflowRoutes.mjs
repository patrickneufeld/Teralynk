//File: /backend/src/routes/workflowRoutes.mjs

import express from 'express';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { rbacMiddleware } from '../middleware/rbacMiddleware.mjs';
import { handleValidationErrors } from '../middleware/inputValidationMiddleware.mjs';
import { logInfo, logError } from '../utils/logging/index.mjs';

const router = express.Router();

const workflowRateLimiter = rateLimit({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 50,
message: 'Too many requests to workflow routes. Please try again later.',
});

const requiredWorkflowFunctions = [
'createWorkflow',
'listWorkflows',
'getWorkflowDetails',
'updateWorkflow',
'deleteWorkflow',
'executeWorkflow',
'cloneWorkflow',
'searchWorkflows',
'pauseWorkflowExecution',
'resumeWorkflowExecution',
'cancelWorkflowExecution',
'getWorkflowExecutionLogs',
'validateWorkflowTasks',
'saveWorkflowVersion',
'getWorkflowVersionHistory',
'optimizeWorkflow',
'resolveConflicts',
'shareWorkflow',
'assignWorkflowOwner',
'getSharedWorkflows',
'archiveWorkflow',
'restoreWorkflow',
'trackWorkflowUsage',
'logWorkflowError',
'generateWorkflowReport',
'scheduleWorkflowExecution',
];

const validateFunctions = (service, required) => {
for (const fn of required) {
if (typeof service[fn] !== 'function') {
logError(`Missing workflow service function: ${fn}`);
throw new Error(`Missing workflow service function: ${fn}`);
}
}
};

let workflowService = null;

async function initializeWorkflowService() {
try {
const serviceModule = await import('../services/workflowService.mjs');
const actualService = serviceModule.default || serviceModule;
validateFunctions(actualService, requiredWorkflowFunctions);
workflowService = actualService;
logInfo('✅ Workflow service loaded and validated successfully');
} catch (error) {
logError('❌ Failed to load workflow service', {
error: error.message,
stack: error.stack,
});
router.use('*', (req, res) => {
res.status(500).json({
error: 'Workflow API unavailable',
code: 'WORKFLOW_API_UNAVAILABLE',
});
});
}
}

// POST /create
router.post(
'/create',
workflowRateLimiter,
rbacMiddleware('admin'),
body('name').exists().withMessage('Workflow name is required'),
body('steps').isArray().withMessage('Steps must be an array'),
handleValidationErrors,
async (req, res, next) => {
try {
const workflow = await workflowService.createWorkflow(req.body);
res.status(201).json(workflow);
} catch (error) {
next(error);
}
}
);

// GET /
router.get(
'/',
workflowRateLimiter,
rbacMiddleware('user'),
async (req, res, next) => {
try {
const { page = 1, limit = 10, status } = req.query;
const workflows = await workflowService.listWorkflows({
page: Number(page),
limit: Number(limit),
status: status || null,
});
res.json(workflows);
} catch (error) {
next(error);
}
}
);

// GET /:workflowId
router.get(
'/:workflowId',
workflowRateLimiter,
rbacMiddleware('user'),
param('workflowId').isUUID().withMessage('Invalid workflow ID'),
handleValidationErrors,
async (req, res, next) => {
try {
const workflow = await workflowService.getWorkflowDetails(req.params.workflowId);
res.json(workflow);
} catch (error) {
next(error);
}
}
);

// PUT /update/:workflowId
router.put(
'/update/:workflowId',
workflowRateLimiter,
rbacMiddleware('admin'),
param('workflowId').isUUID().withMessage('Invalid workflow ID'),
body('updates').isObject().withMessage('Updates must be an object'),
handleValidationErrors,
async (req, res, next) => {
try {
const updatedWorkflow = await workflowService.updateWorkflow(req.params.workflowId, req.body.updates);
res.json(updatedWorkflow);
} catch (error) {
next(error);
}
}
);

// DELETE /delete/:workflowId
router.delete(
'/delete/:workflowId',
workflowRateLimiter,
rbacMiddleware('admin'),
param('workflowId').isUUID().withMessage('Invalid workflow ID'),
handleValidationErrors,
async (req, res, next) => {
try {
const deletedWorkflow = await workflowService.deleteWorkflow(req.params.workflowId);
res.json(deletedWorkflow);
} catch (error) {
next(error);
}
}
);
// POST /execute
router.post(
'/execute',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('input').optional(),
handleValidationErrors,
async (req, res, next) => {
try {
const result = await workflowService.executeWorkflow(req.body.workflowId, req.body.input || {});
res.json(result);
} catch (error) {
next(error);
}
}
);

// POST /clone
router.post(
'/clone',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const clonedWorkflow = await workflowService.cloneWorkflow(req.body.workflowId);
res.status(201).json(clonedWorkflow);
} catch (error) {
next(error);
}
}
);

// POST /search
router.post(
'/search',
workflowRateLimiter,
rbacMiddleware('user'),
body('query').isString().withMessage('Search query is required'),
body('page').optional().isInt({ min: 1 }),
body('limit').optional().isInt({ min: 1 }),
body('status').optional().isString(),
body('sortBy').optional().isString(),
body('sortOrder').optional().isString(),
handleValidationErrors,
async (req, res, next) => {
try {
const { query: keyword, page, limit, status, sortBy, sortOrder } = req.body;
const results = await workflowService.searchWorkflows({
keyword,
page,
limit,
status,
sortBy,
sortOrder,
});
res.json(results);
} catch (error) {
next(error);
}
}
);

// POST /pause
router.post(
'/pause',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const pausedWorkflow = await workflowService.pauseWorkflowExecution(req.body.workflowId);
res.json(pausedWorkflow);
} catch (error) {
next(error);
}
}
);

// POST /resume
router.post(
'/resume',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const resumedWorkflow = await workflowService.resumeWorkflowExecution(req.body.workflowId);
res.json(resumedWorkflow);
} catch (error) {
next(error);
}
}
);

// POST /cancel
router.post(
'/cancel',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const canceledWorkflow = await workflowService.cancelWorkflowExecution(req.body.workflowId);
res.json(canceledWorkflow);
} catch (error) {
next(error);
}
}
);

// GET /logs/:workflowId
router.get(
'/logs/:workflowId',
workflowRateLimiter,
rbacMiddleware('admin'),
param('workflowId').isUUID().withMessage('Invalid workflow ID'),
handleValidationErrors,
async (req, res, next) => {
try {
const logs = await workflowService.getWorkflowExecutionLogs(req.params.workflowId);
res.json(logs);
} catch (error) {
next(error);
}
}
);

// POST /validate-tasks
router.post(
'/validate-tasks',
workflowRateLimiter,
rbacMiddleware('admin'),
body('tasks').isArray().withMessage('Tasks must be an array'),
handleValidationErrors,
async (req, res, next) => {
try {
const validation = await workflowService.validateWorkflowTasks(req.body.tasks);
res.json({ valid: validation });
} catch (error) {
next(error);
}
}
);

// POST /save-version
router.post(
'/save-version',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('version').isObject().withMessage('Version data is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const savedVersion = await workflowService.saveWorkflowVersion(req.body.workflowId, req.body.version);
res.status(201).json(savedVersion);
} catch (error) {
next(error);
}
}
);

// GET /versions/:workflowId
router.get(
'/versions/:workflowId',
workflowRateLimiter,
rbacMiddleware('user'),
param('workflowId').isUUID().withMessage('Invalid workflow ID'),
handleValidationErrors,
async (req, res, next) => {
try {
const versions = await workflowService.getWorkflowVersionHistory(req.params.workflowId);
res.json(versions);
} catch (error) {
next(error);
}
}
);

// POST /optimize
router.post(
'/optimize',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflow').isObject().withMessage('Workflow object is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const optimized = await workflowService.optimizeWorkflow(req.body.workflow);
res.json(optimized);
} catch (error) {
next(error);
}
}
);

// POST /resolve-conflicts
router.post(
'/resolve-conflicts',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflow').isObject().withMessage('Workflow object is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const resolved = await workflowService.resolveConflicts(req.body.workflow);
res.json(resolved);
} catch (error) {
next(error);
}
}
);
// POST /share
router.post(
'/share',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('userId').isUUID().withMessage('User ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const shareResult = await workflowService.shareWorkflow(req.body.workflowId, req.body.userId);
res.json(shareResult);
} catch (error) {
next(error);
}
}
);

// POST /assign-owner
router.post(
'/assign-owner',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('ownerId').isUUID().withMessage('Owner ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const updated = await workflowService.assignWorkflowOwner(req.body.workflowId, req.body.ownerId);
res.json(updated);
} catch (error) {
next(error);
}
}
);

// GET /shared
router.get(
'/shared',
workflowRateLimiter,
rbacMiddleware('user'),
query('userId').isUUID().withMessage('User ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const sharedWorkflows = await workflowService.getSharedWorkflows(req.query.userId);
res.json(sharedWorkflows);
} catch (error) {
next(error);
}
}
);

// POST /archive
router.post(
'/archive',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const archived = await workflowService.archiveWorkflow(req.body.workflowId);
res.json(archived);
} catch (error) {
next(error);
}
}
);

// POST /restore
router.post(
'/restore',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const restored = await workflowService.restoreWorkflow(req.body.workflowId);
res.json(restored);
} catch (error) {
next(error);
}
}
);

// POST /track-usage
router.post(
'/track-usage',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('userId').optional().isUUID(),
handleValidationErrors,
async (req, res, next) => {
try {
await workflowService.trackWorkflowUsage(req.body.workflowId, req.body.userId || null);
res.status(204).send();
} catch (error) {
next(error);
}
}
);

// POST /log-error
router.post(
'/log-error',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('error').isObject().withMessage('Error object is required'),
handleValidationErrors,
async (req, res, next) => {
try {
await workflowService.logWorkflowError(req.body.workflowId, req.body.error);
res.status(204).send();
} catch (error) {
next(error);
}
}
);

// POST /generate-report
router.post(
'/generate-report',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
handleValidationErrors,
async (req, res, next) => {
try {
const report = await workflowService.generateWorkflowReport(req.body.workflowId);
res.json(report);
} catch (error) {
next(error);
}
}
);

// POST /schedule
router.post(
'/schedule',
workflowRateLimiter,
rbacMiddleware('admin'),
body('workflowId').isUUID().withMessage('Workflow ID is required'),
body('scheduleTime').isISO8601().withMessage('Schedule time must be a valid ISO8601 date'),
handleValidationErrors,
async (req, res, next) => {
try {
const scheduled = await workflowService.scheduleWorkflowExecution(req.body.workflowId, req.body.scheduleTime);
res.json(scheduled);
} catch (error) {
next(error);
}
}
);

// Initialize the workflow service module and handle errors
await initializeWorkflowService();

export default router;