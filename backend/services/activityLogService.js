// File: /Users/patrick/Projects/Teralynk/backend/services/activityLogService.js

const fs = require('fs');
const path = require('path');

// Directory for storing activity logs (update as needed)
const LOG_DIRECTORY = path.join(__dirname, '../../logs');

// Ensure the log directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// Record an activity log
const recordActivity = async (userId, action, resource = null, details = {}) => {
    if (!userId || !action) {
        throw new Error('User ID and action are required for activity logging.');
    }

    const logEntry = {
        timestamp: new Date(),
        userId,
        action,
        resource,
        details,
    };

    const logFilePath = path.join(LOG_DIRECTORY, `${userId}_activity.log`);

    try {
        fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
        console.log(`Activity logged: ${action} by user ${userId}`);
    } catch (error) {
        console.error('Error writing to activity log:', error);
        throw new Error('An error occurred while logging activity.');
    }
};

// Retrieve activity logs for a user
const getUserActivityLogs = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to retrieve activity logs.');
    }

    const logFilePath = path.join(LOG_DIRECTORY, `${userId}_activity.log`);

    if (!fs.existsSync(logFilePath)) {
        throw new Error('No activity logs found for this user.');
    }

    try {
        const logs = fs.readFileSync(logFilePath, 'utf8');
        return logs
            .split('\n')
            .filter((log) => log.trim() !== '')
            .map((log) => JSON.parse(log));
    } catch (error) {
        console.error('Error reading activity logs:', error);
        throw new Error('An error occurred while retrieving activity logs.');
    }
};

// Retrieve system-wide activity logs (admin only)
const getSystemActivityLogs = async (adminId) => {
    if (!adminId) {
        throw new Error('Admin ID is required to retrieve system activity logs.');
    }

    const allLogs = [];

    try {
        const logFiles = fs.readdirSync(LOG_DIRECTORY).filter((file) =>
            file.endsWith('_activity.log')
        );

        logFiles.forEach((file) => {
            const logFilePath = path.join(LOG_DIRECTORY, file);
            const logs = fs.readFileSync(logFilePath, 'utf8');
            logs
                .split('\n')
                .filter((log) => log.trim() !== '')
                .forEach((log) => allLogs.push(JSON.parse(log)));
        });

        return allLogs;
    } catch (error) {
        console.error('Error retrieving system-wide logs:', error);
        throw new Error('An error occurred while retrieving system-wide logs.');
    }
};

module.exports = {
    recordActivity,
    getUserActivityLogs,
    getSystemActivityLogs,
};
