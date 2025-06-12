// File Path: backend/src/api/collaborationRealTime.mjs

const express = require('express');
const { startSocketServer, broadcastNotification } = require('../services/socketServer');
const router = express.Router();

// WebSocket integration for collaboration
router.ws('/collaboration', (ws, req) => {
    ws.on('message', (message) => {
        // Handle real-time message
        console.log('Received message: ', message);
        // Broadcast message to all active connections
        broadcastNotification({ message });
    });

    ws.on('close', () => {
        console.log('Connection closed');
    });

    ws.send(JSON.stringify({ event: 'connected', message: 'Connected to the collaboration session.' }));
});

module.exports = router;
