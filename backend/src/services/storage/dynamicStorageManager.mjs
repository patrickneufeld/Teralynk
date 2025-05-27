//Users/patrick/Projects/Teralynk/backend/config/dynamicStorageManager.js
import fs from 'fs/promises';
import path from 'path';

/**
 * Dynamic Storage Manager
 * Handles storage configurations dynamically based on user settings.
 */
export function getStorageClient() {
    return {
        initialize: () => {
            console.log("⚡ dynamicStorageManager initialized.");
        },

        /**
         * Saves data to a specified storage location.
         * @param {string} filePath - The relative path to save the file.
         * @param {string|Buffer} data - The data to be saved.
         * @returns {Promise<void>} - Resolves when the file is saved successfully.
         * @throws {Error} - If there's an error saving the file.
         */
        saveToStorage: async (filePath, data) => {
            const fullPath = path.join(process.cwd(), 'storage', filePath);

            try {
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, data);
                console.log(`✅ File saved successfully at ${fullPath}`);
            } catch (err) {
                console.error(`❌ Error saving file: ${err.message}`);
                throw err;
            }
        },

        /**
         * Reads data from a specified storage location.
         * @param {string} filePath - The relative path to read the file from.
         * @returns {Promise<string|Buffer>} - Resolves with the file contents.
         * @throws {Error} - If there's an error reading the file.
         */
        readFromStorage: async (filePath) => {
            const fullPath = path.join(process.cwd(), 'storage', filePath);

            try {
                return await fs.readFile(fullPath);
            } catch (err) {
                console.error(`❌ Error reading file: ${err.message}`);
                throw err;
            }
        },

        /**
         * Deletes a file from the storage.
         * @param {string} filePath - The relative path to delete the file from.
         * @returns {Promise<void>} - Resolves when the file is deleted successfully.
         * @throws {Error} - If there's an error deleting the file.
         */
        deleteFromStorage: async (filePath) => {
            const fullPath = path.join(process.cwd(), 'storage', filePath);

            try {
                await fs.unlink(fullPath);
                console.log(`✅ File deleted successfully: ${fullPath}`);
            } catch (err) {
                console.error(`❌ Error deleting file: ${err.message}`);
                throw err;
            }
        }
    };
}
