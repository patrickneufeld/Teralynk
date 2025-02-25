// ✅ FILE: frontend/src/api/apiClient.js

import axios from 'axios';

// ✅ Ensure environment variables load correctly
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api/v1';

// ✅ Debugging Log
console.log('✅ API Client Initialized with Base URL:', API_BASE_URL);

// ✅ Configure axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,  // Base URL for the API
    headers: {
        'Content-Type': 'application/json',  // Default content type for requests
    },
    timeout: 10000, // Set a timeout of 10 seconds to avoid hanging requests
});

// ✅ Add an interceptor for handling errors
apiClient.interceptors.response.use(
    (response) => response, // Return response if successful
    (error) => {
        console.error('❌ API Request Failed:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
