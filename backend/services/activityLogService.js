// File: /backend/services/activityLogService.js

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const winston = require('winston');
require('winston-daily-rotate-file');

const LOG_DIRECTORY = process.env.LOG_DIRECTORY || path.join(__dirname, '../../logs');

// Ensure the log directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// **Configure Winston Logger with Daily Rotation**
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: `${LOG_DIRECTORY}/activity-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d', // Keep logs for 30 days
        }),
    ],
});

// **Record an activity log**
const recordActivity = async (userId, action, resource = null, details = {}) => {
    if (!userId || !action) {
        throw new Error('User ID and action are required for activity logging.');
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        userId,
        action,
        resource,
        details,
    };

    try {
        logger.info(logEntry);
        console.log(`Activity logged: ${action} by user ${userId}`);
    } catch (error) {
        console.error('Error logging activity:', error.message);
        throw new Error('An error occurred while logging activity.');
    }
};

// **Retrieve activity logs for a specific user**
const getUserActivityLogs = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve activity logs.');
    }

    try {
        const logFiles = fs
            .readdirSync(LOG_DIRECTORY)
            .filter((file) => file.startsWith(`activity-`) && file.endsWith('.log'));

        const userLogs = [];

        for (const file of logFiles) {
            const logFilePath = path.join(LOG_DIRECTORY, file);
            const logs = await promisify(fs.readFile)(logFilePath, 'utf8');
            logs
                .split('\n')
                .filter((log) => log.trim() !== '')
                .map((log) => JSON.parse(log))
                .filter((log) => log.userId === userId)
                .forEach((log) => userLogs.push(log));
        }

        return userLogs;
    } catch (error) {
        console.error('Error reading user activity logs:', error.message);
        throw new Error('An error occurred while retrieving activity logs.');
    }
};

// **Retrieve system-wide activity logs (admin only)**
const getSystemActivityLogs = async (adminId) => {
    if (!adminId) {
        throw new Error('Admin ID is required to retrieve system activity logs.');
    }

    try {
        const logFiles = fs
            .readdirSync(LOG_DIRECTORY)
            .filter((file) => file.endsWith('.log'));

        const allLogs = [];

        for (const file of logFiles) {
            const logFilePath = path.join(LOG_DIRECTORY, file);
            const logs = await promisify(fs.readFile)(logFilePath, 'utf8');
            logs
                .split('\n')
                .filter((log) => log.trim() !== '')
                .forEach((log) => allLogs.push(JSON.parse(log)));
        }

        return allLogs;
    } catch (error) {
        console.error('Error retrieving system-wide logs:', error.message);
        throw new Error('An error occurred while retrieving system-wide logs.');
    }
};

// **Export activity logs to CSV**
const exportLogsToCSV = (logs) => {
    const csvHeaders = ['timestamp', 'userId', 'action', 'resource', 'details'];
    const csvData = logs.map((log) =>
        csvHeaders.map((header) => (log[header] !== undefined ? log[header] : '')).join(',')
    );
    csvData.unshift(csvHeaders.join(','));
    return csvData.join('\n');
};

module.exports = {
    recordActivity,
    getUserActivityLogs,
    getSystemActivityLogs,
    exportLogsToCSV,
};
