// File Path: frontend/services/storageService.js

import axios from 'axios';

const API_URL = '/api/storage';

export const getStorageUsage = async () => {
    return axios.get(API_URL);
};

export const upgradeStorage = async (platformId) => {
    return axios.post(`${API_URL}/upgrade`, { platformId });
};
