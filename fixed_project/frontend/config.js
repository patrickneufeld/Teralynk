// File Path: frontend/config.js

// Ensure that the environment variable is correctly set and fallback to a secure default if not.
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com/api';

// Note: Replace 'https://api.example.com/api' with the actual production API URL.
// Ensure that the environment variables are correctly configured in the deployment environment.