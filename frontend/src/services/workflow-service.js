import apiClient from '../api/api-client';
import { handleApiResponse, createApiError } from '../utils/api-helpers';

export const getWorkflows = async () => {
    console.log('Fetching workflows from API');
    try {
        const response = await apiClient.get('/workflows');
        return handleApiResponse(response);
    } catch (error) {
        throw createApiError(error);
    }
};

export const createWorkflow = async (workflowData) => {
    try {
        const response = await apiClient.post('/workflows', workflowData);
        return handleApiResponse(response);
    } catch (error) {
        throw createApiError(error);
    }
};