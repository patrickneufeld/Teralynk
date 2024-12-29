// File: /backend/services/loggingService.js

const winston = require('winston');
require('winston-daily-rotate-file'); // For log rotation

const dotenv = require('dotenv');
dotenv.config();

// **Log directory and configurations**
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// **Ensure the log directory exists**
const fs = require('fs');
const path = require('path');

if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// **Configure Winston Logger**
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json() // Logs in JSON format for better log parsing
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIRECTORY, 'combined.log'),
        }),
        new winston.transports.DailyRotateFile({
            filename: `${LOG_DIRECTORY}/app-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d', // Retain logs for 30 days
        }),
    ],
});

// **Log informational messages**
const logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

// **Log warnings**
const logWarning = (message, meta = {}) => {
    logger.warn(message, meta);
};

// **Log errors**
const logError = (message, meta = {}) => {
    logger.error(message, meta);
};

// **Log debug messages**
const logDebug = (message, meta = {}) => {
    if (LOG_LEVEL === 'debug') {
        logger.debug(message, meta);
    }
};

// **Log activity for specific actions**
const logAction = (userId, action, details
    = {}) => {
        const logEntry = {
            userId,
            action,
            details,
            timestamp: new Date().toISOString(),
        };
        logger.info(`Action logged: ${action}`, logEntry);
    };
    
    // Export the logging functions
    module.exports = {
        logInfo,
        logWarning,
        logError,
        logDebug,
        logAction,
    };
    