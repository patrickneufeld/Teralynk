// File Path: backend/services/collaborationFileVersioningService.js

const { v4: uuidv4 } = require('uuid'); // For generating unique version IDs
const fs = require('fs');
const path = require('path');

const fileVersions = new Map(); // Stores file versions indexed by fileId

/**
 * Creates a new version of a file.
 * @param {string} fileId - The ID of the file to version.
 * @param {string} userId - The ID of the user creating the version.
 * @param {string} fileContent - The content of the file to save as a version.
 * @param {string} fileName - The name of the file.
 * @returns {object} - The details of the newly created file version.
 */
const createFileVersion = (fileId, userId, fileContent, fileName) => {
    if (!fileId || !userId || !fileContent || !fileName) {
        throw new Error('File ID, User ID, file content, and file name are required.');
    }

    const versionId = uuidv4();
    const versionData = {
        versionId,
        userId,
        fileName,
        fileContent,
        createdAt: new Date(),
    };

    if (!fileVersions.has(fileId)) {
        fileVersions.set(fileId, []);
    }

    fileVersions.get(fileId).push(versionData);

    console.log(`New version created for file ${fileId} by user ${userId}. Version ID: ${versionId}`);

    return versionData;
};

/**
 * Retrieves all versions of a file.
 * @param {string} fileId - The ID of the file.
 * @returns {Array} - An array of file versions.
 */
const getFileVersions = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required to get file versions.');
    }

    return fileVersions.get(fileId) || [];
};

/**
 * Retrieves the latest version of a file.
 * @param {string} fileId - The ID of the file.
 * @returns {object|null} - The latest file version or null if no versions exist.
 */
const getLatestFileVersion = (fileId) => {
    const versions = getFileVersions(fileId);
    return versions.length ? versions[versions.length - 1] : null;
};

/**
 * Rolls back a file to a specific version.
 * @param {string} fileId - The ID of the file.
 * @param {string} versionId - The ID of the version to roll back to.
 * @returns {object} - The rolled-back version data.
 */
const rollbackFileVersion = (fileId, versionId) => {
    if (!fileId || !versionId) {
        throw new Error('File ID and version ID are required to rollback.');
    }

    const versions = getFileVersions(fileId);
    const versionToRollback = versions.find((version) => version.versionId === versionId);

    if (!versionToRollback) {
        throw new Error('Version not found.');
    }

    console.log(`Rolling back file ${fileId} to version ${versionId}`);

    return versionToRollback;
};

/**
 * Deletes a specific version of a file.
 * @param {string} fileId - The ID of the file.
 * @param {string} versionId - The ID of the version to delete.
 * @returns {boolean} - True if the version was deleted, false otherwise.
 */
const deleteFileVersion = (fileId, versionId) => {
    if (!fileId || !versionId) {
        throw new Error('File ID and version ID are required to delete a version.');
    }

    const versions = fileVersions.get(fileId);
    if (!versions) {
        throw new Error('File not found.');
    }

    const versionIndex = versions.findIndex((version) => version.versionId === versionId);
    if (versionIndex === -1) {
        throw new Error('Version not found.');
    }

    versions.splice(versionIndex, 1);
    console.log(`Version ${versionId} deleted for file ${fileId}`);

    return true;
};

/**
 * Compares two versions of a file.
 * @param {string} fileId - The ID of the file.
 * @param {string} versionId1 - The ID of the first version.
 * @param {string} versionId2 - The ID of the second version.
 * @returns {object} - The differences between the two versions.
 */
const compareFileVersions = (fileId, versionId1, versionId2) => {
    const versions = getFileVersions(fileId);
    const version1 = versions.find((version) => version.versionId === versionId1);
    const version2 = versions.find((version) => version.versionId === versionId2);

    if (!version1 || !version2) {
        throw new Error('One or both versions not found.');
    }

    // Simple comparison logic, you can implement more sophisticated diff algorithms
    const differences = {
        addedContent: version2.fileContent.replace(version1.fileContent, ''),
        removedContent: version1.fileContent.replace(version2.fileContent, ''),
    };

    console.log(`Compared versions ${versionId1} and ${versionId2} for file ${fileId}`);

    return differences;
};

/**
 * Saves the file version content to a file (optional persistence layer).
 * @param {string} fileId - The ID of the file.
 * @param {string} versionId - The ID of the version to save.
 */
const saveVersionToFile = (fileId, versionId) => {
    const version = getFileVersions(fileId).find((v) => v.versionId === versionId);
    if (!version) {
        throw new Error('Version not found.');
    }

    const filePath = path.join(__dirname, `../../fileVersions/${fileId}_${versionId}.txt`);
    fs.writeFileSync(filePath, version.fileContent);
    console.log(`Version ${versionId} for file ${fileId} saved to ${filePath}`);
};

module.exports = {
    createFileVersion,
    getFileVersions,
    getLatestFileVersion,
    rollbackFileVersion,
    deleteFileVersion,
    compareFileVersions,
    saveVersionToFile,
};
