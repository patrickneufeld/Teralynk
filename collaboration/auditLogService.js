// File Path: backend/collaboration/auditLogService.js

const auditLogs = []; // Temporary in-memory store (replace with a database for production)

/**
 * Records an audit log entry.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} action - The action performed (e.g., "edit", "addParticipant").
 * @param {object} details - Additional details about the action.
 * @param {string} userId - The ID of the user who performed the action.
 */
const logAuditEntry = (sessionId, action, details, userId) => {
    if (!sessionId || !action || !userId) {
        throw new Error('Session ID, action, and user ID are required to log an audit entry.');
    }

    const timestamp = new Date();
    const logEntry = {
        sessionId,
        action,
        details,
        userId,
        timestamp,
    };

    auditLogs.push(logEntry);
    console.log(`Audit log recorded:`, logEntry);
};

/**
 * Retrieves audit logs for a specific session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {Array<object>} - A list of audit log entries.
 */
const getAuditLogsBySession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to retrieve audit logs.');
    }

    const sessionLogs = auditLogs.filter((log) => log.sessionId === sessionId);
    console.log(`Retrieved ${sessionLogs.length} audit logs for session ${sessionId}.`);
    return sessionLogs;
};

/**
 * Retrieves all audit logs.
 * @returns {Array<object>} - A list of all audit log entries.
 */
const getAllAuditLogs = () => {
    console.log(`Retrieved ${auditLogs.length} total audit logs.`);
    return auditLogs;
};

/**
 * Clears audit logs for a specific session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const clearAuditLogsBySession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to clear audit logs.');
    }

    const originalCount = auditLogs.length;
    auditLogs = auditLogs.filter((log) => log.sessionId !== sessionId);
    const removedCount = originalCount - auditLogs.length;

    console.log(`Cleared ${removedCount} audit logs for session ${sessionId}.`);
};

/**
 * Clears all audit logs.
 */
const clearAllAuditLogs = () => {
    const count = auditLogs.length;
    auditLogs.length = 0; // Clear the array
    console.log(`Cleared all ${count} audit logs.`);
};

module.exports = {
    logAuditEntry,
    getAuditLogsBySession,
    getAllAuditLogs,
    clearAuditLogsBySession,
    clearAllAuditLogs,
};
