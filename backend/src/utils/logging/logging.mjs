// File: /backend/src/utils/logging/logging.js

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
  return `[${timestamp}] ${level.toUpperCase()}: ${formattedMessage}${stack ? `\n${stack}` : ''}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        logFormat
      )
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

// Export reusable log functions
export const logInfo = (msg) => logger.info(msg);
export const logError = (msg, err = null) => {
  if (err instanceof Error) {
    logger.error(msg, err);
  } else {
    logger.error(`${msg} ${err ? JSON.stringify(err) : ''}`);
  }
};
export const logDebug = (msg) => logger.debug(msg);
export const logWarn = (msg) => logger.warn(msg);
export default logger;
