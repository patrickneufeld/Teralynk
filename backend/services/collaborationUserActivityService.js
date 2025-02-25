const { v4: uuidv4 } = require('uuid');
const db = require('../config/db'); // Assuming you're using a DB for persistence

// Helper function to handle errors more gracefully
const handleError = (message, data = {}) => {
    const error = new Error(message);
    error.data = data;
    throw error;
};

/**
 * Records a user activity in a collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user performing the activity.
 * @param {string} activityType - The type of activity (e.g., "edit", "message").
 * @param {object} details - Additional details related to the activity.
 */
const recordActivity = async (sessionId, userId, activityType, details) => {
    if (!sessionId || !userId || !activityType) {
        handleError('Session ID, User ID, and Activity Type are required.', { sessionId, userId, activityType });
    }

    const activityId = uuidv4();
    const timestamp = new Date().toISOString();

    // Store the activity in the database instead of in memory
    try {
        const result = await db.query(
            'INSERT INTO user_activity (session_id, user_id, activity_id, activity_type, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [sessionId, userId, activityId, activityType, JSON.stringify(details), timestamp]
        );
        console.log(`Activity recorded: ${activityType} by user ${userId} in session ${sessionId}.`);
        return result.rows[0];
    } catch (error) {
        handleError('Error recording activity in database.', error);
    }
};

/**
 * Retrieves the activity history of a user in a collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} userId - The ID of the user.
 * @returns {Array} - An array of user activities.
 */
const getUserActivityHistory = async (sessionId, userId) => {
    if (!sessionId || !userId) {
        handleError('Session ID and User ID are required.', { sessionId, userId });
    }

    try {
        const result = await db.query(
            'SELECT * FROM user_activity WHERE session_id = $1 AND user_id = $2 ORDER BY timestamp DESC',
            [sessionId, userId]
        );
        console.log(`Retrieved ${result.rows.length} activities for user ${userId} in session ${sessionId}.`);
        return result.rows;
    } catch (error) {
        handleError('Error retrieving user activity history from database.', error);
    }
};

/**
 * Retrieves the activity history for a collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {Array} - An array of all activities in the session.
 */
const getSessionActivityHistory = async (sessionId) => {
    if (!sessionId) {
        handleError('Session ID is required.', { sessionId });
    }

    try {
        const result = await db.query(
            'SELECT * FROM user_activity WHERE session_id = $1 ORDER BY timestamp DESC',
            [sessionId]
        );
        console.log(`Retrieved ${result.rows.length} activities for session ${sessionId}.`);
        return result.rows;
    } catch (error) {
        handleError('Error retrieving session activity history from database.', error);
    }
};

/**
 * Deletes a specific activity from the session's activity log.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} activityId - The ID of the activity to delete.
 * @returns {boolean} - True if the activity was deleted, false otherwise.
 */
const deleteActivity = async (sessionId, activityId) => {
    if (!sessionId || !activityId) {
        handleError('Session ID and Activity ID are required.', { sessionId, activityId });
    }

    try {
        const result = await db.query(
            'DELETE FROM user_activity WHERE session_id = $1 AND activity_id = $2 RETURNING *',
            [sessionId, activityId]
        );

        if (result.rows.length === 0) {
            console.log(`Activity ${activityId} not found in session ${sessionId}.`);
            return false;
        }

        console.log(`Activity ${activityId} deleted from session ${sessionId}.`);
        return true;
    } catch (error) {
        handleError('Error deleting activity from database.', error);
    }
};

/**
 * Clears the activity log for a specific session.
 * @param {string} sessionId - The ID of the collaboration session.
 */
const clearSessionActivityLog = async (sessionId) => {
    if (!sessionId) {
        handleError('Session ID is required.', { sessionId });
    }

    try {
        await db.query('DELETE FROM user_activity WHERE session_id = $1', [sessionId]);
        console.log(`All activities cleared for session ${sessionId}.`);
    } catch (error) {
        handleError('Error clearing session activity log in database.', error);
    }
};

module.exports = {
    recordActivity,
    getUserActivityHistory,
    getSessionActivityHistory,
    deleteActivity,
    clearSessionActivityLog,
};
