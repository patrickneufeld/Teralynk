// File Path: /Users/patrick/Projects/Teralynk/frontend/src/utils/auth.js

// Utility to get the authentication token from local storage or session
export const getAuthToken = () => {
    return localStorage.getItem('token') || null;
};
