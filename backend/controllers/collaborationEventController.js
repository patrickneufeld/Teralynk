// File Path: backend/controllers/collaborationEventController.js

const { addParticipant, removeParticipant } = require('../services/participantService');
const { sendUserNotification, sendAllUsersNotification } = require('../services/collaborationNotificationService');
const { trackPresence, removeUserPresence } = require('../services/livePresenceService');
const { recordEdit } = require('../services/collaborationAnalyticsService');

/**
 * Handles the event when a participant joins a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user joining the session.
 */
const participantJoinEvent = async (req, res) => {
    try {
        const { sessionId, userId } = req.body;

        // Add participant to the session
        addParticipant(sessionId, userId);

        // Track user presence in the session
        trackPresence(sessionId, userId);

        // Send a notification to the user and to all participants
        const message = `User ${userId} has joined the session.`;
        await sendUserNotification(userId, message, 'participant-join');
        await sendAllUsersNotification(sessionId, message, 'participant-join');

        res.status(200).json({
            success: true,
            message: `User ${userId} joined the session.`,
        });
    } catch (error) {
        console.error('Error handling participant join event:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while handling participant join event.',
        });
    }
};

/**
 * Handles the event when a participant leaves a session.
 * @param {string} sessionId - The ID of the session.
 * @param {string} userId - The ID of the user leaving the session.
 */
const participantLeaveEvent = async (req, res) => {
    try {
        const { sessionId, userId } = req.body;

        // Remove participant from the session
        removeParticipant(sessionId, userId);

        // Remove user presence from the session
        removeUserPresence(sessionId, userId);

        // Send notification to the user and to all participants
        const message = `User ${userId} has left the session.`;
        await sendUserNotification(userId, message, 'participant-leave');
        await sendAllUsersNotification(sessionId, message, 'participant-leave');

        res.status(200).json({
            success: true,
            message: `User ${userId} left the session.`,
        });
    } catch (error) {
        console.error('Error handling participant leave event:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while handling participant leave event.',
        });
    }
};

/**
 * Handles session updates during collaboration (e.g., when a participant makes an edit).
 * @param {string} sessionId - The ID of the session.
 * @param {object} updateData - The update information (e.g., edit details).
 */
const sessionUpdateEvent = async (req, res) => {
    try {
        const { sessionId, updateData } = req.body;

        // Record the edit in the collaboration session analytics
        recordEdit(sessionId);

        // Send a notification to all users about the update
        const message = `Session updated: ${JSON.stringify(updateData)}`;
        await sendAllUsersNotification(sessionId, message, 'session-update');

        res.status(200).json({
            success: true,
            message: 'Session updated successfully.',
            data: updateData,
        });
    } catch (error) {
        console.error('Error handling session update event:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while handling session update event.',
        });
    }
};

/**
 * Handles session completion (e.g., the session is finished or closed).
 * @param {string} sessionId - The ID of the session.
 */
const sessionCompletionEvent = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Send a notification to all users about the session completion
        const message = `Session ${sessionId} has been completed.`;
        await sendAllUsersNotification(sessionId, message, 'session-completion');

        res.status(200).json({
            success: true,
            message: 'Session completed successfully.',
        });
    } catch (error) {
        console.error('Error handling session completion event:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while handling session completion event.',
        });
    }
};

/**
 * Archives a session for later retrieval.
 * @param {string} sessionId - The ID of the session.
 */
const archiveSessionEvent = async (req, res) => {
    try {
        const { sessionId } = req.body;

        // Archive the session in the system (method implementation needed)
        // const archivedSession = await archiveSession(sessionId);

        res.status(200).json({
            success: true,
            message: `Session ${sessionId} archived successfully.`,
        });
    } catch (error) {
        console.error('Error handling session archive event:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while handling session archive event.',
        });
    }
};

module.exports = {
    participantJoinEvent,
    participantLeaveEvent,
    sessionUpdateEvent,
    sessionCompletionEvent,
    archiveSessionEvent,
};
