import axios from 'axios';

// Set up the base API URL for all file operations
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/files';

// Helper function to retrieve and attach the JWT token
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`, // JWT token
});

// Helper function for error handling
const handleApiError = (err, action) => {
    console.error(`Error ${action}:`, err.response?.data || err.message);
    throw new Error(err.response?.data?.error || `Error ${action}`);
};

// Function to fetch the list of files
export const fetchFiles = async (continuationToken = null) => {
    try {
        const response = await axios.get(`${API_URL}/list`, {
            headers: getAuthHeaders(),
            params: {
                continuationToken,
            },
        });
        return response.data;
    } catch (err) {
        handleApiError(err, 'fetching files');
    }
};

// Function to upload a file
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (err) {
        handleApiError(err, 'uploading file');
    }
};

// Function to generate a signed URL for downloading a file
export const generateFileLink = async (fileName) => {
    try {
        const response = await axios.post(`${API_URL}/generate-link`, { fileName }, {
            headers: getAuthHeaders(),
        });
        return response.data?.url;
    } catch (err) {
        handleApiError(err, 'generating signed URL');
    }
};

// Function to delete a file
export const deleteFile = async (fileName) => {
    try {
        const response = await axios.post(`${API_URL}/delete`, { fileName }, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (err) {
        handleApiError(err, 'deleting file');
    }
};
