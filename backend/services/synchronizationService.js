// File: /backend/services/synchronizationService.js

const fs = require('fs');
const path = require('path');
const { recordActivity } = require('./activityLogService'); // For activity logging
const { detectAndResolveConflicts } = require('./versioningService'); // Conflict resolution
const { sendNotification } = require('./notificationService'); // Notifications
const WebSocket = require('ws'); // For real-time sync across devices

// In-memory synchronization queue (replace with a database for production)
const syncQueue = [];
const offlineChanges = {}; // Track offline changes per user and file

// Add a file to the synchronization queue
const queueFileForSync = async (filePath, userId, changes, platform, isOffline = false) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    const syncTask = {
        filePath,
        userId,
        changes,
        platform, // Desktop, Mobile, Web
        timestamp: new Date(),
    };

    if (isOffline) {
        // Store offline changes locally for the user
        if (!offlineChanges[userId]) {
            offlineChanges[userId] = {};
        }
        offlineChanges[userId][filePath] = syncTask;
        console.log(`[${platform}] Offline change logged for file: ${filePath}`);
        return syncTask;
    }

    syncQueue.push(syncTask);

    // Log the activity
    await recordActivity(userId, 'queueSync', filePath, { changes, platform });

    console.log(`[${platform}] File queued for synchronization: ${filePath}`);
    return syncTask;
};

// Process the synchronization queue
const processSyncQueue = async () => {
    while (syncQueue.length > 0) {
        const task = syncQueue.shift();
        const { filePath, userId, changes, platform } = task;

        try {
            console.log(`[${platform}] Processing synchronization for file: ${filePath}`);

            // Detect and resolve conflicts
            const conflictResolution = await detectAndResolveConflicts(filePath, userId, changes);

            if (conflictResolution.conflict) {
                // Notify user about conflicts
                await sendNotification(userId, {
                    type: 'syncConflict',
                    message: `Conflicts detected while synchronizing file: ${path.basename(filePath)} on ${platform}`,
                    data: conflictResolution.options,
                });

                console.log(`Conflicts detected for file: ${filePath}`);
                continue; // Skip to the next task
            }

            // Simulate synchronization (e.g., upload to cloud, update local copies)
            console.log(`[${platform}] File synchronized successfully: ${filePath}`);

            // Log the activity
            await recordActivity(userId, 'syncComplete', filePath, { changes, platform });
        } catch (error) {
            console.error(`[${platform}] Error processing sync for file: ${filePath}`, error);
            await sendNotification(userId, {
                type: 'syncError',
                message: `An error occurred while synchronizing file: ${path.basename(filePath)} on ${platform}`,
            });
        }
    }

    console.log('Synchronization queue processed.');
};

// Sync offline changes when user reconnects
const syncOfflineChanges = async (userId, platform) => {
    if (!offlineChanges[userId]) {
        console.log(`No offline changes for user: ${userId}`);
        return;
    }

    console.log(`[${platform}] Synchronizing offline changes for user: ${userId}`);

    const userOfflineChanges = offlineChanges[userId];
    for (const filePath in userOfflineChanges) {
        const task = userOfflineChanges[filePath];
        await queueFileForSync(task.filePath, task.userId, task.changes, task.platform);
    }

    // Clear offline changes for the user
    delete offlineChanges[userId];
    console.log(`[${platform}] Offline changes synchronized for user: ${userId}`);
};

// Monitor a directory for changes
const monitorDirectory = (directoryPath, userId, platform) => {
    if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`);
    }

    console.log(`[${platform}] Monitoring directory for changes: ${directoryPath}`);

    fs.watch(directoryPath, { recursive: true }, async (eventType, fileName) => {
        const filePath = path.join(directoryPath, fileName);

        if (!fs.existsSync(filePath) || eventType !== 'change') {
            return;
        }

        console.log(`[${platform}] Change detected in file: ${filePath}`);

        // Automatically queue file for synchronization
        await queueFileForSync(filePath, userId, { changeType: eventType }, platform);
    });
};

// Real-time synchronization via WebSocket
const setupRealTimeSync = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/sync' });

    console.log('WebSocket server for real-time sync initialized.');

    wss.on('connection', (ws, req) => {
        const userId = req.url.split('?userId=')[1]; // Extract userId from the query string

        if (!userId) {
            console.error('Connection rejected: No userId provided.');
            ws.close();
            return;
        }

        console.log(`Real-time sync WebSocket connected for user: ${userId}`);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                const { filePath, changes, platform } = data;

                console.log(`Real-time sync request from user: ${userId}, file: ${filePath}`);
                await queueFileForSync(filePath, userId, changes, platform);
            } catch (error) {
                console.error('Error in WebSocket message processing:', error);
                ws.send(JSON.stringify({ error: 'Invalid sync request.' }));
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket connection closed for user: ${userId}`);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user: ${userId}`, error);
        });
    });
};

module.exports = {
    queueFileForSync,
    processSyncQueue,
    syncOfflineChanges,
    monitorDirectory,
    setupRealTimeSync,
};
