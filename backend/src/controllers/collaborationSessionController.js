// File Path: backend/controllers/collaborationSessionController.js

const { startSession, endSession, getSessionDetails, getActiveSessions } = require('../services/collaborationService');
const { addParticipantToSession, removeParticipantFromSession, getParticipants } = require('../services/participantService');
const { sendUserNotification } = require('../services/collaborationNotificationController');

// Start a collaboration session
const startSessionHandler = async (req, res) => {
    try {
        const { fileId, participants } = req.body;
        const session = await startSession(fileId, participants);
        
        // Notify all participants about the session start
        const message = `Collaboration session for file ${fileId} started with participants: ${participants.join(', ')}`;
        await sendUserNotification(participants[0], message, 'session-start');  // Notify first participant
        
        res.status(201).json({
            success: true,
            message: 'Session started successfully.',
            session,
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while starting the session.',
            details: error.message,
        });
    }
};

// End a collaboration session
const endSessionHandler = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await endSession(sessionId);
        
        // Notify all participants about the session end
        const message = `Collaboration session ${sessionId} has ended.`;
        await sendUserNotification(sessionId, message, 'session-end');
        
        res.status(200).json({
            success: true,
            message: 'Session ended successfully.',
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while ending the session.',
            details: error.message,
        });
    }
};

// Get details of a specific session
const getSessionDetailsHandler = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionDetails(sessionId);
        
        res.status(200).json({
            success: true,
            message: 'Session details retrieved successfully.',
            session,
        });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching session details.',
            details: error.message,
        });
    }
};

// Get all active sessions with pagination
const getActiveSessionsHandler = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const sessions = await getActiveSessions(page, limit);
        
        res.status(200).json({
            success: true,
            message: 'Active sessions retrieved successfully.',
            data: sessions,
        });
    } catch (error) {
        console.error('Error fetching active sessions:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching active sessions.',
            details: error.message,
        });
    }
};

module.exports = {
    startSessionHandler,
    endSessionHandler,
    getSessionDetailsHandler,
    getActiveSessionsHandler,
};
