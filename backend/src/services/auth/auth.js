// File Path: frontend/src/api/authApi.js

import apiClient from '../../../../frontend/src/api/apiClient';

// User Signup
export const signup = async (email, password, name) => {
    const response = await apiClient.post('/auth/signup', { email, password, name });
    return response.data;
};

// Confirm Signup
export const confirmSignup = async (username, confirmationCode) => {
    const response = await apiClient.post('/auth/confirm-signup', { username, confirmationCode });
    return response.data;
};

// User Login
export const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
};

// Logout User
export const logout = async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
};

// Get Authentication Status
export const getStatus = async () => {
    const response = await apiClient.get('/auth/status');
    return response.data;
};
