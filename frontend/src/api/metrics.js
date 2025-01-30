// File Path: frontend/src/api/metrics.js

import apiClient from './apiClient';

// Fetch application performance metrics
export const getMetrics = async () => {
    const response = await apiClient.get('/metrics');
    return response.data;
};
