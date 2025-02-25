// File Path: frontend/src/api/analytics.js

import apiClient from './apiClient';

// Get application analytics data
export const getAnalyticsData = async () => {
    const response = await apiClient.get('/analytics');
    return response.data;
};

// Get user activity stats
export const getUserActivityStats = async () => {
    const response = await apiClient.get('/analytics/activity');
    return response.data;
};
