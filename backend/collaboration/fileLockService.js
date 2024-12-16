const activeFileLocks = new Map();

const lockFile = (fileId, userId) => {
    if (!fileId || !userId) throw new Error('File ID and User ID are required.');
    activeFileLocks.set(fileId, { lockedBy: userId, lockedAt: new Date() });
    return { fileId, lockedBy: userId, lockedAt: new Date() };
};

const unlockFile = (fileId) => {
    if (!fileId) throw new Error('File ID is required.');
    activeFileLocks.delete(fileId);
    return { message: 'File unlocked successfully.', fileId };
};

const isFileLocked = (fileId) => {
    return activeFileLocks.has(fileId);
};

module.exports = { lockFile, unlockFile, isFileLocked };
