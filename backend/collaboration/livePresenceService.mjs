// File Path: backend/collaboration/livePresenceService.js

const presenceMap = new Map();
const logger = require('../config/logger'); // Centralized logger for auditing

/**
 * Updates or adds a user's presence in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user.
 * @param {object} cursorPosition - The user's cursor position (e.g., { x: 100, y: 200 }).
 */
const updateUserPresence = (sessionId, userId, cursorPosition) => {
    if (!sessionId || !userId || !cursorPosition) {
        throw new Error('Session ID, User ID, and cursor position are required.');
    }

    if (!presenceMap.has(sessionId)) {
        presenceMap.set(sessionId, new Map());
    }

    const sessionPresence = presenceMap.get(sessionId);
    sessionPresence.set(userId, { cursorPosition, timestamp: new Date() });

    logger.info(`Updated presence for user ${userId} in session ${sessionId}.`, {
        sessionId,
        userId,
        cursorPosition,
    });
};

/**
 * Retrieves the presence data for all users in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {object} - An object containing user presence data.
 */
const getUserPresence = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required.');
    }

    const sessionPresence = presenceMap.get(sessionId) || new Map();
    const presenceData = {};

    for (const [userId, data] of sessionPresence.entries()) {
        presenceData[userId] = data;
    }

    logger.info(`Retrieved presence for session ${sessionId}.`, { sessionId, presenceData });
    return presenceData;
};

/**
 * Removes a user's presence from a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user to remove.
 */
const removeUserPresence = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required.');
    }

    const sessionPresence = presenceMap.get(sessionId);

    if (sessionPresence) {
        sessionPresence.delete(userId);
        logger.info(`Removed presence for user ${userId} from session ${sessionId}.`, {
            sessionId,
            userId,
        });

        if (sessionPresence.size === 0) {
            presenceMap.delete(sessionId); // Clean up session if no users remain
            logger.info(`Session ${sessionId} removed from presence map.`);
        }
    }
};

/**
 * Removes all presence data for a session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const removeSessionPresence = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required.');
    }

    if (presenceMap.has(sessionId)) {
        presenceMap.delete(sessionId);
        logger.info(`All presence data removed for session ${sessionId}.`);
    }
};

/**
 * Retrieves the current number of active sessions being tracked.
 * @returns {number} - Count of active sessions.
 */
const getActiveSessionCount = () => {
    const count = presenceMap.size;
    logger.info(`Number of active sessions: ${count}`);
    return count;
};

/**
 * Retrieves all active sessions with user presence data.
 * @returns {object} - An object containing all active sessions and their user data.
 */
const getAllActiveSessions = () => {
    const allSessions = {};

    for (const [sessionId, sessionPresence] of presenceMap.entries()) {
        const sessionData = {};
        for (const [userId, data] of sessionPresence.entries()) {
            sessionData[userId] = data;
        }
        allSessions[sessionId] = sessionData;
    }

    logger.info(`Retrieved all active sessions with presence data.`, { allSessions });
    return allSessions;
};

/**
 * Removes inactive users from all sessions based on a timeout threshold.
 * @param {number} timeoutThreshold - Timeout threshold in milliseconds.
 */
const removeInactiveUsers = (timeoutThreshold) => {
    const now = Date.now();

    for (const [sessionId, sessionPresence] of presenceMap.entries()) {
        for (const [userId, data] of sessionPresence.entries()) {
            const elapsedTime = now - new Date(data.timestamp).getTime();
            if (elapsedTime > timeoutThreshold) {
                sessionPresence.delete(userId);
                logger.info(`Removed inactive user ${userId} from session ${sessionId}.`, {
                    sessionId,
                    userId,
                    elapsedTime,
                });
            }
        }

        if (sessionPresence.size === 0) {
            presenceMap.delete(sessionId); // Clean up session if no users remain
            logger.info(`Session ${sessionId} removed due to inactivity.`);
        }
    }
};

module.exports = {
    updateUserPresence,
    getUserPresence,
    removeUserPresence,
    removeSessionPresence,
    getActiveSessionCount,
    getAllActiveSessions,
    removeInactiveUsers,
};
