// File: /backend/collaboration/socketServer.js

const WebSocket = require('ws');
const { handleCollaborationEvent } = require('../services/collaborationService');
const { addNotification } = require('../services/notificationDashboardService');

// Store active connections per user
const activeConnections = new Map();

const startSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });

    console.log('WebSocket server initialized.');

    // Handle connection events
    wss.on('connection', (ws, req) => {
        const userId = req.headers['user-id']; // Assume user ID is passed in headers during connection

        if (!userId) {
            ws.close();
            console.error('Connection rejected: User ID missing.');
            return;
        }

        console.log(`New client connected: ${userId}`);

        // Track the connection
        if (!activeConnections.has(userId)) {
            activeConnections.set(userId, []);
        }
        activeConnections.get(userId).push(ws);

        // Handle messages from clients
        ws.on('message', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);

                if (!parsedMessage.event || !parsedMessage.data) {
                    ws.send(JSON.stringify({ error: 'Invalid message format.' }));
                    return;
                }

                // Process the event through the collaboration service
                const response = await handleCollaborationEvent(parsedMessage.event, parsedMessage.data);

                // Send response back to the client
                ws.send(JSON.stringify({ event: parsedMessage.event, data: response }));
            } catch (error) {
                console.error('Error processing message:', error);
                ws.send(JSON.stringify({ error: 'An error occurred.' }));
            }
        });

        // Handle connection close
        ws.on('close', () => {
            console.log(`Client disconnected: ${userId}`);
            // Remove the connection from the activeConnections map
            const connections = activeConnections.get(userId) || [];
            activeConnections.set(userId, connections.filter((conn) => conn !== ws));
            if (activeConnections.get(userId).length === 0) {
                activeConnections.delete(userId);
            }
        });
    });

    return wss;
};

// Send a notification to a specific user
const sendNotificationToUser = (userId, notification) => {
    const connections = activeConnections.get(userId) || [];
    connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'notification', data: notification }));
        }
    });
};

// Broadcast a notification to all connected users
const broadcastNotification = (notification) => {
    activeConnections.forEach((connections) => {
        connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'notification', data: notification }));
            }
        });
    });
};

// Example integration with notification service
const triggerNotification = async (userId, type, message, data) => {
    const notification = addNotification(userId, type, message, data);
    sendNotificationToUser(userId, notification);
};

module.exports = {
    startSocketServer,
    sendNotificationToUser,
    broadcastNotification,
    triggerNotification,
};
