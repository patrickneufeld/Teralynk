const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { recordActivity } = require('./activityLogService');

// Directory to store files
const STORAGE_PATH = path.join(__dirname, '../../storage');

// Upload file to the server
const uploadFile = async (fileBuffer, fileName, userId) => {
    const fileId = uuidv4();
    const filePath = path.join(STORAGE_PATH, `${fileId}_${fileName}`);
    
    await fs.writeFile(filePath, fileBuffer);
    await recordActivity(userId, 'uploadFile', filePath, { fileName });

    return { fileId, filePath };
};

// Retrieve file from the server
const getFile = async (fileId) => {
    const files = await fs.readdir(STORAGE_PATH);
    const file = files.find((file) => file.startsWith(fileId));
    
    if (!file) throw new Error('File not found.');
    
    const filePath = path.join(STORAGE_PATH, file);
    return await fs.readFile(filePath);
};

module.exports = { uploadFile, getFile };
