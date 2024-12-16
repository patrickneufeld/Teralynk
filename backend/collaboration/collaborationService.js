// File: /backend/services/collaborationService.js

const uuid = require('uuid'); // For generating unique session IDs

// Temporary in-memory store for active sessions (Replace with a database for production)
const activeSessions = {};

// **1️⃣ Handle collaboration events**
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
        case 'list-sessions':
            return listAllSessions();
        case 'add-participant':
            return addParticipantToSession(data);
        case 'remove-participant':
            return removeParticipantFromSession(data);
        default:
            throw new Error('Unsupported collaboration event.');
    }
};

// **2️⃣ Start a new collaboration session**
const startCollaborationSession = (data) => {
    const { fileId, participants } = data;

    if (!fileId || !participants || !Array.isArray(participants)) {
        throw new Error('Invalid session data. fileId and participants are required.');
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

// **3️⃣ Update an existing session with real-time changes**
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

// **4️⃣ End a collaboration session**
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

// **5️⃣ Retrieve an active session**
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

// **6️⃣ List all active collaboration sessions**
const listAllSessions = () => {
    const allSessions = Object.values(activeSessions);
    console.log(`Listing all active sessions:`, allSessions);
    return allSessions;
};

// **7️⃣ Add a participant to an existing session**
const addParticipantToSession = (data) => {
    const { sessionId, participant } = data;

    if (!sessionId || !participant) {
        throw new Error('Invalid data. Session ID and participant are required.');
    }

    const session = activeSessions[sessionId];
    if (!session) {
        throw new Error('Session not found.');
    }

    if (!session.participants.includes(participant)) {
        session.participants.push(participant);
    }

    console.log(`Added participant to session ${sessionId}: ${participant}`);
    return session;
};

// **8️⃣ Remove a participant from an existing session**
const removeParticipantFromSession = (data) => {
    const { sessionId, participant } = data;

    if (!sessionId || !participant) {
        throw new Error('Invalid data. Session ID and participant are required.');
    }

    const session = activeSessions[sessionId];
    if (!session) {
        throw new Error('Session not found.');
    }

    session.participants = session.participants.filter(p => p !== participant);

    console.log(`Removed participant from session ${sessionId}: ${participant}`);
    return session;
};

module.exports = { 
    handleCollaborationEvent, 
    startCollaborationSession, 
    updateCollaborationSession, 
    endCollaborationSession, 
    getCollaborationSession, 
    listAllSessions, 
    addParticipantToSession, 
    removeParticipantFromSession 
};
