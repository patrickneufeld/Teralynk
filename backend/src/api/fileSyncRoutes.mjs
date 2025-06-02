// File Path: backend/src/api/fileSyncRoutes.mjs

const express = require('express');
const router = express.Router();
const {
    syncFile,
    resolveFileConflicts,
    getSyncStatus,
    updateSyncState,
    listSyncHistory,
    getFileSyncDetails,
    analyzeConflicts, // AI-driven conflict resolution
} = require('../services/fileSyncService');
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

// Rate limiter for sync-related endpoints
const fileSyncRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many sync requests, please try again later.',
});

// **1️⃣ Sync a file**
router.post('/sync', fileSyncRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath', 'userId', 'changes']), async (req, res) => {
    try {
        const { filePath, userId, changes } = req.body;

        const syncResult = await syncFile(filePath, userId, changes);
        res.status(200).json({
            success: true,
            message: 'File synced successfully.',
            data: syncResult,
        });
    } catch (error) {
        console.error('Error syncing file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while syncing the file.',
        });
    }
});

// **2️⃣ Detect and resolve file conflicts with AI suggestions**
router.post('/resolve-conflicts', fileSyncRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath', 'userId', 'userChanges']), async (req, res) => {
    try {
        const { filePath, userId, userChanges } = req.body;

        const conflictResolution = await resolveFileConflicts(filePath, userId, userChanges);
        const aiSuggestions = await analyzeConflicts(filePath, userChanges); // AI suggestions

        res.status(200).json({
            success: true,
            message: 'Conflict resolution completed.',
            data: { conflictResolution, aiSuggestions },
        });
    } catch (error) {
        console.error('Error resolving conflicts:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while resolving conflicts.',
        });
    }
});

// **3️⃣ Get sync status for a file**
router.get('/status', fileSyncRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required.',
            });
        }

        const syncStatus = await getSyncStatus(filePath);
        res.status(200).json({
            success: true,
            message: 'Sync status retrieved successfully.',
            data: syncStatus,
        });
    } catch (error) {
        console.error('Error retrieving sync status:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving sync status.',
        });
    }
});

// **4️⃣ Update sync state for a file**
router.post('/update-state', fileSyncRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath', 'state']), async (req, res) => {
    try {
        const { filePath, state } = req.body;

        const updatedState = await updateSyncState(filePath, state);
        res.status(200).json({
            success: true,
            message: 'File sync state updated successfully.',
            data: updatedState,
        });
    } catch (error) {
        console.error('Error updating sync state:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating sync state.',
        });
    }
});

// **5️⃣ List sync history for a file**
router.get('/history', fileSyncRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, userId, sort, limit = 10 } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({
                success: false,
                error: 'File path and user ID are required.',
            });
        }

        const history = await listSyncHistory(filePath, userId, { sort, limit: parseInt(limit, 10) });
        res.status(200).json({
            success: true,
            message: 'Sync history retrieved successfully.',
            data: history,
        });
    } catch (error) {
        console.error('Error retrieving sync history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving sync history.',
        });
    }
});

// **6️⃣ Get file sync details**
router.get('/details/:filePath', fileSyncRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.params;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required.',
            });
        }

        const fileDetails = await getFileSyncDetails(filePath);
        res.status(200).json({
            success: true,
            message: 'File sync details retrieved successfully.',
            data: fileDetails,
        });
    } catch (error) {
        console.error('Error retrieving file sync details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving file sync details.',
        });
    }
});

module.exports = router;
