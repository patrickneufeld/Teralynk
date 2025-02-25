// File Path: frontend/src/api.js

import axios from 'axios';

// Load API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create an Axios instance with default settings
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized! Redirecting to login...');
            // Redirect user to login page or handle token expiration
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Export reusable API functions
const api = {
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return await apiClient.post('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    generateFileLink: async (fileName) => {
        return await apiClient.post('/api/files/generate-link', { fileName });
    },

    listFiles: async (continuationToken = null, maxKeys = 10) => {
        const params = { continuationToken, maxKeys };
        return await apiClient.get('/api/files/list', { params });
    },
};

export default api;
