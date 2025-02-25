// File Path: backend/collaboration/historyService.js

const sessionHistories = new Map(); // Temporary in-memory store (replace with a database for production)

/**
 * Records a change in a session's history.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {object} change - The change made (e.g., { field: 'title', oldValue: 'A', newValue: 'B' }).
 * @param {string} userId - The ID of the user who made the change.
 */
const recordChange = (sessionId, change, userId) => {
    if (!sessionId || !change || !userId) {
        throw new Error('Session ID, change, and user ID are required to record a change.');
    }

    if (!sessionHistories.has(sessionId)) {
        sessionHistories.set(sessionId, []);
    }

    const timestamp = new Date();
    const changeEntry = { ...change, userId, timestamp };

    sessionHistories.get(sessionId).push(changeEntry);
    console.log(`Change recorded for session ${sessionId}:`, changeEntry);
};

/**
 * Retrieves the change history for a specific session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {Array<object>} - A list of recorded changes.
 */
const getSessionHistory = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to retrieve session history.');
    }

    const history = sessionHistories.get(sessionId) || [];
    console.log(`Retrieved history for session ${sessionId}:`, history);
    return history;
};

/**
 * Rolls back a session to a specific change.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {number} changeIndex - The index of the change to rollback to.
 * @returns {Array<object>} - The updated session history after rollback.
 */
const rollbackToChange = (sessionId, changeIndex) => {
    if (!sessionId || changeIndex === undefined || changeIndex === null) {
        throw new Error('Session ID and change index are required for rollback.');
    }

    const history = sessionHistories.get(sessionId);
    if (!history || changeIndex < 0 || changeIndex >= history.length) {
        throw new Error('Invalid change index or no history found for the session.');
    }

    sessionHistories.set(sessionId, history.slice(0, changeIndex + 1));
    console.log(`Session ${sessionId} rolled back to change index ${changeIndex}.`);
    return sessionHistories.get(sessionId);
};

/**
 * Clears the history for a specific session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const clearSessionHistory = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to clear session history.');
    }

    sessionHistories.delete(sessionId);
    console.log(`Cleared history for session ${sessionId}.`);
};

/**
 * Retrieves all session histories (for admin or auditing purposes).
 * @returns {Map<string, Array<object>>} - All session histories.
 */
const getAllHistories = () => {
    console.log(`Retrieved all session histories.`);
    return sessionHistories;
};

module.exports = {
    recordChange,
    getSessionHistory,
    rollbackToChange,
    clearSessionHistory,
    getAllHistories,
};
