// File: /backend/services/fileSharingService.js

const fs = require('fs').promises;
const path = require('path');
const shortid = require('shortid'); // For generating secure shareable links
const uuid = require('uuid'); // For generating unique identifiers
const { recordActivity } = require('../activityLogService');
const { hasPermission } = require('../common/rbacService');
const { query } = require('../db'); // For interacting with the database

// **Database table for shared files**
const SHARED_FILES_TABLE = 'shared_files'; // Replace with actual table name

// **Generate a secure shareable link for a file**
const generateShareableLink = async (filePath, userId, permissions = 'view', expiration = null) => {
    try {
        const fileExists = await fs.stat(filePath).catch(() => false);
        if (!fileExists) {
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

        await query(
            `INSERT INTO ${SHARED_FILES_TABLE} (fileId, shareId, filePath, userId, permissions, expiration, createdAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [fileId, shareId, filePath, userId, permissions, expiration, new Date()]
        );

        await recordActivity(userId, 'generateShareableLink', filePath, { shareId });

        console.log(`Shareable link created for file: ${filePath}`);
        return { shareId, link: `https://teralynk.com/share/${shareId}`, ...shareData };
    } catch (error) {
        console.error('Error generating shareable link:', error);
        throw new Error('An error occurred while generating a shareable link.');
    }
};

// **Retrieve shared file information using the share ID**
const getSharedFile = async (shareId, userId) => {
    try {
        const result = await query(
            `SELECT * FROM ${SHARED_FILES_TABLE} WHERE shareId = $1`,
            [shareId]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid or expired share ID.');
        }

        const shareData = result.rows[0];

        if (shareData.userId !== userId && !hasPermission(userId, 'admin')) {
            throw new Error('You do not have permission to access this shared file.');
        }

        if (shareData.expiration && new Date() > new Date(shareData.expiration)) {
            await query(
                `DELETE FROM ${SHARED_FILES_TABLE} WHERE shareId = $1`,
                [shareId]
            );
            throw new Error('This link has expired.');
        }

        return shareData;
    } catch (error) {
        console.error('Error retrieving shared file:', error);
        throw new Error('An error occurred while retrieving the shared file.');
    }
};

// **Delete a shareable link**
const deleteShareableLink = async (shareId, userId) => {
    try {
        const result = await query(
            `SELECT * FROM ${SHARED_FILES_TABLE} WHERE shareId = $1`,
            [shareId]
        );

        if (result.rows.length === 0) {
            throw new Error('Invalid share ID.');
        }

        const shareData = result.rows[0];

        if (shareData.userId !== userId && !hasPermission(userId, 'admin')) {
            throw new Error('You do not have permission to delete this shared link.');
        }

        await query(
            `DELETE FROM ${SHARED_FILES_TABLE} WHERE shareId = $1`,
            [shareId]
        );

        await recordActivity(userId, 'deleteShareableLink', shareData.filePath, { shareId });

        console.log(`Shareable link deleted: ${shareId}`);
        return { message: 'Shareable link deleted successfully.' };
    } catch (error) {
        console.error('Error deleting shareable link:', error);
        throw new Error('An error occurred while deleting the shareable link.');
    }
};

// **List all active shareable links for a file**
const listShareableLinks = async (filePath, userId) => {
    try {
        if (!hasPermission(userId, 'read')) {
            throw new Error('You do not have permission to view shareable links.');
        }

        const result = await query(
            `SELECT * FROM ${SHARED_FILES_TABLE} WHERE filePath = $1 AND (expiration IS NULL OR expiration > NOW())`,
            [filePath]
        );

        console.log(`Shareable links retrieved for file: ${filePath}`);
        return result.rows;
    } catch (error) {
        console.error('Error listing shareable links:', error);
        throw new Error('An error occurred while listing shareable links.');
    }
};

module.exports = {
    generateShareableLink,
    getSharedFile,
    deleteShareableLink,
    listShareableLinks,
};
