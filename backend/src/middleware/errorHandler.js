// File Path: backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Categorize error types for better handling
    const errorType = err.name || 'UnknownError';
    const statusCode = err.status || 500;

    // Standardized response structure
    const errorResponse = {
        success: false,
        error: {
            type: errorType,
            message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    };

    // Enhanced logging with context
    const logDetails = {
        method: req.method,
        url: req.originalUrl,
        status: statusCode,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    if (statusCode === 500) {
        console.error('Critical Error:', logDetails);
    } else {
        console.warn('Application Error:', logDetails);
    }

    // Optional: Send critical error alerts to a monitoring service
    if (statusCode === 500) {
        // Example: sendToMonitoringService(logDetails);
    }

    // Respond with appropriate status and error details
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
