// File Path: backend/collaboration/collaborationErrorHandler.js

/**
 * Centralized Error Handling Middleware for collaboration.
 * Handles any errors occurring within the collaboration routes.
 */
const collaborationErrorHandler = (err, req, res, next) => {
    console.error(`Error occurred in ${req.method} ${req.originalUrl}:`, err);

    // Create a standardized error response
    const errorResponse = {
        success: false,
        error: {
            message: err.message || 'An internal server error occurred.',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    };

    // Check for common error types
    if (err.message.includes('Invalid session data')) {
        res.status(400).json(errorResponse);
    } else if (err.message.includes('session not found')) {
        res.status(404).json(errorResponse);
    } else if (err.message.includes('An error occurred while processing the request')) {
        res.status(500).json(errorResponse);
    } else {
        res.status(500).json(errorResponse);
    }
};

module.exports = collaborationErrorHandler;
