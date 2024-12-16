// File: /Users/patrick/Projects/Teralynk/frontend/src/api/fileService.js

import axios from 'axios';

// Set up the base API URL for all file operations
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/files';

// Function to fetch the list of files
export const fetchFiles = async (continuationToken = null) => {
    try {
        const response = await axios.get(`${API_URL}/list`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT token
            },
            params: {
                continuationToken,
            },
        });
        return response.data;
    } catch (err) {
        console.error('Error fetching files:', err);
        throw new Error('Error fetching files');
    }
};

// Function to upload a file
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT token
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (err) {
        console.error('Error uploading file:', err);
        throw new Error('Error uploading file');
    }
};

// Function to generate a signed URL for downloading a file
export const generateFileLink = async (fileName) => {
    try {
        const response = await axios.post(`${API_URL}/generate-link`, { fileName }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT token
            },
        });
        return response.data.url;
    } catch (err) {
        console.error('Error generating signed URL:', err);
        throw new Error('Error generating signed URL');
    }
};

// Function to delete a file
export const deleteFile = async (fileName) => {
    try {
        const response = await axios.post(`${API_URL}/delete`, { fileName }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT token
            },
        });
        return response.data;
    } catch (err) {
        console.error('Error deleting file:', err);
        throw new Error('Error deleting file');
    }
};
