const sessionParticipants = new Map();

const addParticipant = (sessionId, userId) => {
    if (!sessionParticipants.has(sessionId)) {
        sessionParticipants.set(sessionId, []);
    }
    sessionParticipants.get(sessionId).push(userId);
};

const removeParticipant = (sessionId, userId) => {
    if (!sessionParticipants.has(sessionId)) return;
    const participants = sessionParticipants.get(sessionId).filter((id) => id !== userId);
    sessionParticipants.set(sessionId, participants);
};

const getParticipants = (sessionId) => {
    return sessionParticipants.get(sessionId) || [];
};

module.exports = { addParticipant, removeParticipant, getParticipants };
