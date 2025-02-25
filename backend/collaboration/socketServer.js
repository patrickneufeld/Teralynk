// File Path: backend/collaboration/socketServer.js

const WebSocket = require('ws');
const { handleCollaborationEvent } = require('../services/collaborationService');
const { addNotification } = require('../services/notificationDashboardService');
const { verifyToken } = require('../services/authService');
const { hasPermission } = require('../services/rbacService');
const { trackPresence, removeUserPresence } = require('./livePresenceService');
const logger = require('../config/logger'); // Centralized logger

const activeConnections = new Map(); // Store active connections per user
const rateLimit = new Map(); // For rate limiting user actions

/**
 * Initializes the WebSocket server.
 * @param {object} server - The HTTP server instance.
 * @returns {WebSocket.Server} - The WebSocket server instance.
 */
const startSocketServer = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/collaboration' });

    logger.info('WebSocket server initialized for collaboration.');

    wss.on('connection', async (ws, req) => {
        try {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                ws.close();
                logger.warn('Connection rejected: No token provided.');
                return;
            }

            const user = await verifyToken(token);
            if (!user) {
                ws.close();
                logger.warn('Connection rejected: Invalid token.');
                return;
            }

            const userId = user.id;
            logger.info(`New client connected: ${userId}`);

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
                        ws.send(
                            JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' })
                        );
                        return;
                    }

                    const parsedMessage = parseMessage(message);
                    if (!parsedMessage) {
                        ws.send(JSON.stringify({ error: 'Invalid message format.' }));
                        return;
                    }

                    // RBAC Check
                    if (!hasPermission(userId, `socket:${parsedMessage.event}`)) {
                        ws.send(
                            JSON.stringify({ error: 'Permission denied for this action.' })
                        );
                        return;
                    }

                    // Process the event
                    const response = await handleCollaborationEvent(
                        parsedMessage.event,
                        parsedMessage.data
                    );
                    ws.send(
                        JSON.stringify({ event: parsedMessage.event, data: response })
                    );
                } catch (error) {
                    logger.error('Error processing message:', error);
                    ws.send(
                        JSON.stringify({ error: 'An error occurred while processing the message.' })
                    );
                }
            });

            // Handle connection close
            ws.on('close', () => {
                logger.info(`Client disconnected: ${userId}`);
                const connections = activeConnections.get(userId) || [];
                activeConnections.set(userId, connections.filter((conn) => conn !== ws));
                if (activeConnections.get(userId).length === 0) {
                    activeConnections.delete(userId);
                    removeUserPresence(userId);
                }
            });

            // Handle connection error
            ws.on('error', (error) => {
                logger.error(`WebSocket error for user: ${userId}`, error);
            });
        } catch (error) {
            logger.error('Error during connection initialization:', error);
            ws.close();
        }
    });

    wss.on('error', (error) => {
        logger.error('Global WebSocket error:', error);
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

    // Graceful shutdown
    process.on('SIGTERM', () => {
        logger.info('Shutting down WebSocket server...');
        wss.clients.forEach((ws) => ws.close());
        wss.close();
        logger.info('WebSocket server shut down.');
    });

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
        logger.error('Error parsing message:', error);
        return null;
    }
};

module.exports = {
    startSocketServer,
    sendNotificationToUser,
    broadcastNotification,
};
