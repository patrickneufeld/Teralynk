// File Path: backend/services/collaborationFileLockService.js

const fileLocks = new Map();

/**
 * Locks a file for a specific user during a collaboration session.
 * @param {string} fileId - The ID of the file to lock.
 * @param {string} userId - The ID of the user who is locking the file.
 * @param {string} sessionId - The ID of the collaboration session.
 * @returns {object} - Details of the locked file.
 */
const lockFileForSession = (fileId, userId, sessionId) => {
    if (!fileId || !userId || !sessionId) {
        throw new Error('File ID, User ID, and Session ID are required to lock a file.');
    }

    if (fileLocks.has(fileId)) {
        throw new Error(`File ${fileId} is already locked by another user.`);
    }

    const lockDetails = {
        lockedBy: userId,
        sessionId,
        lockedAt: new Date(),
    };

    fileLocks.set(fileId, lockDetails);
    console.log(`File ${fileId} locked by user ${userId} in session ${sessionId}.`);
    return { fileId, lockedBy: userId, sessionId, lockedAt: lockDetails.lockedAt };
};

/**
 * Unlocks a file after collaboration.
 * @param {string} fileId - The ID of the file to unlock.
 * @returns {object} - Message indicating the file has been unlocked.
 */
const unlockFile = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required to unlock the file.');
    }

    if (!fileLocks.has(fileId)) {
        throw new Error(`File ${fileId} is not locked.`);
    }

    fileLocks.delete(fileId);
    console.log(`File ${fileId} unlocked.`);
    return { message: 'File unlocked successfully.', fileId };
};

/**
 * Checks if a file is locked.
 * @param {string} fileId - The ID of the file to check.
 * @returns {boolean} - Whether the file is locked.
 */
const isFileLocked = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required to check the lock status.');
    }

    const isLocked = fileLocks.has(fileId);
    console.log(`File ${fileId} is locked: ${isLocked}`);
    return isLocked;
};

/**
 * Gets the details of a locked file.
 * @param {string} fileId - The ID of the locked file.
 * @returns {object|null} - Lock details or null if the file is not locked.
 */
const getLockDetails = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required to get lock details.');
    }

    const lockDetails = fileLocks.get(fileId);
    if (!lockDetails) {
        return null;
    }

    console.log(`Lock details for file ${fileId}:`, lockDetails);
    return lockDetails;
};

/**
 * Clears all file locks for a specific session.
 * @param {string} sessionId - The ID of the session to clear locks for.
 */
const clearLocksForSession = (sessionId) => {
    if (!sessionId) {
        throw new Error('Session ID is required to clear locks.');
    }

    fileLocks.forEach((lockDetails, fileId) => {
        if (lockDetails.sessionId === sessionId) {
            fileLocks.delete(fileId);
            console.log(`File ${fileId} unlocked for session ${sessionId}.`);
        }
    });
};

module.exports = {
    lockFileForSession,
    unlockFile,
    isFileLocked,
    getLockDetails,
    clearLocksForSession,
};
