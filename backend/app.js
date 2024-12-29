const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');
const fs = require('fs');
const formidable = require('formidable');
const shortid = require('shortid');
const winston = require('winston');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables from .env file
dotenv.config();

// Validate critical environment variables
['AWS_REGION', 'BUCKET_NAME', 'JWT_SECRET'].forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
});

// Initialize Express app
const app = express();

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

// Set up middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Logger setup with winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

// Centralized error handler
app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(err.status || 500).send({ error: err.message });
});

// Middleware for authentication
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        logger.error('Invalid token:', err);
        return res.status(401).send('Unauthorized: Invalid token');
    }
};

// File upload route
app.post('/api/files/upload', authenticate, (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            return next(err);
        }

        const { userId } = req.user;
        const file = files.file;

        if (!file) {
            return res.status(400).send('No file provided.');
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: `users/${userId}/${file.originalFilename}`,
            Body: fs.createReadStream(file.filepath),
            ContentType: file.mimetype,
        };

        s3Client.send(new PutObjectCommand(params))
            .then(() => res.send({ message: 'File uploaded successfully' }))
            .catch(next);
    });
});

// Generate signed URL for downloading files
app.post('/api/files/generate-link', authenticate, async (req, res, next) => {
    const { fileName, expiresIn = 3600 } = req.body;

    const params = {
        Bucket: BUCKET_NAME,
        Key: `users/${req.user.userId}/${fileName}`,
    };

    try {
        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn });
        res.send({ url });
    } catch (err) {
        next(err);
    }
});

// Paginated file listing
app.get('/api/files/list', authenticate, async (req, res, next) => {
    const { continuationToken, maxKeys = 10 } = req.query;

    const params = {
        Bucket: BUCKET_NAME,
        Prefix: `users/${req.user.userId}/`,
        MaxKeys: parseInt(maxKeys, 10),
        ContinuationToken: continuationToken || undefined,
    };

    try {
        const data = await s3Client.send(new ListObjectsV2Command(params));
        const files = data.Contents?.map(item => item.Key.replace(`users/${req.user.userId}/`, '')) || [];

        res.send({
            files,
            continuationToken: data.NextContinuationToken || null,
        });
    } catch (err) {
        next(err);
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.info(`Teralynk backend running on port ${PORT}`));

module.exports = app;
