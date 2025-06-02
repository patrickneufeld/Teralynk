// File Path: backend/services/eventHistoryService.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    eventType: { type: String, required: true }, // e.g., "edit", "join", "leave"
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    eventData: { type: mongoose.Schema.Types.Mixed }, // Additional event-specific data
});

const Event = mongoose.model('Event', eventSchema);

/**
 * Log a new event in the history.
 * @param {string} sessionId - The session ID.
 * @param {string} eventType - The type of event.
 * @param {string} userId - The user responsible for the event.
 * @param {object} eventData - Additional data related to the event.
 * @returns {Promise<object>} - The saved event.
 */
const logEvent = async (sessionId, eventType, userId, eventData = {}) => {
    const event = new Event({ sessionId, eventType, userId, eventData });
    return await event.save();
};

/**
 * Retrieve all events for a session.
 * @param {string} sessionId - The session ID.
 * @returns {Promise<Array<object>>} - List of events for the session.
 */
const getEventsForSession = async (sessionId) => {
    return await Event.find({ sessionId }).sort({ timestamp: 1 });
};

module.exports = { logEvent, getEventsForSession };
