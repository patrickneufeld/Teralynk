// File Path: backend/src/api/fileRoutes.mjs

const express = require('express');
const router = express.Router();
const {
    uploadFile,
    downloadFile,
    deleteFile,
    getFileMetadata,
    searchFiles,
} = require('../services/fileService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');
const validateRequestBody = require('../middleware/validateRequestBody');

// Rate limiter for file-related endpoints
const fileRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests to the file service. Please try again later.',
});

// **1️⃣ Upload a file**
router.post('/upload', fileRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { file } = req.files;

        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided for upload.',
            });
        }

        const result = await uploadFile(file);
        res.status(201).json({
            success: true,
            message: 'File uploaded successfully.',
            data: result,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while uploading the file.',
        });
    }
});

// **2️⃣ Download a file**
router.get('/download/:fileId', fileRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { fileId } = req.params;

        const fileStream = await downloadFile(fileId);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while downloading the file.',
        });
    }
});

// **3️⃣ Delete a file**
router.delete('/:fileId', fileRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { fileId } = req.params;

        const result = await deleteFile(fileId);
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'File not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'File deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while deleting the file.',
        });
    }
});

// **4️⃣ Get file metadata**
router.get('/metadata/:fileId', fileRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { fileId } = req.params;

        const metadata = await getFileMetadata(fileId);
        if (!metadata) {
            return res.status(404).json({
                success: false,
                error: 'File not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'File metadata retrieved successfully.',
            data: metadata,
        });
    } catch (error) {
        console.error('Error retrieving file metadata:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving file metadata.',
        });
    }
});

// **5️⃣ Search for files**
router.get('/search', fileRateLimiter, rbacMiddleware('user'), async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required.',
            });
        }

        const results = await searchFiles(query);
        res.status(200).json({
            success: true,
            message: 'Files retrieved successfully.',
            data: results,
        });
    } catch (error) {
        console.error('Error searching files:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while searching files.',
        });
    }
});

module.exports = router;
