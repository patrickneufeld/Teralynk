// File: /backend/src/routes/appRoutes.mjs

import express from 'express';
import crypto from 'crypto';
import { logInfo, logError, logWarn } from '../utils/logging/index.mjs';
import { AUTH_STATUS } from '../constants/auth.mjs';

// Route Modules
import fileRoutes from './fileRoutes.mjs';
import aiRoutes from './aiRoutes.mjs';
import authRoutes from './authRoutes.mjs';

// Middleware
import { requireAuth } from '../middleware/authMiddleware.mjs';
import { rateLimitMiddleware } from '../middleware/rateLimiter.mjs';
import {
    validateAuthRequest,
    validateFileMetadata,
    validatePaginationRequest,
    validateResourceId,
    validateRegistrationRequest,
    validatePasswordResetRequest,
    validatePasswordUpdateRequest,
} from '../middleware/validationMiddleware.mjs';
import { errorHandler } from '../middleware/errorHandler.mjs';

const router = express.Router();

// API Status Monitoring
let apiStatus = {
    status: 'healthy',
    lastCheck: Date.now(),
    errors: []
};

// Health Check Route with Enhanced Monitoring
router.get('/health', (req, res) => {
    const currentStatus = {
        status: apiStatus.status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            auth: authRoutes.isHealthy ?? true,
            files: fileRoutes.isHealthy ?? true,
            ai: aiRoutes.isHealthy ?? true
        }
    };

    const statusCode = apiStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(currentStatus);
});

// API Version and Documentation Route
router.get('/', (req, res) => {
    res.json({
        name: 'Teralynk API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'operational',
        documentation: '/api/docs',
        timestamp: new Date().toISOString()
    });
});

// Route Registration with Error Handling
const registerRoutes = (path, authMiddleware, routeHandler) => {
    try {
        if (authMiddleware) {
            router.use(path, authMiddleware, routeHandler);
        } else {
            router.use(path, routeHandler);
        }
        logInfo(`Route registered successfully: ${path}`);
    } catch (error) {
        logError(`Failed to register route: ${path}`, { error: error.message });
        apiStatus.errors.push({
            route: path,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Global Middleware
router.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    req.startTime = Date.now();
    
    logInfo('Incoming request', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip
    });

    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logInfo('Request completed', {
            requestId: req.requestId,
            duration,
            status: res.statusCode
        });
    });

    next();
});

// Rate Limiting
router.use(rateLimitMiddleware);

// Route Registration
registerRoutes('/api/auth', null, authRoutes);
registerRoutes('/api/files', requireAuth, fileRoutes);
registerRoutes('/api/ai', requireAuth, aiRoutes);

// API Documentation Route
router.get('/api/docs', (req, res) => {
    res.json({
        version: '1.0.0',
        endpoints: {
            auth: {
                base: '/api/auth',
                routes: [
                    { path: '/login', method: 'POST' },
                    { path: '/register', method: 'POST' },
                    { path: '/validate', method: 'GET' },
                ]
            },
            files: {
                base: '/api/files',
                routes: [
                    { path: '/upload', method: 'POST' },
                    { path: '/download/:id', method: 'GET' },
                ]
            },
            ai: {
                base: '/api/ai',
                routes: [
                    { path: '/analyze', method: 'POST' },
                    { path: '/train', method: 'POST' },
                ]
            }
        }
    });
});

// Enhanced 404 Handler
router.use('*', (req, res) => {
    logWarn('Route not found', {
        method: req.method,
        path: req.path,
        ip: req.ip
    });

    res.status(404).json({
        status: 'error',
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested resource was not found',
        suggestion: 'Check the API documentation at /api/docs'
    });
});

// Enhanced Error Handler
router.use((err, req, res, next) => {
    logError('Unhandled error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        requestId: req.requestId
    });

    res.status(err.status || 500).json({
        status: 'error',
        code: err.code || 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
});

// Periodic Health Check
setInterval(() => {
    apiStatus = {
        status: apiStatus.errors.length === 0 ? 'healthy' : 'degraded',
        lastCheck: Date.now(),
        errors: apiStatus.errors.slice(-10)
    };
}, 30000);

export default router;
