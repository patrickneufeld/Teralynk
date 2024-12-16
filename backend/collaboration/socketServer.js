const WebSocket = require('ws');
const { handleCollaborationEvent } = require('../services/collaborationService');
const { addNotification } = require('../services/notificationDashboardService');
const { verifyToken } = require('../services/authService');
const { hasPermission } = require('../services/rbacService');
const { trackPresence, removeUserPresence } = require('./livePresenceService');

// Store active connections per user
const activeConnections = new Map();
const rateLimit = new Map(); // For rate limiting user actions

const startSocketServer = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/collaboration' });

    console.log('WebSocket server initialized for collaboration.');

    // **Handle WebSocket connection events**
    wss.on('connection', async (ws, req) => {
        try {
            const token = req.headers['authorization']?.split(' ')[1]; // Extract Bearer token
            if (!token) {
                ws.close();
                console.error('Connection rejected: No token provided.');
                return;
            }

            const user = await verifyToken(token);
            if (!user) {
                ws.close();
                console.error('Connection rejected: Invalid token.');
                return;
            }

            const userId = user.id;
            console.log(`New client connected: ${userId}`);

            // **Track the connection**
            if (!activeConnections.has(userId)) {
                activeConnections.set(userId, []);
            }
            activeConnections.get(userId).push(ws);
            trackPresence(userId);

            // **Handle messages from clients**
            ws.on('message', async (message) => {
                try {
                    if (isRateLimited(userId)) {
                        ws.send(JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }));
                        return;
                    }

                    const parsedMessage = parseMessage(message);
                    if (!parsedMessage) {
                        ws.send(JSON.stringify({ error: 'Invalid message format.' }));
                        return;
                    }

                    // **RBAC Check**
                    if (!hasPermission(userId, `socket:${parsedMessage.event}`)) {
                        ws.send(JSON.stringify({ error: 'Permission denied for this action.' }));
                        return;
                    }

                    // **Process the event via collaboration service**
                    const response = await handleCollaborationEvent(parsedMessage.event, parsedMessage.data);
                    
                    // **Send response back to the client**
                    ws.send(JSON.stringify({ event: parsedMessage.event, data: response }));

                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({ error: 'An error occurred while processing the message.' }));
                }
            });

            // **Handle connection close**
            ws.on('close', () => {
                console.log(`Client disconnected: ${userId}`);
                const connections = activeConnections.get(userId) || [];
                activeConnections.set(userId, connections.filter((conn) => conn !== ws));
                if (activeConnections.get(userId).length === 0) {
                    activeConnections.delete(userId);
                    removeUserPresence(userId);
                }
            });

            // **Handle connection error**
            ws.on('error', (error) => {
                console.error(`WebSocket error for user: ${userId}`, error);
            });

        } catch (error) {
            console.error('Error during connection initialization:', error);
            ws.close();
        }
    });

    // **Global WebSocket Error Handling**
    wss.on('error', (error) => {
        console.error('Global WebSocket error:', error);
    });

    // **Ping-Pong Heartbeat Check**
    setInterval(() => {
        activeConnections.forEach((connections, userId) => {
            connections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            });
        });
    }, 30000); // Send heartbeat ping every 30 seconds

    return wss;
};

// **Send a notification to a specific user**
const sendNotificationToUser = (userId, notification) => {
    const connections = activeConnections.get(userId) || [];
    connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'notification', data: notification }));
        }
    });
};

// **Broadcast a notification to all connected users**
const broadcastNotification = (notification) => {
    activeConnections.forEach((connections) => {
        connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'notification', data: notification }));
            }
        });
    });
};

// **Trigger a notification and send it to a specific user**
const triggerNotification = async (userId, type, message, data) => {
    try {
        const notification = await addNotification(userId, type, message, data);
        sendNotificationToUser(userId, notification);
    } catch (error) {
        console.error('Error triggering notification:', error);
    }
};

// **Force disconnect a specific user (admin only)**
const forceDisconnectUser = (userId) => {
    const connections = activeConnections.get(userId) || [];
    connections.forEach((ws) => ws.close());
    activeConnections.delete(userId);
    console.log(`Admin forcibly disconnected user: ${userId}`);
};

// **Rate limiter for WebSocket messages**
const isRateLimited = (userId) => {
    const userLimit = rateLimit.get(userId) || { count: 0, startTime: Date.now() };
    const elapsed = Date.now() - userLimit.startTime;

    if (elapsed > 1000) { // 1-second window
        rateLimit.set(userId, { count: 1, startTime: Date.now() });
        return false;
    }

    userLimit.count += 1;
    rateLimit.set(userId, userLimit);
    return userLimit.count > 10; // Limit to 10 messages per second
};

// **Parse and validate incoming message**
const parseMessage = (message) => {
    try {
        const parsedMessage = JSON.parse(message);
        if (!parsedMessage.event || !parsedMessage.data) {
            throw new Error('Invalid message structure.');
        }
        return parsedMessage;
    } catch (error) {
        console.error('Error parsing message:', error);
        return null;
    }
};

module.exports = {
    startSocketServer,
    sendNotificationToUser,
    broadcastNotification,
    triggerNotification,
    forceDisconnectUser
};
