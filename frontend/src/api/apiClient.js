// File Path: frontend/src/api/apiClient.js

import axios from 'axios';

// Get the backend API URL from environment variables or use a default URL for local development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create an axios instance with a default configuration for API requests
const apiClient = axios.create({
    baseURL: API_BASE_URL,  // Base URL for the API
    headers: {
        'Content-Type': 'application/json',  // Default content type for requests
    },
});

export default apiClient;
