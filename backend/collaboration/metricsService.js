// File Path: backend/collaboration/metricsService.js

let metrics = {
    totalSessions: 0,
    totalEdits: 0,
    activeUsers: new Set(),
};

/**
 * Records the creation of a new collaboration session.
 */
const recordNewSession = () => {
    metrics.totalSessions += 1;
    console.log(`New session recorded. Total sessions: ${metrics.totalSessions}`);
};

/**
 * Records an edit action during a collaboration session.
 */
const recordEdit = () => {
    metrics.totalEdits += 1;
    console.log(`Edit recorded. Total edits: ${metrics.totalEdits}`);
};

/**
 * Adds a user to the set of active users.
 * @param {string} userId - The ID of the user to add.
 */
const addUserToActiveUsers = (userId) => {
    if (!userId) {
        throw new Error('User ID is required to add to active users.');
    }

    metrics.activeUsers.add(userId);
    console.log(`User ${userId} added to active users. Total active users: ${metrics.activeUsers.size}`);
};

/**
 * Removes a user from the set of active users.
 * @param {string} userId - The ID of the user to remove.
 */
const removeUserFromActiveUsers = (userId) => {
    if (!userId) {
        throw new Error('User ID is required to remove from active users.');
    }

    metrics.activeUsers.delete(userId);
    console.log(`User ${userId} removed from active users. Total active users: ${metrics.activeUsers.size}`);
};

/**
 * Retrieves current metrics data.
 * @returns {object} - An object containing total sessions, total edits, and a list of active users.
 */
const getMetrics = () => {
    const metricsSnapshot = {
        totalSessions: metrics.totalSessions,
        totalEdits: metrics.totalEdits,
        activeUsers: Array.from(metrics.activeUsers),
    };

    console.log(`Metrics snapshot:`, metricsSnapshot);
    return metricsSnapshot;
};

/**
 * Resets all metrics to their initial state.
 */
const resetMetrics = () => {
    metrics = {
        totalSessions: 0,
        totalEdits: 0,
        activeUsers: new Set(),
    };

    console.log('Metrics have been reset.');
};

module.exports = {
    recordNewSession,
    recordEdit,
    addUserToActiveUsers,
    removeUserFromActiveUsers,
    getMetrics,
    resetMetrics,
};
