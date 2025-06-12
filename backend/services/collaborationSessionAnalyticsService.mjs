// File Path: backend/services/collaborationSessionAnalyticsService.js

const sessionAnalytics = new Map();

/**
 * Initializes session analytics for a new session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const initializeSessionAnalytics = (sessionId) => {
    if (sessionAnalytics.has(sessionId)) {
        throw new Error(`Session analytics already initialized for session ${sessionId}`);
    }

    sessionAnalytics.set(sessionId, {
        totalUsers: 0,
        totalEdits: 0,
        totalMessages: 0,
        activeUsers: new Set(),
        edits: [],
        messages: [],
    });

    console.log(`Initialized analytics for session ${sessionId}`);
};

/**
 * Records a user joining a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user joining the session.
 */
const recordUserJoin = (sessionId, userId) => {
    const session = sessionAnalytics.get(sessionId);
    if (!session) {
        throw new Error(`Analytics not found for session ${sessionId}`);
    }

    session.totalUsers += 1;
    session.activeUsers.add(userId);

    console.log(`User ${userId} joined session ${sessionId}. Total users: ${session.totalUsers}`);
};

/**
 * Records a user editing a file in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user performing the edit.
 * @param {string} fileId - The ID of the file being edited.
 */
const recordUserEdit = (sessionId, userId, fileId) => {
    const session = sessionAnalytics.get(sessionId);
    if (!session) {
        throw new Error(`Analytics not found for session ${sessionId}`);
    }

    session.totalEdits += 1;
    session.edits.push({ userId, fileId, timestamp: new Date() });

    console.log(`User ${userId} edited file ${fileId} in session ${sessionId}. Total edits: ${session.totalEdits}`);
};

/**
 * Records a message sent by a user in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user sending the message.
 * @param {string} message - The content of the message.
 */
const recordUserMessage = (sessionId, userId, message) => {
    const session = sessionAnalytics.get(sessionId);
    if (!session) {
        throw new Error(`Analytics not found for session ${sessionId}`);
    }

    session.totalMessages += 1;
    session.messages.push({ userId, message, timestamp: new Date() });

    console.log(`User ${userId} sent a message in session ${sessionId}. Total messages: ${session.totalMessages}`);
};

/**
 * Retrieves analytics data for a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {object} - The analytics data for the session.
 */
const getSessionAnalytics = (sessionId) => {
    const session = sessionAnalytics.get(sessionId);
    if (!session) {
        throw new Error(`Analytics not found for session ${sessionId}`);
    }

    console.log(`Retrieved analytics for session ${sessionId}`);
    return session;
};

/**
 * Resets the analytics data for a session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const resetSessionAnalytics = (sessionId) => {
    if (!sessionAnalytics.has(sessionId)) {
        throw new Error(`Analytics not found for session ${sessionId}`);
    }

    sessionAnalytics.delete(sessionId);
    console.log(`Reset analytics for session ${sessionId}`);
};

module.exports = {
    initializeSessionAnalytics,
    recordUserJoin,
    recordUserEdit,
    recordUserMessage,
    getSessionAnalytics,
    resetSessionAnalytics,
};
