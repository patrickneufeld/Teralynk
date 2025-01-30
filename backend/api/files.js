// File Path: backend/api/files.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { validateFileType } = require('../middleware/fileValidationMiddleware'); // Custom middleware for file validation

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

// Rate limiter for upload endpoint
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: 'Too many file upload attempts, please try again later.',
});

// **Upload a file**
router.post(
    '/upload',
    uploadRateLimiter,
    upload.single('file'),
    validateFileType(['image/jpeg', 'image/png', 'application/pdf']), // Validate file type
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded.' });
            }

            // Example: Store file metadata in the database
            const fileMetadata = {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                uploadDate: new Date(),
            };

            // Simulate database save
            console.log('File metadata saved:', fileMetadata);

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully.',
                data: {
                    fileName: req.file.filename,
                    path: req.file.path,
                    metadata: fileMetadata,
                },
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            res.status(500).json({
                success: false,
                error: 'An error occurred while uploading the file.',
            });
        }
    }
);

module.exports = router;
