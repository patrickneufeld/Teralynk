// File Path: frontend/src/api/credentials.js

import apiClient from './apiClient';

// Save credentials
export const saveCredentials = async (credentials) => {
    const response = await apiClient.post('/credentials', credentials);
    return response.data;
};

// Get credentials
export const getCredentials = async () => {
    const response = await apiClient.get('/credentials');
    return response.data;
};

// Update credentials
export const updateCredentials = async (credentialsId, updatedData) => {
    const response = await apiClient.put(`/credentials/${credentialsId}`, updatedData);
    return response.data;
};

// Delete credentials
export const deleteCredentials = async (credentialsId) => {
    const response = await apiClient.delete(`/credentials/${credentialsId}`);
    return response.data;
};
