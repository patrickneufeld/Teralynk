// File: /backend/services/collaborationService.js

const activeSessions = {}; // Store active collaboration sessions in-memory
const uuid = require('uuid'); // For generating unique session IDs

// Handle collaboration events
const handleCollaborationEvent = async (event, data) => {
    switch (event) {
        case 'start-session':
            return startCollaborationSession(data);
        case 'update-session':
            return updateCollaborationSession(data);
        case 'end-session':
            return endCollaborationSession(data);
        case 'get-session':
            return getCollaborationSession(data);
        default:
            throw new Error('Unsupported collaboration event.');
    }
};

// Start a new collaboration session
const startCollaborationSession = (data) => {
    const { fileId, participants } = data;

    if (!fileId || !participants || !Array.isArray(participants)) {
        throw new Error('Invalid session data.');
    }

    const sessionId = uuid.v4();
    activeSessions[sessionId] = {
        sessionId,
        fileId,
        participants,
        updates: [],
        createdAt: new Date(),
    };

    console.log(`Started collaboration session: ${sessionId}`);
    return activeSessions[sessionId];
};

// Update an existing session with real-time changes
const updateCollaborationSession = (data) => {
    const { sessionId, update } = data;

    if (!sessionId || !update) {
        throw new Error('Invalid update data.');
    }

    const session = activeSessions[sessionId];
    if (!session) {
        throw new Error('Session not found.');
    }

    session.updates.push({ ...update, timestamp: new Date() });

    console.log(`Updated session ${sessionId} with new update.`);
    return session;
};

// End a collaboration session
const endCollaborationSession = (data) => {
    const { sessionId } = data;

    if (!sessionId) {
        throw new Error('Invalid session ID.');
    }

    const session = activeSessions[sessionId];
    if (!session) {
        throw new Error('Session not found.');
    }

    delete activeSessions[sessionId];

    console.log(`Ended collaboration session: ${sessionId}`);
    return { message: 'Session ended successfully.' };
};

// Retrieve an active session
const getCollaborationSession = (data) => {
    const { sessionId } = data;

    if (!sessionId) {
        throw new Error('Invalid session ID.');
    }

    const session = activeSessions[sessionId];
    if (!session) {
        throw new Error('Session not found.');
    }

    return session;
};

module.exports = { handleCollaborationEvent };
