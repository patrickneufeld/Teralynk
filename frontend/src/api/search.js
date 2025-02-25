// File Path: frontend/src/api/search.js

import apiClient from './apiClient';

// Search data
export const searchData = async (query) => {
    const response = await apiClient.get(`/search?q=${query}`);
    return response.data;
};
