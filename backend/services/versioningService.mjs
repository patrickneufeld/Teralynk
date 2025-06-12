// File: /backend/services/versioningService.js

const fs = require('fs').promises; // Use async fs methods
const path = require('path');
const uuid = require('uuid');
const { recordActivity } = require('./activityLogService');
const { analyzeFileContent } = require('./aiInsightsService');
const { hasPermission } = require('./common/rbacService');
const { query } = require('./db'); // Database integration

// **Validate file existence before proceeding**
const validateFileExists = async (filePath) => {
    try {
        await fs.stat(filePath); // Async file stat
        console.log(`File validated: ${filePath}`);
    } catch (error) {
        console.error(`File not found: ${filePath}`);
        throw new Error(`File does not exist: ${filePath}`);
    }
};

// **Save a new version of a file**
const saveFileVersion = async (filePath, userId, changes, metadata = {}) => {
    if (!filePath || !userId || !changes || !Array.isArray(changes)) {
        throw new Error('Invalid data for saving file version.');
    }

    await validateFileExists(filePath);

    if (!await hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to save file versions.');
    }

    const fileId = path.basename(filePath);
    const versionId = uuid.v4();

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

    try {
        await query(
            `INSERT INTO file_versions (file_id, version_id, user_id, changes, metadata, ai_suggestions, timestamp) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [fileId, versionId, userId, JSON.stringify(changes), JSON.stringify(metadata), JSON.stringify(aiSuggestions), new Date()]
        );

        await recordActivity(userId, 'saveVersion', filePath, { versionId });

        console.log(`New version saved for file: ${fileId}, versionId: ${versionId}`);
        return newVersion;
    } catch (error) {
        console.error('Error saving file version:', error.message);
        throw new Error('Failed to save file version.');
    }
};

// **Get version history for a file**
const getFileVersionHistory = async (filePath, userId) => {
    await validateFileExists(filePath);

    if (!await hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view version history.');
    }

    const fileId = path.basename(filePath);

    try {
        const result = await query(
            'SELECT * FROM file_versions WHERE file_id = $1 ORDER BY timestamp DESC',
            [fileId]
        );

        if (result.rows.length === 0) {
            throw new Error('No versions found for this file.');
        }

        return result.rows;
    } catch (error) {
        console.error('Error retrieving file version history:', error.message);
        throw new Error('Failed to retrieve file version history.');
    }
};

// **Retrieve the latest version of a file**
const getLatestFileVersion = async (filePath, userId) => {
    await validateFileExists(filePath);

    if (!await hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view the latest version.');
    }

    const fileId = path.basename(filePath);

    try {
        const result = await query(
            'SELECT * FROM file_versions WHERE file_id = $1 ORDER BY timestamp DESC LIMIT 1',
            [fileId]
        );

        if (result.rows.length === 0) {
            throw new Error('No version history available for this file.');
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error retrieving the latest file version:', error.message);
        throw new Error('Failed to retrieve the latest file version.');
    }
};

// **Rollback to a specific version**
const rollbackFileVersion = async (filePath, userId, versionId) => {
    await validateFileExists(filePath);

    if (!await hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to rollback file versions.');
    }

    const fileId = path.basename(filePath);

    try {
        const result = await query(
            'SELECT * FROM file_versions WHERE file_id = $1 AND version_id = $2',
            [fileId, versionId]
        );

        if (result.rows.length === 0) {
            throw new Error('Version not found.');
        }

        const targetVersion = result.rows[0];

        await recordActivity(userId, 'rollbackVersion', filePath, { versionId });

        console.log(`File ${fileId} rolled back to version: ${versionId}`);
        return targetVersion;
    } catch (error) {
        console.error('Error rolling back file version:', error.message);
        throw new Error('Failed to rollback file version.');
    }
};

// **Detect and resolve conflicts**
const detectAndResolveConflicts = async (filePath, userId, userChanges) => {
    await validateFileExists(filePath);

    if (!await hasPermission(userId, 'write')) {
        throw new Error('You do not have permission to resolve conflicts.');
    }

    const fileId = path.basename(filePath);

    try {
        const result = await query(
            'SELECT * FROM file_versions WHERE file_id = $1 ORDER BY timestamp DESC LIMIT 1',
            [fileId]
        );

        if (result.rows.length === 0) {
            throw new Error('No version history available for conflict detection.');
        }

        const latestVersion = result.rows[0];

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
    } catch (error) {
        console.error('Error detecting and resolving conflicts:', error.message);
        throw new Error('Failed to detect or resolve conflicts.');
    }
};

// **Merge changes intelligently**
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
