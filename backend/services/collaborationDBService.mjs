// File Path: backend/services/collaborationDBService.js

const { query } = require('./db'); // Assuming query function is implemented in db.js

/**
 * Create a new collaboration session in the database.
 * @param {string} fileId - The ID of the file being collaborated on.
 * @param {Array} participants - List of user IDs participating in the session.
 * @returns {Promise<object>} - The created session.
 */
const createSession = async (fileId, participants) => {
    try {
        const sessionId = uuidv4(); // Generate unique session ID
        const result = await query(
            'INSERT INTO collaboration_sessions (session_id, file_id, participants, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [sessionId, fileId, JSON.stringify(participants), new Date()]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error creating collaboration session:', error);
        throw new Error('Failed to create collaboration session.');
    }
};

/**
 * Get collaboration session details by ID.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {Promise<object>} - The session details.
 */
const getSessionDetails = async (sessionId) => {
    try {
        const result = await query('SELECT * FROM collaboration_sessions WHERE session_id = $1', [sessionId]);
        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error retrieving session details:', error);
        throw new Error('Failed to retrieve session details.');
    }
};

/**
 * Update collaboration session details, such as participants or updates.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {object} updates - The updates to apply to the session.
 * @returns {Promise<object>} - The updated session.
 */
const updateSession = async (sessionId, updates) => {
    try {
        const result = await query(
            'UPDATE collaboration_sessions SET participants = $1, updates = $2 WHERE session_id = $3 RETURNING *',
            [JSON.stringify(updates.participants), JSON.stringify(updates.updates), sessionId]
        );
        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error updating collaboration session:', error);
        throw new Error('Failed to update collaboration session.');
    }
};

/**
 * Add a participant to a collaboration session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The user ID to add to the session.
 * @returns {Promise<object>} - The updated session.
 */
const addParticipantToSession = async (sessionId, userId) => {
    try {
        const session = await getSessionDetails(sessionId);
        const participants = JSON.parse(session.participants);
        participants.push(userId);
        return await updateSession(sessionId, { participants });
    } catch (error) {
        console.error('Error adding participant to session:', error);
        throw new Error('Failed to add participant to session.');
    }
};

/**
 * Remove a participant from a collaboration session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The user ID to remove from the session.
 * @returns {Promise<object>} - The updated session.
 */
const removeParticipantFromSession = async (sessionId, userId) => {
    try {
        const session = await getSessionDetails(sessionId);
        let participants = JSON.parse(session.participants);
        participants = participants.filter(participant => participant !== userId);
        return await updateSession(sessionId, { participants });
    } catch (error) {
        console.error('Error removing participant from session:', error);
        throw new Error('Failed to remove participant from session.');
    }
};

/**
 * List all active collaboration sessions.
 * @returns {Promise<Array>} - List of active collaboration sessions.
 */
const listActiveSessions = async () => {
    try {
        const result = await query('SELECT * FROM collaboration_sessions WHERE active = TRUE');
        return result.rows;
    } catch (error) {
        console.error('Error listing active sessions:', error);
        throw new Error('Failed to list active sessions.');
    }
};

/**
 * Archive a collaboration session (mark as inactive).
 * @param {string} sessionId - The ID of the session to archive.
 * @returns {Promise<object>} - The archived session.
 */
const archiveSession = async (sessionId) => {
    try {
        const result = await query(
            'UPDATE collaboration_sessions SET active = FALSE WHERE session_id = $1 RETURNING *',
            [sessionId]
        );
        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error archiving session:', error);
        throw new Error('Failed to archive session.');
    }
};

/**
 * Restore a previously archived session.
 * @param {string} sessionId - The ID of the session to restore.
 * @returns {Promise<object>} - The restored session.
 */
const restoreSession = async (sessionId) => {
    try {
        const result = await query(
            'UPDATE collaboration_sessions SET active = TRUE WHERE session_id = $1 RETURNING *',
            [sessionId]
        );
        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error restoring session:', error);
        throw new Error('Failed to restore session.');
    }
};

/**
 * Log collaboration session errors.
 * @param {string} sessionId - The ID of the session.
 * @param {string} errorMessage - The error message to log.
 */
const logSessionError = async (sessionId, errorMessage) => {
    try {
        await query(
            'INSERT INTO collaboration_session_errors (session_id, error_message) VALUES ($1, $2)',
            [sessionId, errorMessage]
        );
        console.log(`Logged error for session ${sessionId}: ${errorMessage}`);
    } catch (error) {
        console.error('Error logging session error:', error);
        throw new Error('Failed to log session error.');
    }
};

module.exports = {
    createSession,
    getSessionDetails,
    updateSession,
    addParticipantToSession,
    removeParticipantFromSession,
    listActiveSessions,
    archiveSession,
    restoreSession,
    logSessionError,
};
