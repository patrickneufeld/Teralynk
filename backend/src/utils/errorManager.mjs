// /backend/src/utils/errorManager.js

import winston from 'winston';
import axios from 'axios';

// -----------------------------
// Error Criticality Levels
// -----------------------------
export const ERROR_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// -----------------------------
// AppError Class
// -----------------------------
export class AppError extends Error {
  constructor(message, statusCode, context, level = ERROR_LEVELS.MEDIUM, metadata = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.context = context;
    this.level = level;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }
}

// -----------------------------
// Winston Logger Setup
// -----------------------------
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// -----------------------------
// Log Error Locally and Remotely
// -----------------------------
export const logError = async (error) => {
  const payload = {
    message: error.message,
    context: error.context,
    statusCode: error.statusCode,
    level: error.level,
    metadata: error.metadata,
    timestamp: error.timestamp || new Date().toISOString(),
  };

  logger.error(payload);

  if (process.env.ANALYTICS_API_URL) {
    try {
      await axios.post(process.env.ANALYTICS_API_URL, payload);
    } catch (err) {
      logger.warn('Failed to log error remotely', {
        message: err.message,
        endpoint: process.env.ANALYTICS_API_URL,
      });
    }
  }
};

// -----------------------------
// Global Error Handler
// -----------------------------
export const handleError = (error, req, res) => {
  const traceId = req.headers['x-request-id'] || 'no-trace-id';
  const isAppError = error instanceof AppError;

  logError({
    ...error,
    level: error.level || ERROR_LEVELS.CRITICAL,
    metadata: { ...error.metadata, traceId },
  });

  res.status(isAppError ? error.statusCode || 500 : 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    level: isAppError ? error.level : ERROR_LEVELS.CRITICAL,
    traceId,
    metadata: isAppError ? error.metadata : {},
  });
};

// -----------------------------
// Create AppError
// -----------------------------
export const createError = (message, statusCode, context, level = ERROR_LEVELS.MEDIUM, metadata = {}) => {
  return new AppError(message, statusCode, context, level, metadata);
};

// -----------------------------
// Exponential Backoff (with jitter)
// -----------------------------
export async function exponentialBackoff(fn, retries = 5, baseDelay = 200) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;

      const jitter = Math.random() * 100;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// -----------------------------
// Default Export (optional utility access)
// -----------------------------
export default {
  AppError,
  logError,
  handleError,
  createError,
  exponentialBackoff,
};
