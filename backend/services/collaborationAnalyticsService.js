// File Path: backend/services/collaborationAnalyticsService.js

let analytics = {
    totalSessions: 0,
    totalEdits: 0,
    activeUsers: new Set(),
    sessionData: {},
};

/**
 * Records a new session being created.
 * Increments the total number of sessions.
 */
const recordNewSession = (sessionId) => {
    analytics.totalSessions += 1;
    analytics.sessionData[sessionId] = {
        edits: 0,
        users: new Set(),
    };
    console.log(`New session created: ${sessionId}. Total sessions: ${analytics.totalSessions}`);
};

/**
 * Records an edit in a collaboration session.
 * Increments the total number of edits for the session.
 * @param {string} sessionId - The ID of the session where the edit occurred.
 */
const recordEdit = (sessionId) => {
    if (!analytics.sessionData[sessionId]) {
        console.log(`Session ${sessionId} does not exist.`);
        return;
    }
    analytics.sessionData[sessionId].edits += 1;
    analytics.totalEdits += 1;
    console.log(`Edit recorded for session ${sessionId}. Total edits: ${analytics.totalEdits}`);
};

/**
 * Adds a user to the list of active users for a session.
 * @param {string} sessionId - The ID of the session the user is active in.
 * @param {string} userId - The ID of the user being added.
 */
const addActiveUser = (sessionId, userId) => {
    if (!analytics.sessionData[sessionId]) {
        console.log(`Session ${sessionId} does not exist.`);
        return;
    }
    analytics.sessionData[sessionId].users.add(userId);
    analytics.activeUsers.add(userId);
    console.log(`User ${userId} added to active users in session ${sessionId}. Total active users: ${analytics.activeUsers.size}`);
};

/**
 * Removes a user from the list of active users for a session.
 * @param {string} sessionId - The ID of the session the user is active in.
 * @param {string} userId - The ID of the user being removed.
 */
const removeActiveUser = (sessionId, userId) => {
    if (!analytics.sessionData[sessionId]) {
        console.log(`Session ${sessionId} does not exist.`);
        return;
    }
    analytics.sessionData[sessionId].users.delete(userId);
    analytics.activeUsers.delete(userId);
    console.log(`User ${userId} removed from active users in session ${sessionId}. Total active users: ${analytics.activeUsers.size}`);
};

/**
 * Retrieves the current analytics data.
 * @returns {object} - The current analytics data, including total sessions, total edits, and active users.
 */
const getAnalytics = () => {
    const analyticsSnapshot = {
        totalSessions: analytics.totalSessions,
        totalEdits: analytics.totalEdits,
        activeUsers: Array.from(analytics.activeUsers),
        sessionData: analytics.sessionData,
    };

    console.log(`Analytics snapshot:`, analyticsSnapshot);
    return analyticsSnapshot;
};

/**
 * Resets all analytics data.
 */
const resetAnalytics = () => {
    analytics = {
        totalSessions: 0,
        totalEdits: 0,
        activeUsers: new Set(),
        sessionData: {},
    };

    console.log('Analytics data reset.');
};

module.exports = {
    recordNewSession,
    recordEdit,
    addActiveUser,
    removeActiveUser,
    getAnalytics,
    resetAnalytics,
};
