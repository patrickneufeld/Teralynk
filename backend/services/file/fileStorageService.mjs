// File: /backend/services/fileStorageService.js

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { recordActivity } = require('../activityLogService');

// Directory to store files
const STORAGE_PATH = path.join(__dirname, '../../storage');

// **Ensure the storage directory exists**
const ensureStorageDirectory = async () => {
    try {
        await fs.mkdir(STORAGE_PATH, { recursive: true });
        console.log(`Storage directory ensured: ${STORAGE_PATH}`);
    } catch (error) {
        console.error(`Error creating storage directory: ${STORAGE_PATH}`, error);
        throw new Error('Failed to create storage directory.');
    }
};
ensureStorageDirectory();

// **Upload file to the server**
const uploadFile = async (fileBuffer, fileName, userId) => {
    try {
        const fileId = uuidv4();
        const filePath = path.join(STORAGE_PATH, `${fileId}_${fileName}`);
        
        await fs.writeFile(filePath, fileBuffer);
        await recordActivity(userId, 'uploadFile', filePath, { fileName });

        console.log(`File uploaded successfully: ${filePath}`);
        return { fileId, filePath };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file.');
    }
};

// **Retrieve file from the server**
const getFile = async (fileId, userId) => {
    try {
        const files = await fs.readdir(STORAGE_PATH);
        const file = files.find((file) => file.startsWith(fileId));
        
        if (!file) throw new Error('File not found.');

        const filePath = path.join(STORAGE_PATH, file);
        await recordActivity(userId, 'getFile', filePath, { fileId });

        console.log(`File retrieved: ${filePath}`);
        return await fs.readFile(filePath);
    } catch (error) {
        console.error('Error retrieving file:', error);
        throw new Error('Failed to retrieve file.');
    }
};

// **Delete a file from the server**
const deleteFile = async (fileId, userId) => {
    try {
        const files = await fs.readdir(STORAGE_PATH);
        const file = files.find((file) => file.startsWith(fileId));

        if (!file) throw new Error('File not found.');

        const filePath = path.join(STORAGE_PATH, file);
        await fs.unlink(filePath);
        await recordActivity(userId, 'deleteFile', filePath, { fileId });

        console.log(`File deleted successfully: ${filePath}`);
        return { message: 'File deleted successfully', fileId };
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error('Failed to delete file.');
    }
};

// **List all files for a user**
const listUserFiles = async (userId) => {
    try {
        const files = await fs.readdir(STORAGE_PATH);
        const userFiles = files.filter((file) => file.includes(userId));

        console.log(`Files listed for user ${userId}:`, userFiles);
        return userFiles.map((file) => ({
            fileId: file.split('_')[0],
            fileName: file.split('_').slice(1).join('_'),
        }));
    } catch (error) {
        console.error('Error listing user files:', error);
        throw new Error('Failed to list user files.');
    }
};

// **Generate a file path for download**
const generateFilePath = (fileId) => {
    return path.join(STORAGE_PATH, fileId);
};

module.exports = {
    uploadFile,
    getFile,
    deleteFile,
    listUserFiles,
    generateFilePath,
};
