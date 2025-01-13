// File Path: frontend/src/api/aiTools.js

import apiClient from './apiClient';

// Fetch available AI tools
export const getAITools = async () => {
    const response = await apiClient.get('/ai-tools');
    return response.data;
};

// Submit AI query
export const submitAIQuery = async (query, tools) => {
    const response = await apiClient.post('/ai/query', { query, tools });
    return response.data;
};

// Save AI result
export const saveAIResult = async (result) => {
    const response = await apiClient.post('/ai/results', result);
    return response.data;
};

// Get saved AI results
export const getSavedAIResults = async () => {
    const response = await apiClient.get('/ai/results');
    return response.data;
};
