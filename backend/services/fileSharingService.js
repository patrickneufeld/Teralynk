// File: /Users/patrick/Projects/Teralynk/backend/services/fileSharingService.js

const fs = require('fs');
const path = require('path');
const shortid = require('shortid'); // For generating secure shareable links
const uuid = require('uuid'); // For generating unique identifiers
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');

// In-memory store for shared files (replace with database for production)
const sharedFilesStore = {};

// Generate a secure shareable link for a file
const generateShareableLink = async (filePath, userId, permissions = 'view', expiration = null) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }

    if (!hasPermission(userId, 'share')) {
        throw new Error('You do not have permission to share files.');
    }

    const fileId = uuid.v4();
    const shareId = shortid.generate();

    const shareData = {
        fileId,
        shareId,
        filePath,
        userId,
        permissions,
        expiration: expiration ? new Date(expiration) : null,
        createdAt: new Date(),
    };

    sharedFilesStore[shareId] = shareData;

    // Log activity
    await recordActivity(userId, 'generateShareableLink', filePath, { shareId });

    console.log(`Shareable link created for file: ${filePath}`);
    return { shareId, link: `https://teralynk.com/share/${shareId}`, ...shareData };
};

// Retrieve shared file information using the share ID
const getSharedFile = async (shareId, userId) => {
    const shareData = sharedFilesStore[shareId];

    if (!shareData) {
        throw new Error('Invalid or expired share ID.');
    }

    if (shareData.userId !== userId && !hasPermission(userId, 'admin')) {
        throw new Error('You do not have permission to access this shared file.');
    }

    // Check expiration
    if (shareData.expiration && new Date() > shareData.expiration) {
        delete sharedFilesStore[shareId]; // Cleanup expired link
        throw new Error('This link has expired.');
    }

    return shareData;
};

// Delete a shareable link
const deleteShareableLink = async (shareId, userId) => {
    const shareData = sharedFilesStore[shareId];

    if (!shareData) {
        throw new Error('Invalid share ID.');
    }

    if (shareData.userId !== userId && !hasPermission(userId, 'admin')) {
        throw new Error('You do not have permission to delete this shared link.');
    }

    delete sharedFilesStore[shareId];

    // Log activity
    await recordActivity(userId, 'deleteShareableLink', shareData.filePath, { shareId });

    console.log(`Shareable link deleted: ${shareId}`);
    return { message: 'Shareable link deleted successfully.' };
};

// List all active shareable links for a file
const listShareableLinks = async (filePath, userId) => {
    if (!hasPermission(userId, 'read')) {
        throw new Error('You do not have permission to view shareable links.');
    }

    const links = Object.values(sharedFilesStore).filter(
        (shareData) =>
            shareData.filePath === filePath &&
            (!shareData.expiration || new Date() <= shareData.expiration)
    );

    return links;
};

module.exports = {
    generateShareableLink,
    getSharedFile,
    deleteShareableLink,
    listShareableLinks,
};
