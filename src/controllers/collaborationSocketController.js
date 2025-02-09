// File Path: backend/controllers/collaborationSocketController.js

const { startSocketServer } = require('../services/socketServer');
const { getUserPresence, updateUserPresence, removeUserPresence } = require('../services/livePresenceService');
const { addNotification } = require('../services/notificationService');
const { addParticipantToSession, removeParticipantFromSession } = require('../services/participantService');

// Initializes WebSocket server and manages collaboration sessions
const initializeCollaborationSocket = (server) => {
    startSocketServer(server);

    console.log('Collaboration WebSocket server initialized.');

    // Event listener for new connection
    server.on('connection', (socket, req) => {
        const userId = req.headers['user-id'];
        
        if (!userId) {
            socket.close();
            return;
        }

        // Track user presence when connected
        socket.on('user-connected', (data) => {
            const { sessionId, cursorPosition } = data;
            updateUserPresence(sessionId, userId, cursorPosition);
            addParticipantToSession(sessionId, userId);
            addNotification(userId, 'New connection', `User ${userId} has joined the session.`);
        });

        // Handle real-time updates to collaboration sessions (e.g., cursor position, text edits)
        socket.on('collaboration-update', (data) => {
            const { sessionId, update } = data;
            updateUserPresence(sessionId, userId, update.cursorPosition);
        });

        // Event listener for user disconnection
        socket.on('disconnect', () => {
            const sessionId = req.headers['session-id'];
            removeUserPresence(sessionId, userId);
            removeParticipantFromSession(sessionId, userId);
            addNotification(userId, 'Disconnection', `User ${userId} has left the session.`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
};

module.exports = {
    initializeCollaborationSocket
};
