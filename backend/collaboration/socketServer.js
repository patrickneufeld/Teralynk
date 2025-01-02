// File Path: backend/collaboration/socketServer.js

const WebSocket = require('ws');
const { handleCollaborationEvent } = require('../services/collaborationService');
const { addNotification } = require('../services/notificationDashboardService');
const { verifyToken } = require('../services/authService');
const { hasPermission } = require('../services/rbacService');
const { trackPresence, removeUserPresence } = require('./livePresenceService');

const activeConnections = new Map(); // Store active connections per user
const rateLimit = new Map(); // For rate limiting user actions

/**
 * Initializes the WebSocket server.
 * @param {object} server - The HTTP server instance.
 * @returns {WebSocket.Server} - The WebSocket server instance.
 */
const startSocketServer = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/collaboration' });

    console.log('WebSocket server initialized for collaboration.');

    wss.on('connection', async (ws, req) => {
        try {
            const token = req.headers['authorization']?.split(' ')[1];
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

            // Track the connection
            if (!activeConnections.has(userId)) {
                activeConnections.set(userId, []);
            }
            activeConnections.get(userId).push(ws);
            trackPresence(userId);

            // Handle messages from clients
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

                    // RBAC Check
                    if (!hasPermission(userId, `socket:${parsedMessage.event}`)) {
                        ws.send(JSON.stringify({ error: 'Permission denied for this action.' }));
                        return;
                    }

                    // Process the event
                    const response = await handleCollaborationEvent(parsedMessage.event, parsedMessage.data);
                    ws.send(JSON.stringify({ event: parsedMessage.event, data: response }));
                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({ error: 'An error occurred while processing the message.' }));
                }
            });

            // Handle connection close
            ws.on('close', () => {
                console.log(`Client disconnected: ${userId}`);
                const connections = activeConnections.get(userId) || [];
                activeConnections.set(userId, connections.filter((conn) => conn !== ws));
                if (activeConnections.get(userId).length === 0) {
                    activeConnections.delete(userId);
                    removeUserPresence(userId);
                }
            });

            // Handle connection error
            ws.on('error', (error) => {
                console.error(`WebSocket error for user: ${userId}`, error);
            });
        } catch (error) {
            console.error('Error during connection initialization:', error);
            ws.close();
        }
    });

    wss.on('error', (error) => {
        console.error('Global WebSocket error:', error);
    });

    // Heartbeat ping-pong mechanism
    setInterval(() => {
        activeConnections.forEach((connections, userId) => {
            connections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            });
        });
    }, 30000);

    return wss;
};

/**
 * Sends a notification to a specific user.
 * @param {string} userId - The ID of the user to notify.
 * @param {object} notification - The notification payload.
 */
const sendNotificationToUser = (userId, notification) => {
    const connections = activeConnections.get(userId) || [];
    connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'notification', data: notification }));
        }
    });
};

/**
 * Broadcasts a notification to all connected users.
 * @param {object} notification - The notification payload.
 */
const broadcastNotification = (notification) => {
    activeConnections.forEach((connections) => {
        connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'notification', data: notification }));
            }
        });
    });
};

/**
 * Triggers a notification and sends it to a specific user.
 * @param {string} userId - The ID of the user.
 * @param {string} type - The type of the notification.
 * @param {string} message - The notification message.
 * @param {object} data - Additional notification data.
 */
const triggerNotification = async (userId, type, message, data) => {
    try {
        const notification = await addNotification(userId, type, message, data);
        sendNotificationToUser(userId, notification);
    } catch (error) {
        console.error('Error triggering notification:', error);
    }
};

/**
 * Forcefully disconnects a specific user (admin only).
 * @param {string} userId - The ID of the user to disconnect.
 */
const forceDisconnectUser = (userId) => {
    const connections = activeConnections.get(userId) || [];
    connections.forEach((ws) => ws.close());
    activeConnections.delete(userId);
    console.log(`Admin forcibly disconnected user: ${userId}`);
};

/**
 * Checks if a user has exceeded the message rate limit.
 * @param {string} userId - The ID of the user.
 * @returns {boolean} - Whether the user is rate-limited.
 */
const isRateLimited = (userId) => {
    const userLimit = rateLimit.get(userId) || { count: 0, startTime: Date.now() };
    const elapsed = Date.now() - userLimit.startTime;

    if (elapsed > 1000) {
        rateLimit.set(userId, { count: 1, startTime: Date.now() });
        return false;
    }

    userLimit.count += 1;
    rateLimit.set(userId, userLimit);
    return userLimit.count > 10;
};

/**
 * Parses and validates an incoming WebSocket message.
 * @param {string} message - The raw message.
 * @returns {object|null} - The parsed message or null if invalid.
 */
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
    forceDisconnectUser,
};
