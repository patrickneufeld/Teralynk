// File Path: backend/collaboration/participantService.js

const sessionParticipants = new Map();

/**
 * Adds a participant to a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the participant to add.
 */
const addParticipant = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required to add a participant.');
    }

    if (!sessionParticipants.has(sessionId)) {
        sessionParticipants.set(sessionId, new Set());
    }

    const participants = sessionParticipants.get(sessionId);
    participants.add(userId);

    console.log(`Participant ${userId} added to session ${sessionId}.`);
};

/**
 * Removes a participant from a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the participant to remove.
 */
const removeParticipant = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required to remove a participant.');
    }

    if (!sessionParticipants.has(sessionId)) {
        console.log(`Session ${sessionId} not found.`);
        return;
    }

    const participants = sessionParticipants.get(sessionId);
    participants.delete(userId);

    console.log(`Participant ${userId} removed from session ${sessionId}.`);

    // Clean up if no participants remain
    if (participants.size === 0) {
        sessionParticipants.delete(sessionId);
        console.log(`Session ${sessionId} has no participants and has been removed.`);
    }
};

/**
 * Retrieves all participants in a session.
 * @param {string} sessionId - The ID of the session.
 * @returns {Array<string>} - A list of participant IDs.
 */
const getParticipants = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to get participants.');
    }

    const participants = sessionParticipants.get(sessionId) || new Set();
    console.log(`Retrieved participants for session ${sessionId}: ${Array.from(participants)}`);
    return Array.from(participants);
};

/**
 * Retrieves the total number of participants across all sessions.
 * @returns {number} - Total number of participants in all sessions.
 */
const getTotalParticipants = () => {
    let total = 0;

    for (const participants of sessionParticipants.values()) {
        total += participants.size;
    }

    console.log(`Total participants across all sessions: ${total}`);
    return total;
};

/**
 * Removes all participants from a session.
 * @param {string} sessionId - The ID of the session.
 */
const removeAllParticipants = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to remove all participants.');
    }

    if (sessionParticipants.has(sessionId)) {
        sessionParticipants.delete(sessionId);
        console.log(`All participants removed from session ${sessionId}.`);
    }
};

module.exports = {
    addParticipant,
    removeParticipant,
    getParticipants,
    getTotalParticipants,
    removeAllParticipants,
};
