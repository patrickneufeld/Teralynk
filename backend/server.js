require('dotenv').config(); // Load environment variables
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { setupNotificationWebSocket } = require('./api/notification');
const { authenticateToken } = require('./middleware/authMiddleware');
const fileUploadRoute = require('./api/files');
const workflowRouter = require('./api/workflow');
const webhooksRouter = require('./api/webhooks');
const searchRouter = require('./api/search');
const docsRouter = require('./api/docs');
const metricsRouter = require('./api/metrics');
const { blacklistToken } = require('./services/sessionService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' })); // Enable CORS
app.use(helmet()); // Add security headers
app.use(morgan('combined')); // Log HTTP requests
app.use(compression()); // Compress HTTP responses

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

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit file uploads to 5 requests per window
    message: 'Too many file upload requests. Please try again later.',
});

// Apply global rate limiter to all API routes
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'Healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

// API Routes
app.use('/api/files', authenticateToken, uploadLimiter, fileUploadRoute); // File Upload API
app.use('/api/workflows', authenticateToken, workflowRouter); // Workflow API
app.use('/api/webhooks', webhooksRouter); // Webhooks API
app.use('/api/search', authenticateToken, searchRouter); // Search API
app.use('/api/docs', docsRouter); // Documentation API
app.use('/api/metrics', authenticateToken, metricsRouter); // Metrics API

// Logout and token revocation
app.post('/api/logout', authenticateToken, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(400).json({ error: 'Token is required.' });
    }

    try {
        await blacklistToken(token);
        res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
        logger.error('Error revoking token:', error);
        res.status(500).json({ error: 'An error occurred while logging out.' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error.' });
});

// Handle 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Graceful shutdown on SIGINT and SIGTERM
const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('All connections closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Setup WebSocket for notifications
setupNotificationWebSocket(server);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`WebSocket notifications available at ws://localhost:${PORT}/ws/notifications`);
});

module.exports = app;
