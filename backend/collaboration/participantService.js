// File Path: backend/collaboration/participantService.js

const logger = require('../config/logger'); // Centralized logger

// In-memory store for session participants (Replace with a database in production)
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

    logger.info(`Participant ${userId} added to session ${sessionId}.`);
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
        logger.warn(`Session ${sessionId} not found.`);
        return;
    }

    const participants = sessionParticipants.get(sessionId);
    participants.delete(userId);

    logger.info(`Participant ${userId} removed from session ${sessionId}.`);

    // Clean up if no participants remain
    if (participants.size === 0) {
        sessionParticipants.delete(sessionId);
        logger.info(`Session ${sessionId} has no participants and has been removed.`);
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
    logger.info(`Retrieved participants for session ${sessionId}: ${Array.from(participants)}`);
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

    logger.info(`Total participants across all sessions: ${total}`);
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
        logger.info(`All participants removed from session ${sessionId}.`);
    }
};

/**
 * Checks if a user is in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the participant.
 * @returns {boolean} - True if the user is in the session, false otherwise.
 */
const isParticipantInSession = (sessionId, userId) => {
    if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required to check participant status.');
    }

    const participants = sessionParticipants.get(sessionId) || new Set();
    const isParticipant = participants.has(userId);

    logger.info(
        `Checked participant ${userId} in session ${sessionId}: ${isParticipant}`
    );
    return isParticipant;
};

/**
 * Broadcasts a message to all participants in a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} message - The message to broadcast.
 */
const broadcastMessage = (sessionId, message) => {
    if (!sessionId || !message) {
        throw new Error('Session ID and message are required to broadcast a message.');
    }

    const participants = sessionParticipants.get(sessionId) || new Set();

    participants.forEach((userId) => {
        // Replace with actual notification logic
        logger.info(`Broadcasting message to ${userId} in session ${sessionId}: ${message}`);
    });

    logger.info(`Message broadcasted to session ${sessionId}: ${message}`);
};

module.exports = {
    addParticipant,
    removeParticipant,
    getParticipants,
    getTotalParticipants,
    removeAllParticipants,
    isParticipantInSession,
    broadcastMessage,
};
