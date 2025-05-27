// File Path: backend/middleware/errorHandler.js

/**
 * Global error handler middleware for standardized JSON errors and logging.
 */
export const errorHandler = (err, req, res, next) => {
    const errorType = err.name || "UnknownError";
    const statusCode = err.status || 500;
  
    const errorResponse = {
      success: false,
      error: {
        type: errorType,
        message: statusCode === 500 ? "An internal server error occurred." : err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
    };
  
    const logDetails = {
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    };
  
    if (statusCode === 500) {
      console.error("❌ Critical Error:", logDetails);
    } else {
      console.warn("⚠️ Application Error:", logDetails);
    }
  
    // Optional monitoring integration:
    // if (statusCode === 500) sendToMonitoringService(logDetails);
  
    res.status(statusCode).json(errorResponse);
  };
  