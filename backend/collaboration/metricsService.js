let metrics = {
    totalSessions: 0,
    totalEdits: 0,
    activeUsers: new Set()
};

const recordNewSession = () => {
    metrics.totalSessions += 1;
};

const recordEdit = () => {
    metrics.totalEdits += 1;
};

const addUserToActiveUsers = (userId) => {
    metrics.activeUsers.add(userId);
};

const getMetrics = () => {
    return {
        totalSessions: metrics.totalSessions,
        totalEdits: metrics.totalEdits,
        activeUsers: Array.from(metrics.activeUsers)
    };
};

module.exports = { recordNewSession, recordEdit, addUserToActiveUsers, getMetrics };
