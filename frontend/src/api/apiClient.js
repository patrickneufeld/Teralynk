// File Path: frontend/src/api/apiClient.js

import axios from 'axios';

// Default API URL (either from environment variable or localhost)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
