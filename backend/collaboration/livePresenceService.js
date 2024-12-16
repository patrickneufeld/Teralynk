const presenceMap = new Map();

const updateUserPresence = (sessionId, userId, cursorPosition) => {
    if (!presenceMap.has(sessionId)) {
        presenceMap.set(sessionId, {});
    }
    presenceMap.get(sessionId)[userId] = { cursorPosition, timestamp: new Date() };
};

const getUserPresence = (sessionId) => {
    return presenceMap.get(sessionId) || {};
};

const removeUserPresence = (sessionId, userId) => {
    const sessionPresence = presenceMap.get(sessionId) || {};
    delete sessionPresence[userId];
};

module.exports = { updateUserPresence, getUserPresence, removeUserPresence };
