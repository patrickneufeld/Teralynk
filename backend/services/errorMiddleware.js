// File: /backend/middleware/errorMiddleware.js

// **Global error handler middleware**
const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.status || 500; // Default to 500 if status code is not provided
    const errorResponse = {
        error: err.message || 'Something went wrong!',
        status: statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Show stack trace only in development
    };

    console.error('Error Middleware:', {
        message: err.message,
        stack: err.stack,
        status: statusCode,
    });

    res.status(statusCode).json(errorResponse);
};

module.exports = errorMiddleware;
