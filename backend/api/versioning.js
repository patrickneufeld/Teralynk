// File Path: backend/api/versioning.js

const express = require('express');
const router = express.Router();
const {
    saveFileVersion,
    getFileVersionHistory,
    getLatestFileVersion,
    rollbackFileVersion,
    detectAndResolveConflicts,
    validateFileExists,
    deleteFileVersion,
    compareFileVersions,
} = require('../services/versioningService');
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

// Rate limiter for versioning endpoints
const versioningRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many versioning requests. Please try again later.',
});

// **1️⃣ Save a new version of a file**
router.post(
    '/save-version',
    versioningRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'userId', 'changes']),
    async (req, res) => {
        try {
            const { filePath, userId, changes, metadata = {} } = req.body;

            await validateFileExists(filePath); // Ensure file exists

            const newVersion = await saveFileVersion(filePath, userId, changes, metadata);
            res.status(201).json({
                success: true,
                message: 'Version saved successfully.',
                data: newVersion,
            });
        } catch (error) {
            console.error('Error saving file version:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while saving the file version.',
            });
        }
    }
);

// **2️⃣ Get version history for a file**
router.get('/version-history', versioningRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, userId, page = 1, limit = 10, filter } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({
                success: false,
                error: 'File path and user ID are required.',
            });
        }

        const history = await getFileVersionHistory(filePath, userId, parseInt(page), parseInt(limit), filter);
        res.status(200).json({
            success: true,
            message: 'Version history retrieved successfully.',
            data: history,
        });
    } catch (error) {
        console.error('Error fetching version history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching version history.',
        });
    }
});

// **3️⃣ Retrieve the latest version of a file**
router.get('/latest-version', versioningRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, userId } = req.query;

        if (!filePath || !userId) {
            return res.status(400).json({
                success: false,
                error: 'File path and user ID are required.',
            });
        }

        const latestVersion = await getLatestFileVersion(filePath, userId);
        res.status(200).json({
            success: true,
            message: 'Latest file version retrieved successfully.',
            data: latestVersion,
        });
    } catch (error) {
        console.error('Error retrieving latest version:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving the latest version.',
        });
    }
});

// **4️⃣ Rollback to a specific version**
router.post(
    '/rollback-version',
    versioningRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'userId', 'versionId']),
    async (req, res) => {
        try {
            const { filePath, userId, versionId } = req.body;

            const rolledBackVersion = await rollbackFileVersion(filePath, userId, versionId);
            res.status(200).json({
                success: true,
                message: 'File rolled back successfully.',
                data: rolledBackVersion,
            });
        } catch (error) {
            console.error('Error rolling back file version:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while rolling back the version.',
            });
        }
    }
);

// **5️⃣ Detect and resolve conflicts**
router.post(
    '/detect-conflicts',
    versioningRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'userId', 'userChanges']),
    async (req, res) => {
        try {
            const { filePath, userId, userChanges } = req.body;

            const conflictData = await detectAndResolveConflicts(filePath, userId, userChanges);
            res.status(200).json({
                success: true,
                message: 'Conflicts detected and resolved successfully.',
                data: conflictData,
            });
        } catch (error) {
            console.error('Error detecting conflicts:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while detecting conflicts.',
            });
        }
    }
);

// **6️⃣ Delete a specific version of a file**
router.delete(
    '/delete-version',
    versioningRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'versionId']),
    async (req, res) => {
        try {
            const { filePath, versionId } = req.body;

            const response = await deleteFileVersion(filePath, versionId);
            res.status(200).json({
                success: true,
                message: 'File version deleted successfully.',
                data: response,
            });
        } catch (error) {
            console.error('Error deleting file version:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while deleting the file version.',
            });
        }
    }
);

// **7️⃣ Compare two versions of a file**
router.post(
    '/compare-versions',
    versioningRateLimiter,
    rbacMiddleware('user'),
    validateRequestBody(['filePath', 'version1Id', 'version2Id']),
    async (req, res) => {
        try {
            const { filePath, version1Id, version2Id } = req.body;

            const comparisonResult = await compareFileVersions(filePath, version1Id, version2Id);
            res.status(200).json({
                success: true,
                message: 'File versions compared successfully.',
                data: comparisonResult,
            });
        } catch (error) {
            console.error('Error comparing file versions:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while comparing file versions.',
            });
        }
    }
);

module.exports = router;
