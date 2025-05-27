// File Path: backend/services/collaborationAuditService.js

const fs = require('fs');
const path = require('path');

const auditLogFilePath = path.join(__dirname, '../../logs/collaborationAudit.log');

/**
 * Logs an action performed during a collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} action - The action performed (e.g., "added participant", "edited file").
 * @param {string} details - Additional details about the action.
 */
const logAction = (sessionId, userId, action, details) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} | Session: ${sessionId} | User: ${userId} | Action: ${action} | Details: ${details}\n`;

    fs.appendFile(auditLogFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error logging collaboration action:', err);
        } else {
            console.log('Collaboration action logged successfully.');
        }
    });
};

/**
 * Retrieves the most recent collaboration audit logs.
 * @param {number} limit - The number of logs to retrieve.
 * @returns {Promise<string>} - A promise that resolves to the most recent audit logs.
 */
const getRecentAuditLogs = (limit = 10) => {
    return new Promise((resolve, reject) => {
        fs.readFile(auditLogFilePath, 'utf8', (err, data) => {
            if (err) {
                reject('Error reading collaboration audit logs.');
            }

            const logs = data.split('\n').filter(Boolean);
            const recentLogs = logs.slice(-limit);
            resolve(recentLogs.join('\n'));
        });
    });
};

/**
 * Clears the collaboration audit logs.
 */
const clearAuditLogs = () => {
    fs.truncate(auditLogFilePath, 0, (err) => {
        if (err) {
            console.error('Error clearing collaboration audit logs:', err);
        } else {
            console.log('Collaboration audit logs cleared.');
        }
    });
};

module.exports = {
    logAction,
    getRecentAuditLogs,
    clearAuditLogs,
};
