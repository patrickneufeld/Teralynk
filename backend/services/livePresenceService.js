// File Path: backend/services/livePresenceService.js

const presenceMap = new Map();

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

    console.log(`Updated presence for user ${userId} in session ${sessionId}.`);
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

    console.log(`Retrieved presence for session ${sessionId}.`);
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
        console.log(`Removed presence for user ${userId} from session ${sessionId}.`);

        if (sessionPresence.size === 0) {
            presenceMap.delete(sessionId); // Clean up session if no users remain
            console.log(`Session ${sessionId} removed from presence map.`);
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
        console.log(`All presence data removed for session ${sessionId}.`);
    }
};

/**
 * Retrieves the current number of active sessions being tracked.
 * @returns {number} - Count of active sessions.
 */
const getActiveSessionCount = () => {
    const count = presenceMap.size;
    console.log(`Number of active sessions: ${count}`);
    return count;
};

module.exports = {
    updateUserPresence,
    getUserPresence,
    removeUserPresence,
    removeSessionPresence,
    getActiveSessionCount,
};
