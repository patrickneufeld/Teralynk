// File Path: backend/services/fileLockService.js

const { v4: uuidv4 } = require('uuid'); // For unique lock IDs
const logger = require('../config/logger'); // Centralized logger for auditing

// In-memory store for active locks (Replace with a database or Redis for production)
const activeFileLocks = new Map();

/**
 * 1️⃣ Lock a file for a specific user.
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

    const lockId = uuidv4();
    const lockDetails = {
        lockId,
        lockedBy: userId,
        lockedAt: new Date(),
        timeout: timeout
            ? setTimeout(() => unlockFile(fileId, true), timeout) // Auto-unlock after timeout
            : null,
    };

    activeFileLocks.set(fileId, lockDetails);
    logger.info(`File locked: ${fileId} by ${userId}`, lockDetails);

    return { fileId, lockId, lockedBy: userId, lockedAt: lockDetails.lockedAt };
};

/**
 * 2️⃣ Unlock a file.
 * @param {string} fileId - The ID of the file to unlock.
 * @param {boolean} autoUnlock - Indicates if the unlock was triggered by a timeout.
 * @returns {object} - Success message and file ID.
 */
const unlockFile = (fileId, autoUnlock = false) => {
    if (!fileId) {
        throw new Error('File ID is required.');
    }

    const lockDetails = activeFileLocks.get(fileId);
    if (!lockDetails) {
        throw new Error(`File ${fileId} is not locked.`);
    }

    if (lockDetails.timeout) {
        clearTimeout(lockDetails.timeout); // Clear timeout if set
    }

    activeFileLocks.delete(fileId);
    logger.info(`File unlocked: ${fileId}`, { autoUnlock, lockedBy: lockDetails.lockedBy });
    return { message: 'File unlocked successfully.', fileId, autoUnlock };
};

/**
 * 3️⃣ Check if a file is locked.
 * @param {string} fileId - The ID of the file to check.
 * @returns {object} - Lock status and details if locked.
 */
const isFileLocked = (fileId) => {
    if (!fileId) {
        throw new Error('File ID is required.');
    }

    const lockDetails = activeFileLocks.get(fileId);
    logger.info(`Checked lock status for file ${fileId}:`, { isLocked: !!lockDetails, lockDetails });
    return { isLocked: !!lockDetails, lockDetails: lockDetails || null };
};

/**
 * 4️⃣ Get details of a locked file.
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

    logger.info(`Lock details retrieved for file ${fileId}:`, lockDetails);
    return lockDetails;
};

/**
 * 5️⃣ Extend the lock timeout for a file.
 * @param {string} fileId - The ID of the file to extend the lock.
 * @param {number} newTimeout - New timeout duration in milliseconds.
 * @returns {object} - Updated lock details.
 */
const extendLockTimeout = (fileId, newTimeout) => {
    if (!fileId || !newTimeout) {
        throw new Error('File ID and new timeout duration are required.');
    }

    const lockDetails = activeFileLocks.get(fileId);
    if (!lockDetails) {
        throw new Error(`File ${fileId} is not locked.`);
    }

    if (lockDetails.timeout) {
        clearTimeout(lockDetails.timeout); // Clear existing timeout
    }

    lockDetails.timeout = setTimeout(() => unlockFile(fileId, true), newTimeout);
    logger.info(`Extended lock timeout for file ${fileId}:`, { newTimeout });

    return lockDetails;
};

/**
 * 6️⃣ List all active locks with optional pagination.
 * @param {number} page - The page number (default: 1).
 * @param {number} limit - The number of items per page (default: 10).
 * @returns {object} - Paginated list of active locks.
 */
const listActiveLocks = (page = 1, limit = 10) => {
    const allLocks = Array.from(activeFileLocks.values());
    const startIndex = (page - 1) * limit;
    const paginatedLocks = allLocks.slice(startIndex, startIndex + limit);

    logger.info(`Listed active locks for page ${page} with limit ${limit}`);
    return {
        locks: paginatedLocks,
        total: allLocks.length,
        page,
        totalPages: Math.ceil(allLocks.length / limit),
    };
};

/**
 * 7️⃣ Clear all active locks (Admin only).
 * @returns {object} - Success message with the count of cleared locks.
 */
const clearLocks = () => {
    const totalLocks = activeFileLocks.size;
    activeFileLocks.clear();
    logger.warn(`Cleared all active locks. Total locks cleared: ${totalLocks}`);
    return { message: 'All locks cleared successfully.', totalLocks };
};

module.exports = { 
    lockFile, 
    unlockFile, 
    isFileLocked, 
    getLockDetails, 
    extendLockTimeout, 
    listActiveLocks, 
    clearLocks 
};
