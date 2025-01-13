// File Path: frontend/src/api/storage.js

import apiClient from './apiClient';

// Get storage usage
export const getStorageUsage = async () => {
    const response = await apiClient.get('/storage/usage');
    return response.data;
};

// Upgrade storage
export const upgradeStorage = async (platformId) => {
    const response = await apiClient.post(`/storage/upgrade/${platformId}`);
    return response.data;
};

// Check storage limits
export const checkStorageLimits = async () => {
    const response = await apiClient.get('/storage/limits');
    return response.data;
};
