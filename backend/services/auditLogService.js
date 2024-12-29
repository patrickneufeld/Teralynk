// File: /backend/services/auditLogService.js

const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

// **Customizable log path via environment variable**
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || path.join(__dirname, '../../logs/audit.log');

// **Ensure the log directory exists**
const ensureDirectoryExists = async (dirPath) => {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory: ${dirPath}`, error);
    }
};
ensureDirectoryExists(path.dirname(AUDIT_LOG_PATH));

// **Configure Winston logger with daily rotation**
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: `${AUDIT_LOG_PATH}-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d', // Retain logs for 30 days
        }),
    ],
});

// **Log an action**
const logAction = async (userId, action, details = {}) => {
    if (!userId || !action) {
        throw new Error('User ID and action are required for audit logging.');
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        details,
    };

    try {
        logger.info(logEntry);
        console.log(`Audit log recorded: ${action} by ${userId}`);
    } catch (error) {
        console.error('Error writing to audit log:', error.message);
        throw new Error('An error occurred while logging an action.');
    }

    return logEntry;
};

// **Retrieve audit logs with optional filtering**
const getLogs = async (filters = {}) => {
    try {
        const files = await fs.readdir(path.dirname(AUDIT_LOG_PATH));
        const logFiles = files.filter(file => file.includes('audit') && file.endsWith('.log'));
        
        const allLogs = [];
        for (const file of logFiles) {
            const logFilePath = path.join(path.dirname(AUDIT_LOG_PATH), file);
            const fileContent = await fs.readFile(logFilePath, 'utf8');

            const logs = fileContent
                .split('\n')
                .filter(log => log.trim())
                .map(log => JSON.parse(log));

            allLogs.push(...logs);
        }

        const filteredLogs = allLogs.filter(log => {
            return Object.keys(filters).every(key => log[key] === filters[key]);
        });

        await logAction('admin', 'viewed_logs', { filters });

        return filteredLogs;
    } catch (error) {
        console.error('Error retrieving audit logs:', error.message);
        throw new Error('An error occurred while retrieving audit logs.');
    }
};

// **Export logs to CSV**
const exportLogsToCSV = (logs) => {
    const headers = ['timestamp', 'userId', 'action', 'details'];
    const csvData = logs.map(log =>
        headers.map(header => JSON.stringify(log[header] || '')).join(',')
    );
    csvData.unshift(headers.join(','));
    return csvData.join('\n');
};

// **Clear all audit logs (for testing or maintenance)**
const clearLogs = async () => {
    try {
        const files = await fs.readdir(path.dirname(AUDIT_LOG_PATH));
        const logFiles = files.filter(file => file.includes('audit') && file.endsWith('.log'));

        for (const file of logFiles) {
            const logFilePath = path.join(path.dirname(AUDIT_LOG_PATH), file);
            await fs.unlink(logFilePath);
        }

        console.log('Audit logs cleared successfully.');
        return { message: 'Audit logs cleared successfully.' };
    } catch (error) {
        console.error('Error clearing audit log:', error.message);
        throw new Error('Failed to clear audit log.');
    }
};

module.exports = {
    logAction,
    getLogs,
    exportLogsToCSV,
    clearLogs,
};
