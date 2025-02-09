// File Path: backend/api/metadataRoutes.js

const express = require('express');
const router = express.Router();
const {
    extractMetadata,
    saveOrUpdateMetadata,
    getMetadata,
    getMetadataHistory,
    deleteMetadata,
    searchMetadata,
    getMetadataDetails,
    updateMetadata,
    analyzeMetadata, // AI-driven analysis
} = require('../services/metadataService');
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

// Rate limiter for metadata endpoints
const metadataRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the metadata service. Please try again later.',
});

// **1️⃣ Extract and save metadata for a file**
router.post('/save', metadataRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath']), async (req, res) => {
    try {
        const { filePath, customMetadata = {} } = req.body;

        const metadata = await saveOrUpdateMetadata(filePath, customMetadata);
        res.status(201).json({
            success: true,
            message: 'Metadata saved successfully.',
            data: metadata,
        });
    } catch (error) {
        console.error('Error saving metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while saving metadata.',
        });
    }
});

// **2️⃣ Get metadata for a file (latest version)**
router.get('/get', metadataRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required.',
            });
        }

        const metadata = await getMetadata(filePath);
        res.status(200).json({
            success: true,
            message: 'Metadata retrieved successfully.',
            data: metadata,
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching metadata.',
        });
    }
});

// **3️⃣ Get metadata history for a file**
router.get('/history', metadataRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath, page = 1, limit = 10 } = req.query;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required.',
            });
        }

        const history = await getMetadataHistory(filePath, parseInt(page), parseInt(limit));
        res.status(200).json({
            success: true,
            message: 'Metadata history retrieved successfully.',
            data: history,
        });
    } catch (error) {
        console.error('Error fetching metadata history:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching metadata history.',
        });
    }
});

// **4️⃣ Delete metadata for a file**
router.delete('/delete', metadataRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath']), async (req, res) => {
    try {
        const { filePath } = req.body;

        const response = await deleteMetadata(filePath);
        res.status(200).json({
            success: true,
            message: 'Metadata deleted successfully.',
            data: response,
        });
    } catch (error) {
        console.error('Error deleting metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while deleting metadata.',
        });
    }
});

// **5️⃣ Search metadata**
router.post('/search', metadataRateLimiter, rbacMiddleware('user'), validateRequestBody(['filters']), async (req, res) => {
    try {
        const { filters } = req.body;

        if (Object.keys(filters).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one filter is required for searching metadata.',
            });
        }

        const results = await searchMetadata(filters);
        const insights = await analyzeMetadata(filters); // AI-driven insights
        res.status(200).json({
            success: true,
            message: 'Metadata search completed successfully.',
            data: {
                results,
                insights, // Include AI-driven insights
            },
        });
    } catch (error) {
        console.error('Error searching metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while searching metadata.',
        });
    }
});

// **6️⃣ Get detailed metadata for a specific file**
router.get('/details', metadataRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'File path is required.',
            });
        }

        const metadataDetails = await getMetadataDetails(filePath);
        res.status(200).json({
            success: true,
            message: 'Metadata details retrieved successfully.',
            data: metadataDetails,
        });
    } catch (error) {
        console.error('Error retrieving metadata details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving metadata details.',
        });
    }
});

// **7️⃣ Update metadata for a file**
router.put('/update', metadataRateLimiter, rbacMiddleware('user'), validateRequestBody(['filePath', 'updatedMetadata']), async (req, res) => {
    try {
        const { filePath, updatedMetadata } = req.body;

        const metadata = await updateMetadata(filePath, updatedMetadata);
        res.status(200).json({
            success: true,
            message: 'Metadata updated successfully.',
            data: metadata,
        });
    } catch (error) {
        console.error('Error updating metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating metadata.',
        });
    }
});

module.exports = router;
