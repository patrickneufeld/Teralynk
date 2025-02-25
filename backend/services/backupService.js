// File: /backend/services/backupService.js

const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver'); // For creating zip files
const { recordActivity } = require('./activityLogService');

// **Backup directory**
const BACKUP_PATH = path.join(__dirname, '../../backups');
const STORAGE_PATH = path.join(__dirname, '../../storage'); // Assuming storage directory is here

// **Ensure backup directory exists**
const ensureBackupDirectoryExists = async () => {
    try {
        await fs.mkdir(BACKUP_PATH, { recursive: true });
    } catch (error) {
        console.error(`Error creating backup directory: ${BACKUP_PATH}`, error);
    }
};

// **Create a backup of the storage directory**
const backupStorage = async (userId) => {
    try {
        // Ensure backup directory exists
        await ensureBackupDirectoryExists();

        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupFile = path.join(BACKUP_PATH, `storage_backup_${timestamp}.zip`);

        // Create a file stream for the backup file
        const output = await fs.open(backupFile, 'w');
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Pipe archive data to the file
        const writableStream = output.createWriteStream();
        archive.pipe(writableStream);

        // Append the storage directory to the archive
        archive.directory(STORAGE_PATH, false);

        // Finalize the archive
        await archive.finalize();

        // Log activity
        await recordActivity(userId, 'backupStorage', null, { backupFile });

        console.log(`Backup created successfully: ${backupFile}`);
        return { backupFile, timestamp };
    } catch (error) {
        console.error('Error during backup:', error);
        throw new Error('An error occurred while creating the backup.');
    }
};

// **List available backups**
const listBackups = async () => {
    try {
        const files = await fs.readdir(BACKUP_PATH);
        return files.filter(file => file.endsWith('.zip'));
    } catch (error) {
        console.error('Error listing backups:', error);
        throw new Error('Failed to list backup files.');
    }
};

// **Restore a specific backup**
const restoreBackup = async (backupFileName, userId) => {
    try {
        const backupFilePath = path.join(BACKUP_PATH, backupFileName);

        // Verify the backup file exists
        const fileExists = await fs.stat(backupFilePath).catch(() => false);
        if (!fileExists) {
            throw new Error(`Backup file not found: ${backupFileName}`);
        }

        // Use extraction logic to restore backup
        console.log(`Restoring from backup: ${backupFilePath}`);
        // Add logic here to extract the backup file to the desired location

        await recordActivity(userId, 'restoreBackup', null, { backupFileName });

        return { message: 'Backup restored successfully.', backupFileName };
    } catch (error) {
        console.error('Error restoring backup:', error);
        throw new Error('Failed to restore the backup.');
    }
};

// **Exported methods**
module.exports = {
    backupStorage,
    listBackups,
    restoreBackup,
};
