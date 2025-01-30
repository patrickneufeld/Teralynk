// File Path: frontend/src/api/folder.js

import apiClient from './apiClient';

// Create a new folder
export const createFolder = async (folderName, parentFolderId = null) => {
    const response = await apiClient.post('/folders', {
        folderName,
        parentFolderId,
    });
    return response.data;
};

// Fetch all folders
export const listFolders = async () => {
    const response = await apiClient.get('/folders');
    return response.data;
};

// Fetch folder details
export const getFolderDetails = async (folderId) => {
    const response = await apiClient.get(`/folders/${folderId}`);
    return response.data;
};

// Update folder details (e.g., rename folder)
export const updateFolder = async (folderId, updatedData) => {
    const response = await apiClient.put(`/folders/${folderId}`, updatedData);
    return response.data;
};

// Delete a folder
export const deleteFolder = async (folderId) => {
    const response = await apiClient.delete(`/folders/${folderId}`);
    return response.data;
};

// Fetch folder permissions
export const getFolderPermissions = async (folderId) => {
    const response = await apiClient.get(`/folder-permissions/${folderId}`);
    return response.data;
};

// Update folder permissions
export const updateFolderPermissions = async (folderId, permissions) => {
    const response = await apiClient.put(`/folder-permissions/${folderId}`, { permissions });
    return response.data;
};
