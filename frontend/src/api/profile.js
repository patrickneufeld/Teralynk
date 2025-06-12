// File Path: frontend/src/api/profile.js

import apiClient from './apiClient';

// Get user profile
export const getProfile = async () => {
    const response = await apiClient.get('/profile');
    return response.data;
};

// Update user profile
export const updateProfile = async (updatedProfileData) => {
    const response = await apiClient.put('/profile', updatedProfileData);
    return response.data;
};
