// File Path: backend/src/api/synchronization.mjs

const express = require('express');
const router = express.Router();
const {
    queueFileForSync,
    processSyncQueue,
    syncOfflineChanges,
    getSyncStatus,
    getSyncHistory,
    clearSyncQueue,
} = require('../services/synchronizationService');
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

// Rate limiter for synchronization endpoints
const syncRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many synchronization requests. Please try again later.',
});

// **1️⃣ Queue a file for synchronization**
router.post(
    '/queue',
    syncRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'userId', 'platform']),
    async (req, res) => {
        try {
            const { filePath, userId, changes, platform, isOffline = false } = req.body;

            const task = await queueFileForSync(filePath, userId, changes, platform, isOffline);
            res.status(200).json({
                success: true,
                message: 'File queued for synchronization.',
                data: task,
            });
        } catch (error) {
            console.error('Error queuing file for sync:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while queuing the file for sync.',
            });
        }
    }
);

// **2️⃣ Process the synchronization queue (manual trigger)**
router.post('/process', syncRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        await processSyncQueue();
        res.status(200).json({
            success: true,
            message: 'Synchronization queue processed successfully.',
        });
    } catch (error) {
        console.error('Error processing synchronization queue:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing the synchronization queue.',
        });
    }
});

// **3️⃣ Synchronize offline changes for a user**
router.post(
    '/sync-offline',
    syncRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['userId', 'platform']),
    async (req, res) => {
        try {
            const { userId, platform } = req.body;

            await syncOfflineChanges(userId, platform);
            res.status(200).json({
                success: true,
                message: 'Offline changes synchronized successfully.',
            });
        } catch (error) {
            console.error('Error syncing offline changes:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while syncing offline changes.',
            });
        }
    }
);

// **4️⃣ Retrieve synchronization status**
router.get('/status', syncRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({
                success: false,
                error: 'File path and user ID are required.',
            });
        }

        const syncStatus = await getSyncStatus(filePath, userId);
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

// **5️⃣ Retrieve synchronization history for a user**
router.get('/history', syncRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { userId, page = 1, limit = 10, filter, sort } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required.',
            });
        }

        const history = await getSyncHistory(userId, parseInt(page), parseInt(limit), { filter, sort });
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

// **6️⃣ Clear the synchronization queue**
router.delete('/clear-queue', syncRateLimiter, rbacMiddleware('admin'), async (req, res) => {
    try {
        const response = await clearSyncQueue();
        res.status(200).json({
            success: true,
            message: 'Synchronization queue cleared successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error clearing synchronization queue:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while clearing the synchronization queue.',
        });
    }
});

module.exports = router;
