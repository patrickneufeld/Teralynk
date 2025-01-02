const Session = require('../models/sessionModel');
const Participant = require('../models/participantModel');
const { getEventsForSession } = require('./eventHistoryService'); // Correct import for event history service

/**
 * Get global analytics.
 * @returns {Promise<object>} - Metrics for all sessions.
 */
const getGlobalAnalytics = async () => {
    const totalSessions = await Session.countDocuments();
    const totalParticipants = await Participant.countDocuments();
    const totalEvents = await getEventsForSession(); // Get total events globally

    return {
        totalSessions,
        totalParticipants,
        totalEvents,
    };
};

/**
 * Get analytics for active sessions.
 * @returns {Promise<Array>} - Metrics for all active sessions.
 */
const getActiveSessionsAnalytics = async () => {
    const activeSessions = await Session.find({ endedAt: null });
    const analytics = [];

    for (const session of activeSessions) {
        const totalParticipants = await Participant.countDocuments({ sessionId: session.sessionId });
        const totalEvents = await getEventsForSession(session.sessionId); // Get events count for each active session
        analytics.push({
            sessionId: session.sessionId,
            fileId: session.fileId,
            totalParticipants,
            totalEvents,
            createdAt: session.createdAt,
        });
    }

    return analytics;
};

/**
 * Get analytics for a specific session.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<object>} - Metrics for the session.
 */
const getSessionAnalytics = async (sessionId) => {
    const session = await Session.findOne({ sessionId });
    if (!session) throw new Error('Session not found.');

    const totalParticipants = await Participant.countDocuments({ sessionId });
    const totalEvents = await getEventsForSession(sessionId); // Get events count for this specific session

    return {
        sessionId: session.sessionId,
        fileId: session.fileId,
        totalParticipants,
        totalEvents,
        createdAt: session.createdAt,
        endedAt: session.endedAt || null,
    };
};

module.exports = {
    getGlobalAnalytics,
    getActiveSessionsAnalytics,
    getSessionAnalytics,
};
