// File Path: /frontend/src/api/storage.js

import apiClient from './apiClient'; // Ensure this import is correct

// Get storage usage
export const getStorageUsage = async () => {
    try {
        const response = await apiClient.get('/storage/usage');
        return response.data;
    } catch (error) {
        console.error("Error fetching storage usage:", error);
        throw error;  // Rethrow error to handle it elsewhere in your app
    }
};

// Upgrade storage
export const upgradeStorage = async (platformId) => {
    try {
        const response = await apiClient.post(`/storage/upgrade/${platformId}`);
        return response.data;
    } catch (error) {
        console.error("Error upgrading storage:", error);
        throw error;
    }
};

// Check storage limits
export const checkStorageLimits = async () => {
    try {
        const response = await apiClient.get('/storage/limits');
        return response.data;
    } catch (error) {
        console.error("Error checking storage limits:", error);
        throw error;
    }
};
