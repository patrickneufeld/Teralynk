// File: /Users/patrick/Projects/Teralynk/backend/services/versioningService.js

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const { recordActivity } = require('./activityLogService');
const { analyzeFileContent } = require('./aiInsightsService');
const { hasPermission } = require('./rbacService');

// In-memory store for file versions (replace with database for production)
const fileVersions = {};

// Validate file existence before proceeding
const validateFileExists = async (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }
    console.log(`File validated: ${filePath}`);
};

// Save a new version of a file
const saveFileVersion = async (filePath, userId, changes, metadata = {}) => {
    if (!filePath || !userId || !changes || !Array.isArray(changes)) {
        throw new Error('Invalid data for saving file version.');
    }

    await validateFileExists(filePath);

    if (!hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to save file versions.');
    }

    const fileId = path.basename(filePath);
    const versionId = uuid.v4();

    if (!fileVersions[fileId]) {
        fileVersions[fileId] = [];
    }

    const aiSuggestions = await analyzeFileContent(filePath);

    const newVersion = {
        versionId,
        filePath,
        userId,
        changes,
        metadata,
        aiSuggestions, // AI-generated insights for this version
        timestamp: new Date(),
    };

    fileVersions[fileId].push(newVersion);

    // Log activity
    await recordActivity(userId, 'saveVersion', filePath, { versionId });

    console.log(`New version saved for file: ${fileId}, versionId: ${versionId}`);
    return newVersion;
};

// Get version history for a file
const getFileVersionHistory = async (filePath, userId) => {
    await validateFileExists(filePath);

    if (!hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view version history.');
    }

    const fileId = path.basename(filePath);

    if (!fileVersions[fileId]) {
        throw new Error('No versions found for this file.');
    }

    return fileVersions[fileId];
};

// Retrieve the latest version of a file
const getLatestFileVersion = async (filePath, userId) => {
    await validateFileExists(filePath);

    if (!hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view the latest version.');
    }

    const fileId = path.basename(filePath);

    if (!fileVersions[fileId] || fileVersions[fileId].length === 0) {
        throw new Error('No version history available for this file.');
    }

    return fileVersions[fileId][fileVersions[fileId].length - 1];
};

// Rollback to a specific version
const rollbackFileVersion = async (filePath, userId, versionId) => {
    await validateFileExists(filePath);

    if (!hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to rollback file versions.');
    }

    const fileId = path.basename(filePath);

    if (!fileVersions[fileId]) {
        throw new Error('No versions found for this file.');
    }

    const targetVersion = fileVersions[fileId].find((version) => version.versionId === versionId);

    if (!targetVersion) {
        throw new Error('Version not found.');
    }

    // Log activity
    await recordActivity(userId, 'rollbackVersion', filePath, { versionId });

    console.log(`File ${fileId} rolled back to version: ${versionId}`);
    return targetVersion;
};

// Detect and resolve conflicts
const detectAndResolveConflicts = async (filePath, userId, userChanges) => {
    await validateFileExists(filePath);

    if (!hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to resolve conflicts.');
    }

    const fileId = path.basename(filePath);

    if (!fileVersions[fileId] || fileVersions[fileId].length === 0) {
        throw new Error('No version history available for conflict detection.');
    }

    const latestVersion = fileVersions[fileId][fileVersions[fileId].length - 1];

    // Check for conflicts
    const hasConflict = latestVersion.changes.some((change) =>
        userChanges.some(
            (userChange) =>
                userChange.line === change.line && userChange.content !== change.content
        )
    );

    if (!hasConflict) {
        console.log('No conflicts detected.');
        return { conflict: false };
    }

    // Provide AI-based conflict resolution suggestions
    const aiSuggestions = await analyzeFileContent(filePath);

    console.log('Conflict detected for file:', fileId);
    return {
        conflict: true,
        options: {
            keepYourVersion: userChanges,
            useOtherVersion: latestVersion.changes,
            merge: mergeChanges(latestVersion.changes, userChanges),
            aiSuggestions,
        },
    };
};

// Merge changes intelligently
const mergeChanges = (existingChanges, newChanges) => {
    const merged = [...existingChanges];

    newChanges.forEach((newChange) => {
        const existingChangeIndex = merged.findIndex((change) => change.line === newChange.line);

        if (existingChangeIndex !== -1) {
            merged[existingChangeIndex] = {
                ...merged[existingChangeIndex],
                content: `<< Your Change: ${newChange.content} >> << Other Change: ${merged[existingChangeIndex].content} >>`,
            };
        } else {
            merged.push(newChange);
        }
    });

    return merged;
};

module.exports = {
    saveFileVersion,
    getFileVersionHistory,
    getLatestFileVersion,
    rollbackFileVersion,
    detectAndResolveConflicts,
    validateFileExists,
};
