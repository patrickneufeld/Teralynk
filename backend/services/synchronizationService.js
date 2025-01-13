// File: /backend/services/synchronizationService.js

const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const WebSocket = require('ws');
const Redis = require('redis'); // Message queue for offline sync
const { recordActivity } = require('./activityLogService');
const { detectAndResolveConflicts } = require('./versioningService');
const { sendNotification } = require('./notificationService');
const { query } = require('./db'); // Database integration for storing sync tasks and changes

// **Initialize Redis for offline change syncing**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// **In-memory synchronization queue (replace with a message queue in production)**
const syncQueue = [];

// **Add a file to the synchronization queue**
const queueFileForSync = async (filePath, userId, changes, platform, isOffline = false) => {
    if (!filePath || !userId || !changes) {
        throw new Error('File path, user ID, and changes are required.');
    }

    const syncTask = {
        filePath,
        userId,
        changes,
        platform, // Desktop, Mobile, Web
        timestamp: new Date(),
    };

    try {
        if (isOffline) {
            await redisClient.set(`offline_sync:${userId}:${filePath}`, JSON.stringify(syncTask));
            console.log(`[${platform}] Offline change logged for file: ${filePath}`);
            return syncTask;
        }

        syncQueue.push(syncTask);
        await recordActivity(userId, 'queueSync', filePath, { changes, platform });
        console.log(`[${platform}] File queued for synchronization: ${filePath}`);
        return syncTask;
    } catch (error) {
        console.error('Error queueing sync task:', error.message);
        throw new Error('Failed to queue file for synchronization.');
    }
};

// **Process the synchronization queue**
const processSyncQueue = async () => {
    while (syncQueue.length > 0) {
        const task = syncQueue.shift();
        const { filePath, userId, changes, platform } = task;

        try {
            console.log(`[${platform}] Processing synchronization for file: ${filePath}`);

            const conflictResolution = await detectAndResolveConflicts(filePath, userId, changes);

            if (conflictResolution.conflict) {
                await sendNotification(userId, {
                    type: 'syncConflict',
                    message: `Conflicts detected for file: ${path.basename(filePath)} on ${platform}`,
                    data: conflictResolution.options,
                });

                console.log(`Conflicts detected for file: ${filePath}`);
                continue;
            }

            console.log(`[${platform}] File synchronized successfully: ${filePath}`);
            await recordActivity(userId, 'syncComplete', filePath, { changes, platform });
        } catch (error) {
            console.error(`[${platform}] Error processing sync for file: ${filePath}`, error.message);
            await sendNotification(userId, {
                type: 'syncError',
                message: `An error occurred while syncing file: ${path.basename(filePath)} on ${platform}`,
            });
        }
    }

    console.log('Synchronization queue processed.');
};

// **Sync offline changes when the user reconnects**
const syncOfflineChanges = async (userId, platform) => {
    try {
        const offlineFiles = await redisClient.keys(`offline_sync:${userId}:*`);

        if (offlineFiles.length === 0) {
            console.log(`No offline changes for user: ${userId}`);
            return;
        }

        console.log(`[${platform}] Synchronizing offline changes for user: ${userId}`);

        for (const fileKey of offlineFiles) {
            const offlineData = JSON.parse(await redisClient.get(fileKey));
            await queueFileForSync(offlineData.filePath, offlineData.userId, offlineData.changes, offlineData.platform);
            await redisClient.del(fileKey);
        }

        console.log(`[${platform}] Offline changes synchronized for user: ${userId}`);
    } catch (error) {
        console.error(`[${platform}] Error syncing offline changes for user: ${userId}`, error.message);
        throw new Error('Failed to sync offline changes.');
    }
};

// **Monitor a directory for changes**
const monitorDirectory = (directoryPath, userId, platform) => {
    console.log(`[${platform}] Monitoring directory for changes: ${directoryPath}`);

    fs.watch(directoryPath, { recursive: true }, async (eventType, fileName) => {
        const filePath = path.join(directoryPath, fileName);

        if (eventType !== 'change') {
            return;
        }

        console.log(`[${platform}] Change detected in file: ${filePath}`);
        await queueFileForSync(filePath, userId, { changeType: eventType }, platform);
    });
};

// **Real-time synchronization via WebSocket**
const setupRealTimeSync = (server) => {
    const wss = new WebSocket.Server({ server, path: '/ws/sync' });

    console.log('WebSocket server for real-time sync initialized.');

    wss.on('connection', (ws, req) => {
        const userId = new URLSearchParams(req.url.split('?')[1]).get('userId');

        if (!userId) {
            ws.close();
            console.error('Connection rejected: No userId provided.');
            return;
        }

        console.log(`Real-time sync WebSocket connected for user: ${userId}`);

        ws.on('message', async (message) => {
            try {
                const { filePath, changes, platform } = JSON.parse(message);
                console.log(`Real-time sync request from user: ${userId}, file: ${filePath}`);
                await queueFileForSync(filePath, userId, changes, platform);
            } catch (error) {
                console.error('WebSocket message processing error:', error.message);
                ws.send(JSON.stringify({ error: 'Invalid sync request.' }));
            }
        });

        ws.on('close', () => console.log(`WebSocket connection closed for user: ${userId}`));
        ws.on('error', (error) => console.error(`WebSocket error for user: ${userId}`, error.message));
    });
};

module.exports = {
    queueFileForSync,
    processSyncQueue,
    syncOfflineChanges,
    monitorDirectory,
    setupRealTimeSync,
};
