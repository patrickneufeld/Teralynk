// API helper functions
export const handleApiResponse = (response) => {
    if (!response.data?.success) {
        throw new Error(response.data?.error || 'API request failed');
    }
    return response.data.data;
};

export const createApiError = (error) => {
    console.error('API Error:', error);
    return new Error(error.response?.data?.error || error.message || 'Unknown error occurred');
};