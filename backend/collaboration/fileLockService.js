// File Path: backend/services/fileLockService.js

const activeFileLocks = new Map();

/**
 * Lock a file for a specific user.
 * @param {string} fileId - The ID of the file to lock.
 * @param {string} userId - The ID of the user locking the file.
 * @param {number} timeout - Optional timeout for the lock in milliseconds.
 * @returns {object} - Details of the file lock.
 */
const lockFile = (fileId, userId, timeout = null) => {
    if (!fileId || !userId) {
        throw new Error('File ID and User ID are required.');
    }

    if (activeFileLocks.has(fileId)) {
        throw new Error(`File ${fileId} is already locked.`);
    }

    const lockDetails = {
        lockedBy: userId,
        lockedAt: new Date(),
        timeout: timeout ? setTimeout(() => unlockFile(fileId), timeout) : null,
    };

    activeFileLocks.set(fileId, lockDetails);
    console.log(`File locked:`, lockDetails);

    return { fileId, lockedBy: userId, lockedAt: lockDetails.lockedAt };
};

/**
 * Unlock a file.
 * @param {string} fileId - The ID of the file to unlock.
 * @returns {object} - Success message and file ID.
 */
const unlockFile = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required.');
    }

    const lockDetails = activeFileLocks.get(fileId);
    if (!lockDetails) {
        throw new Error(`File ${fileId} is not locked.`);
    }

    if (lockDetails.timeout) {
        clearTimeout(lockDetails.timeout); // Clear timeout if a lock timeout was set
    }

    activeFileLocks.delete(fileId);
    console.log(`File unlocked: ${fileId}`);
    return { message: 'File unlocked successfully.', fileId };
};

/**
 * Check if a file is locked.
 * @param {string} fileId - The ID of the file to check.
 * @returns {boolean} - True if the file is locked, false otherwise.
 */
const isFileLocked = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required.');
    }

    const isLocked = activeFileLocks.has(fileId);
    console.log(`File ${fileId} is locked: ${isLocked}`);
    return isLocked;
};

/**
 * Get details of a locked file.
 * @param {string} fileId - The ID of the file to retrieve lock details.
 * @returns {object|null} - Lock details or null if the file is not locked.
 */
const getLockDetails = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required.');
    }

    const lockDetails = activeFileLocks.get(fileId);
    if (!lockDetails) {
        throw new Error(`File ${fileId} is not locked.`);
    }

    console.log(`Lock details for file ${fileId}:`, lockDetails);
    return lockDetails;
};

module.exports = { lockFile, unlockFile, isFileLocked, getLockDetails };
