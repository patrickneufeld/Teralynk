// File: backend/services/eventHistoryService.js

const { query } = require('./db'); // Assuming db.js handles database queries

/**
 * Log a new event in the event history.
 * @param {string} sessionId - The ID of the session where the event occurred.
 * @param {string} eventType - The type of event (e.g., "edit", "join").
 * @param {string} userId - The ID of the user performing the action.
 * @param {object} eventData - Additional event-specific data.
 * @returns {Promise<object>} - The saved event data.
 */
const logEvent = async (sessionId, eventType, userId, eventData = {}) => {
    try {
        const result = await query(
            'INSERT INTO event_history (session_id, event_type, user_id, event_data) VALUES ($1, $2, $3, $4) RETURNING *',
            [sessionId, eventType, userId, JSON.stringify(eventData)]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error logging event:', error);
        throw new Error('Failed to log event');
    }
};

/**
 * Retrieve events for a session.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Array>} - List of events for the session.
 */
const getEventsForSession = async (sessionId) => {
    try {
        const result = await query('SELECT * FROM event_history WHERE session_id = $1 ORDER BY timestamp DESC', [sessionId]);
        return result.rows;
    } catch (error) {
        console.error('Error retrieving events for session:', error);
        throw new Error('Failed to retrieve events');
    }
};

module.exports = {
    logEvent,
    getEventsForSession,
};
