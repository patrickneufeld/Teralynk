// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { setupNotificationWebSocket } = require('./api/notification');
const { authenticateUser } = require('./middleware/authMiddleware');
const fileUploadRoute = require('./api/files');
const workflowRouter = require('./api/workflow');
const webhooksRouter = require('./api/webhooks');
const searchRouter = require('./api/search');
const docsRouter = require('./api/docs');
const metricsRouter = require('./api/metrics');
const authRoutes = require('./routes/authRoutes'); // Auth Routes
const contactRoutes = require('./routes/contactRoutes'); // Contact Routes
const dashboardRoutes = require('./routes/dashboardRoutes'); // Dashboard Routes
const settingsRoutes = require('./routes/settingsRoutes'); // Settings Routes
const { blacklistToken } = require('./services/sessionService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(helmet());
app.use(morgan('combined'));
app.use(compression());

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
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP, please try again later.',
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: 'Too many file upload requests. Please try again later.',
});

// Apply rate limiter
app.use('/api', apiLimiter);

// Root Route
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Teralynk API!',
        availableRoutes: {
            health: '/health',
            auth: '/api/auth',
            contact: '/api/contact',
            dashboard: '/api/user',
            settings: '/api/settings',
        },
    });
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'Healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

// API Routes
try {
    app.use('/api/files', authenticateUser, uploadLimiter, fileUploadRoute);
    app.use('/api/workflows', authenticateUser, workflowRouter);
    app.use('/api/webhooks', webhooksRouter);
    app.use('/api/search', authenticateUser, searchRouter);
    app.use('/api/docs', docsRouter);
    app.use('/api/metrics', authenticateUser, metricsRouter);

    // Authentication Routes
    app.use('/api/auth', authRoutes);

    // Contact Form Route
    app.use('/api/contact', contactRoutes);

    // Dashboard Routes
    app.use('/api/user', authenticateUser, dashboardRoutes);

    // Settings Routes
    app.use('/api/settings', authenticateUser, settingsRoutes);
} catch (error) {
    logger.error('Error initializing routes:', error);
    process.exit(1); // Exit process if routes fail to load
}

// Serve React Frontend (Optional)
if (process.env.SERVE_FRONTEND === 'true') {
    app.use(express.static(path.join(__dirname, 'frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
    });
}

// Logout and token revocation
app.post('/api/logout', authenticateUser, async (req, res) => {
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
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`WebSocket notifications available at ws://localhost:${PORT}/ws/notifications`);
});

module.exports = app;
