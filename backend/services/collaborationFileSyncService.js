// File Path: backend/services/collaborationFileSyncService.js

const fs = require('fs');
const path = require('path');

// In-memory store for file synchronization state (replace with DB in production)
const fileSyncState = new Map();

/**
 * Syncs a file for a specific collaboration session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} fileId - The ID of the file being synced.
 * @param {string} userId - The ID of the user syncing the file.
 * @param {string} fileContent - The content of the file to sync.
 * @returns {object} - The updated file sync state.
 */
const syncFile = (sessionId, fileId, userId, fileContent) => {
    if (!sessionId || !fileId || !userId || !fileContent) {
        throw new Error('Session ID, File ID, User ID, and File Content are required to sync the file.');
    }

    if (!fileSyncState.has(sessionId)) {
        fileSyncState.set(sessionId, new Map());
    }

    const sessionSyncState = fileSyncState.get(sessionId);

    if (!sessionSyncState.has(fileId)) {
        sessionSyncState.set(fileId, {
            lastSyncedContent: fileContent,
            syncUsers: new Set(),
        });
    }

    const fileSync = sessionSyncState.get(fileId);
    fileSync.syncUsers.add(userId);
    fileSync.lastSyncedContent = fileContent;

    console.log(`File ${fileId} synced for session ${sessionId} by user ${userId}.`);
    return fileSync;
};

/**
 * Gets the latest synced content of a file in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} fileId - The ID of the file to retrieve content for.
 * @returns {string} - The latest synced content of the file.
 */
const getSyncedFileContent = (sessionId, fileId) => {
    if (!sessionId || !fileId) {
        throw new Error('Session ID and File ID are required to get the synced file content.');
    }

    const sessionSyncState = fileSyncState.get(sessionId);
    if (!sessionSyncState || !sessionSyncState.has(fileId)) {
        throw new Error(`File ${fileId} not found in session ${sessionId}.`);
    }

    const fileSync = sessionSyncState.get(fileId);
    console.log(`Retrieved synced content for file ${fileId} in session ${sessionId}.`);
    return fileSync.lastSyncedContent;
};

/**
 * Resolves conflicts between file versions in a session.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} fileId - The ID of the file to resolve conflicts for.
 * @returns {string} - The resolved content after conflict resolution.
 */
const resolveFileSyncConflicts = (sessionId, fileId) => {
    if (!sessionId || !fileId) {
        throw new Error('Session ID and File ID are required to resolve file sync conflicts.');
    }

    const sessionSyncState = fileSyncState.get(sessionId);
    if (!sessionSyncState || !sessionSyncState.has(fileId)) {
        throw new Error(`File ${fileId} not found in session ${sessionId}.`);
    }

    const fileSync = sessionSyncState.get(fileId);
    if (fileSync.syncUsers.size === 1) {
        return fileSync.lastSyncedContent;
    }

    // Simple conflict resolution strategy: concatenate file content
    let resolvedContent = '';
    fileSync.syncUsers.forEach((userId) => {
        resolvedContent += `User ${userId} content: ${fileSync.lastSyncedContent}\n`;
    });

    console.log(`Conflict resolved for file ${fileId} in session ${sessionId}.`);
    return resolvedContent;
};

/**
 * Clears the sync state for a specific session and file.
 * @param {string} sessionId - The ID of the collaboration session.
 * @param {string} fileId - The ID of the file to clear sync state for.
 */
const clearFileSyncState = (sessionId, fileId) => {
    if (!sessionId || !fileId) {
        throw new Error('Session ID and File ID are required to clear the file sync state.');
    }

    const sessionSyncState = fileSyncState.get(sessionId);
    if (!sessionSyncState || !sessionSyncState.has(fileId)) {
        throw new Error(`File ${fileId} not found in session ${sessionId}.`);
    }

    sessionSyncState.delete(fileId);
    console.log(`Sync state cleared for file ${fileId} in session ${sessionId}.`);
};

module.exports = {
    syncFile,
    getSyncedFileContent,
    resolveFileSyncConflicts,
    clearFileSyncState,
};
