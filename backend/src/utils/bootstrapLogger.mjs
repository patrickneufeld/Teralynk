// ✅ FILE: /backend/src/utils/bootstrapLogger.mjs
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { logToDatabase } from './dbLogger.mjs';

// Resolve paths properly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.resolve(__dirname, '../../logs');

// Ensure log directory exists
try {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true, mode: 0o755 });
    }
} catch (err) {
    console.error('Failed to create logs directory:', err);
    process.exit(1);
}

const MAX_STACK_SIZE = 10;
const loggingStack = new Set();

// Safer JSON formatting
const safeStringify = (obj) => {
    try {
        return JSON.stringify(obj);
    } catch (err) {
        return JSON.stringify({ error: 'Failed to stringify object' });
    }
};

// Custom format with error handling
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    try {
        return safeStringify({
            timestamp,
            level: level.toUpperCase(),
            message: typeof message === 'string' ? message : safeStringify(message),
            ...meta,
        });
    } catch (error) {
        return safeStringify({
            timestamp,
            level: 'ERROR',
            message: 'Log formatting failed',
            error: error.message,
        });
    }
});

// Core logger instance
const coreLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
        customFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            handleExceptions: true
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error',
            handleExceptions: true,
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(LOG_DIR, 'combined.log'),
            handleExceptions: true,
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        })
    ],
    exitOnError: false
});

// Safe logging execution
const executeSafeLog = async (operation, logFunc) => {
    const logId = uuidv4();
    if (loggingStack.size >= MAX_STACK_SIZE) {
        console.warn(`[WARN] Logging stack overflow (${operation}). Skipped.`);
        return logId;
    }
    try {
        loggingStack.add(logId);
        await logFunc();
    } catch (err) {
        console.error(`[ERROR] Logging operation failed (${operation}):`, err);
    } finally {
        loggingStack.delete(logId);
    }
    return logId;
};

// Safe database logging
const logToDbSafely = async (collection, data) => {
    if (loggingStack.size >= MAX_STACK_SIZE) return;
    try {
        await logToDatabase(collection, data);
    } catch (err) {
        console.error(`[ERROR] Database logging failed for "${collection}":`, err);
    }
};

// Export logging functions
export const logError = async (message, error = null, meta = {}) => {
    const requestId = meta.requestId || uuidv4();
    return executeSafeLog('error', async () => {
        const errorData = {
            message,
            error: error?.message || String(error),
            stack: error?.stack,
            requestId,
            ...meta
        };
        
        coreLogger.error(message, errorData);
        await logToDbSafely('error_logs', errorData);
    });
};

export const logInfo = async (message, meta = {}) => {
    const requestId = meta.requestId || uuidv4();
    return executeSafeLog('info', async () => {
        const logData = { message, requestId, ...meta };
        coreLogger.info(message, logData);
        await logToDbSafely('backend_logs', {
            event_type: 'INFO',
            details: logData
        });
    });
};

export const logDebug = async (message, meta = {}) => {
    const requestId = meta.requestId || uuidv4();
    return executeSafeLog('debug', async () => {
        coreLogger.debug(message, { requestId, ...meta });
    });
};

export default {
    error: logError,
    info: logInfo,
    debug: logDebug,
    generateRequestId: uuidv4
};
