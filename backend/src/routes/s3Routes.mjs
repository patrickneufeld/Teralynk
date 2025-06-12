// ✅ FILE: /backend/src/routes/s3Routes.js

import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { logError, logInfo } from '../utils/logging/index.mjs';
import crypto from 'crypto';
import mime from 'mime-types';

const router = express.Router();

// AWS S3 Client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer middleware for handling uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max
    }
});

// Helper to generate unique S3 keys
const generateFileKey = (userId, originalName) => {
    const ext = originalName.split('.').pop();
    const uniqueName = crypto.randomBytes(16).toString('hex');
    return `uploads/${userId}/${uniqueName}.${ext}`;
};

/**
 * @route POST /api/s3/upload
 * Upload a file to S3
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const bucketName = process.env.S3_STORAGE_BUCKET;
        const key = generateFileKey(req.user.id, req.file.originalname);

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype || mime.lookup(req.file.originalname) || 'application/octet-stream'
        };

        await s3.send(new PutObjectCommand(uploadParams));

        logInfo('✅ File uploaded to S3', { key, userId: req.user.id });

        return res.status(201).json({ 
            message: 'File uploaded successfully',
            key
        });

    } catch (error) {
        logError('❌ S3 upload failed', { error: error.message });
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

/**
 * @route GET /api/s3/download/:key
 * Generate a pre-signed download URL
 */
router.get('/download/:key', requireAuth, async (req, res) => {
    try {
        const { key } = req.params;
        const bucketName = process.env.S3_STORAGE_BUCKET;

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour validity

        logInfo('✅ Pre-signed download URL generated', { key, userId: req.user.id });

        return res.json({ url });

    } catch (error) {
        logError('❌ Failed to generate download URL', { error: error.message });
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

/**
 * @route DELETE /api/s3/delete/:key
 * Delete a file from S3
 */
router.delete('/delete/:key', requireAuth, async (req, res) => {
    try {
        const { key } = req.params;
        const bucketName = process.env.S3_STORAGE_BUCKET;

        const deleteParams = {
            Bucket: bucketName,
            Key: key
        };

        await s3.send(new DeleteObjectCommand(deleteParams));

        logInfo('✅ File deleted from S3', { key, userId: req.user.id });

        return res.json({ message: 'File deleted successfully' });

    } catch (error) {
        logError('❌ S3 delete failed', { error: error.message });
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
