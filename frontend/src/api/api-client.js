import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';

console.log('Initializing API client with base URL:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API request failed:', error);
        return Promise.reject(error);
    }
);

export default apiClient;