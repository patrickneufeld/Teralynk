// File Path: backend/collaboration/metricsService.js

const logger = require('../config/logger'); // Centralized logger

let metrics = {
    totalSessions: 0,
    totalEdits: 0,
    activeUsers: new Set(),
    sessionDurations: {}, // Tracks duration of each session by sessionId
    peakActiveUsers: 0, // Tracks the highest number of concurrent active users
};

/**
 * Records the creation of a new collaboration session.
 * @param {string} sessionId - The ID of the new session.
 */
const recordNewSession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to record a new session.');
    }

    metrics.totalSessions += 1;
    metrics.sessionDurations[sessionId] = { start: Date.now(), end: null };

    logger.info(`New session recorded. Total sessions: ${metrics.totalSessions}`);
};

/**
 * Records the end of a collaboration session.
 * @param {string} sessionId - The ID of the session to end.
 */
const endSession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to end a session.');
    }

    if (!metrics.sessionDurations[sessionId]) {
        throw new Error(`Session ${sessionId} not found.`);
    }

    metrics.sessionDurations[sessionId].end = Date.now();
    logger.info(`Session ${sessionId} ended. Duration recorded.`);
};

/**
 * Records an edit action during a collaboration session.
 * @param {string} userId - The ID of the user making the edit.
 */
const recordEdit = (userId) => {
    if (!userId) {
        throw new Error('User ID is required to record an edit.');
    }

    metrics.totalEdits += 1;

    logger.info(`Edit recorded by user ${userId}. Total edits: ${metrics.totalEdits}`);
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
    metrics.peakActiveUsers = Math.max(metrics.peakActiveUsers, metrics.activeUsers.size);

    logger.info(
        `User ${userId} added to active users. Total active users: ${metrics.activeUsers.size}`
    );
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

    logger.info(
        `User ${userId} removed from active users. Total active users: ${metrics.activeUsers.size}`
    );
};

/**
 * Retrieves current metrics data.
 * @returns {object} - An object containing total sessions, total edits, active users, and peak users.
 */
const getMetrics = () => {
    const metricsSnapshot = {
        totalSessions: metrics.totalSessions,
        totalEdits: metrics.totalEdits,
        activeUsers: Array.from(metrics.activeUsers),
        peakActiveUsers: metrics.peakActiveUsers,
        sessionDurations: metrics.sessionDurations,
    };

    logger.info(`Metrics snapshot:`, metricsSnapshot);
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
        sessionDurations: {},
        peakActiveUsers: 0,
    };

    logger.warn('Metrics have been reset to their initial state.');
};

/**
 * Calculates the duration of a specific session.
 * @param {string} sessionId - The ID of the session to calculate duration for.
 * @returns {number} - The duration of the session in milliseconds.
 */
const getSessionDuration = (sessionId) => {
    const session = metrics.sessionDurations[sessionId];
    if (!session) {
        throw new Error(`Session ${sessionId} not found.`);
    }

    if (!session.end) {
        throw new Error(`Session ${sessionId} is still active.`);
    }

    return session.end - session.start;
};

module.exports = {
    recordNewSession,
    endSession,
    recordEdit,
    addUserToActiveUsers,
    removeUserFromActiveUsers,
    getMetrics,
    resetMetrics,
    getSessionDuration,
};
