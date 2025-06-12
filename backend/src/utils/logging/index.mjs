// backend/src/utils/logging/index.js

import winston from 'winston';
import { format } from 'winston';

// Custom format for better logging
const customFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.colorize(),
    format.printf(({ level, message, timestamp, ...meta }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta)}`;
        }
        return logMessage;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports: [
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: format.combine(
                format.timestamp(),
                format.json()
            )
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: format.combine(
                format.timestamp(),
                format.json()
            )
        })
    ]
});

// Export logging functions
export const logError = (message, meta = {}) => {
    logger.error(message, meta);
};

export const logWarn = (message, meta = {}) => {
    logger.warn(message, meta);
};

export const logInfo = (message, meta = {}) => {
    logger.info(message, meta);
};

export const logDebug = (message, meta = {}) => {
    logger.debug(message, meta);
};

// Create log directory if it doesn't exist
import fs from 'fs';
import path from 'path';

try {
    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }
} catch (error) {
    console.error('Failed to create logs directory:', error);
}

export default logger;
