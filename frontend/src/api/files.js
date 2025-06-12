// File Path: frontend/src/api/file.js

import apiClient from './apiClient';

// Upload a file
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
};

// List all files
export const listFiles = async () => {
    const response = await apiClient.get('/files');
    return response.data;
};

// Download a file
export const downloadFile = async (fileId) => {
    const response = await apiClient.get(`/files/${fileId}`, {
        responseType: 'blob', // Important for downloading files
    });

    return response.data;
};

// Delete a file
export const deleteFile = async (fileId) => {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
};

// Share a file with another user
export const shareFile = async (fileId, recipientEmail) => {
    const response = await apiClient.post(`/files/share`, {
        fileId,
        recipientEmail,
    });

    return response.data;
};
