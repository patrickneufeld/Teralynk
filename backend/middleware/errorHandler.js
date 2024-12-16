const errorHandler = (err, req, res, next) => {
    console.error('Error:', err); // Log error details for debugging
    
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({ 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'production' ? null : err.stack 
    });
};

module.exports = errorHandler;
