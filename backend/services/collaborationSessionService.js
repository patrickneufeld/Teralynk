// File Path: backend/services/collaborationSessionService.js

const { v4: uuidv4 } = require('uuid'); // For generating unique session IDs
const { addParticipant, removeParticipant, getParticipants } = require('./participantService');
const { updateUserPresence, getUserPresence } = require('./livePresenceService');

/**
 * Starts a new collaboration session.
 * @param {string} fileId - The ID of the file being collaborated on.
 * @param {Array<string>} participants - List of user IDs to add to the session.
 * @returns {object} - Details of the newly created session.
 */
const startSession = (fileId, participants) => {
    if (!fileId || !participants || !Array.isArray(participants)) {
        throw new Error('File ID and participants (array) are required.');
    }

    const sessionId = uuidv4(); // Generate a unique session ID
    participants.forEach(userId => addParticipant(sessionId, userId)); // Add participants to the session

    console.log(`Collaboration session started: ${sessionId}, File ID: ${fileId}, Participants: ${participants.join(', ')}`);
    return { sessionId, fileId, participants };
};

/**
 * Ends an active collaboration session.
 * @param {string} sessionId - The ID of the session to end.
 * @returns {string} - Success message.
 */
const endSession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required.');
    }

    // Remove all participants and session data
    removeParticipant(sessionId);
    console.log(`Collaboration session ended: ${sessionId}`);
    return `Session ${sessionId} has been successfully ended.`;
};

/**
 * Gets the list of participants in a session.
 * @param {string} sessionId - The ID of the session to retrieve participants for.
 * @returns {Array<string>} - List of participant IDs.
 */
const getSessionDetails = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required.');
    }

    const participants = getParticipants(sessionId);
    console.log(`Session ${sessionId} participants: ${participants.join(', ')}`);
    return participants;
};

/**
 * Updates a user's presence (e.g., cursor position) in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user.
 * @param {object} cursorPosition - The user's cursor position (e.g., { x: 100, y: 200 }).
 */
const updatePresence = (sessionId, userId, cursorPosition) => {
    if (!sessionId || !userId || !cursorPosition) {
        throw new Error('Session ID, User ID, and cursor position are required.');
    }

    // Update presence data (e.g., cursor position)
    updateUserPresence(sessionId, userId, cursorPosition);
    console.log(`Updated presence for user ${userId} in session ${sessionId}.`);
};

/**
 * Gets the presence data for all users in a session.
 * @param {string} sessionId - The ID of the session to retrieve presence data for.
 * @returns {object} - Presence data for all participants in the session.
 */
const getPresenceData = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required.');
    }

    const presenceData = getUserPresence(sessionId);
    console.log(`Presence data for session ${sessionId}:`, presenceData);
    return presenceData;
};

module.exports = {
    startSession,
    endSession,
    getSessionDetails,
    updatePresence,
    getPresenceData,
};
