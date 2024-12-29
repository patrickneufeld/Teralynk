const errorHandler = (err, req, res, next) => {
    // Determine HTTP status code
    const statusCode = err.status || 500;

    // Standardized response structure
    const errorResponse = {
        success: false,
        error: {
            message: statusCode === 500 ? 'An internal server error occurred.' : err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
    };

    // Log the error (include stack trace in development)
    if (statusCode === 500) {
        console.error('Critical Error:', err.stack || err.message);
    } else {
        console.warn('Application Error:', err.message);
    }

    // Respond with appropriate status and error details
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
