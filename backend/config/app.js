// File Path: backend/config/app.js

const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');
const fs = require('fs');
const formidable = require('formidable');
const winston = require('winston');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // MongoDB connection

// Load environment variables
dotenv.config();

// Validate critical environment variables
['AWS_REGION', 'BUCKET_NAME', 'JWT_SECRET', 'PORT', 'DB_CONNECTION_STRING'].forEach((key) => {
    if (!process.env[key]) {
        console.error(`❌ Environment variable ${key} is not set.`);
        process.exit(1); // Exit if critical variables are missing
    }
});

// Initialize Express app
const app = express();

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.BUCKET_NAME;

// MongoDB connection setup
mongoose.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err);
        process.exit(1); // Exit if DB connection fails
    });

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
        res.status(401).send('Unauthorized: Invalid token');
    }
};

// File upload route
app.post('/api/files/upload', authenticate, (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            logger.error('Form parsing error:', err);
            return res.status(400).send('Error parsing the file upload form.');
        }

        const { userId } = req.user;
        const file = files.file;

        if (!file) {
            return res.status(400).send('No file provided.');
        }

        // Optional: Validate file MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).send('Invalid file type. Allowed: JPEG, PNG, PDF.');
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: `users/${userId}/${file.originalFilename}`,
            Body: fs.createReadStream(file.filepath),
            ContentType: file.mimetype,
        };

        s3Client.send(new PutObjectCommand(params))
            .then(() => res.send({ message: 'File uploaded successfully' }))
            .catch((error) => {
                logger.error('File upload error:', error);
                next(error);
            });
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
    } catch (error) {
        logger.error('Error generating signed URL:', error);
        next(error);
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
    } catch (error) {
        logger.error('Error listing files:', error);
        next(error);
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.info(`Teralynk backend running on port ${PORT}`));

module.exports = app;
