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

// Initialize Express app
const app = express();

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.BUCKET_NAME || 'teralynk-storage';

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

// File upload route with user ID verification
app.post('/api/files/upload', authenticate, (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            logger.error('Error parsing form:', err);
            return res.status(400).send('Error parsing form.');
        }

        const { userId } = req.user; // Get user ID from token
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
            .catch(err => {
                logger.error('Error uploading file:', err);
                res.status(500).send('Error uploading file.');
            });
    });
});

// Generate signed URL for downloading files
app.post('/api/files/generate-link', authenticate, async (req, res) => {
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
        logger.error('Error generating signed URL:', err);
        res.status(500).send('Error generating signed URL.');
    }
});

// Paginated file listing
app.get('/api/files/list', authenticate, async (req, res) => {
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
        logger.error('Error listing files:', err);
        res.status(500).send('Error listing files.');
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.info(`Teralynk backend running on port ${PORT}`));

module.exports = app;
