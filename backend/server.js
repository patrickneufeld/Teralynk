const express = require('express');
const http = require('http');
const { setupNotificationWebSocket } = require('./api/notification');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');
const { body, validationResult } = require('express-validator'); // For validation
const { blacklistToken } = require('./services/sessionService');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware setup
app.use(express.json()); // For JSON payloads
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));

// Logger setup with winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console(),
    ],
});

// Rate-limiting middleware for critical API routes (e.g., login, file uploads)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each user to 5 uploads per window
    message: 'Too many file upload requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit login attempts to 10 requests per window
    message: 'Too many login attempts, please try again later.',
});

// Middleware for authentication (using session validation)
const authenticateMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header
    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    try {
        await authenticate(token); // Validate session and check if token is revoked
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        logger.error('Invalid or blacklisted token:', err);
        return res.status(401).send('Unauthorized: Invalid or revoked token');
    }
};

// File upload route with user ID verification and file validation
const fileUploadRoute = require('./api/files'); // Assuming your file upload logic is in the "files" route
app.use('/api/files', authenticateMiddleware, uploadLimiter, [
    body('file').custom((value, { req }) => {
        const file = req.files && req.files.file;
        if (!file) {
            throw new Error('No file provided.');
        }
        if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
            throw new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.');
        }
        if (file.size > 50 * 1024 * 1024) { // 50 MB limit
            throw new Error('File is too large. Max size is 50MB.');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
], fileUploadRoute); // Protect file upload routes with authentication, rate-limiting, and validation

// Create HTTP server
const server = http.createServer(app);

// Integrate WebSocket for real-time notifications
setupNotificationWebSocket(server);

// Route for logging out and revoking the token (blacklist)
app.post('/api/logout', authenticateMiddleware, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header
    if (!token) {
        return res.status(400).send('No token provided');
    }

    try {
        // Blacklist the token to revoke it
        await blacklistToken(token);
        res.send('Logged out successfully');
    } catch (err) {
        logger.error('Error logging out:', err);
        res.status(500).send('Error logging out');
    }
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).send({ error: 'Something went wrong!' });
});

// Graceful shutdown on SIGINT (Ctrl+C) and SIGTERM (e.g., from Kubernetes/Docker)
const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Closed all connections.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server is listening at ws://localhost:${PORT}/ws/notifications`);
});

module.exports = app;
