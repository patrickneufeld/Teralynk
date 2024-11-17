// File: /backend/server.js

const express = require('express');
const http = require('http'); // Required to integrate WebSocket with Express
const { setupNotificationWebSocket } = require('./api/notification');

const app = express();

// Middleware
app.use(express.json());

// Import API routes
const notificationRoutes = require('./api/notification').router;
app.use('/api/notifications', notificationRoutes);

// Create HTTP server
const server = http.createServer(app);

// Integrate WebSocket with the HTTP server
setupNotificationWebSocket(server);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server is listening at ws://localhost:${PORT}/ws/notifications`);
});
