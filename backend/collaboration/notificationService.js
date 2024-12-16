const { sendNotificationToUser } = require('./socketServer');

const notifyUser = (userId, message) => {
    sendNotificationToUser(userId, { message, timestamp: new Date() });
};

const notifyAllUsers = (message) => {
    sendNotificationToUser('all', { message, timestamp: new Date() });
};

module.exports = { notifyUser, notifyAllUsers };
