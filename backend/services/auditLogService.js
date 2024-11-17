// File: /backend/services/auditLogService.js

const fs = require('fs');
const path = require('path');

// Audit log file path (replace with database in production)
const AUDIT_LOG_FILE = path.join(__dirname, '../../logs/audit.log');

// Log an action
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

    // Write the log entry to a file
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
        fs.appendFileSync(AUDIT_LOG_FILE, logLine, { encoding: 'utf8' });
        console.log(`Audit log recorded: ${action} by ${userId}`);
    } catch (error) {
        console.error('Error writing to audit log:', error);
    }

    return logEntry;
};

// Retrieve audit logs with optional filtering
const getLogs = async (filters = {}) => {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
        return [];
    }

    const logData = fs.readFileSync(AUDIT_LOG_FILE, { encoding: 'utf8' });
    const logs = logData.split('\n').filter((line) => line.trim()).map(JSON.parse);

    // Apply filters
    return logs.filter((log) => {
        return Object.keys(filters).every((key) => {
            if (filters[key] instanceof Date) {
                return new Date(log[key]) >= new Date(filters[key]);
            }
            return log[key] === filters[key];
        });
    });
};

// Clear all audit logs (for testing or maintenance)
const clearLogs = async () => {
    try {
        fs.writeFileSync(AUDIT_LOG_FILE, '', { encoding: 'utf8' });
        console.log('Audit log cleared.');
        return { message: 'Audit log cleared successfully.' };
    } catch (error) {
        console.error('Error clearing audit log:', error);
        throw new Error('Failed to clear audit log.');
    }
};

module.exports = {
    logAction,
    getLogs,
    clearLogs,
};
