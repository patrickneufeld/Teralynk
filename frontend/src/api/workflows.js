import apiClient from './apiClient';

// Create a new workflow
export const createWorkflow = async (workflowData) => {
    const response = await apiClient.post('/workflows', workflowData);
    return response.data;
};

// List workflows
export const listWorkflows = async () => {
    const response = await apiClient.get('/workflows');
    return response.data;
};

// Get workflow details
export const getWorkflowDetails = async (workflowId) => {
    const response = await apiClient.get(`/workflows/${workflowId}`);
    return response.data;
};

// Update workflow
export const updateWorkflow = async (workflowId, updatedData) => {
    const response = await apiClient.put(`/workflows/${workflowId}`, updatedData);
    return response.data;
};

// Delete workflow
export const deleteWorkflow = async (workflowId) => {
    const response = await apiClient.delete(`/workflows/${workflowId}`);
    return response.data;
};

// Start workflow
export const startWorkflow = async (workflowId) => {
    const response = await apiClient.post(`/workflows/${workflowId}/start`);
    return response.data;
};

// Stop workflow
export const stopWorkflow = async (workflowId) => {
    const response = await apiClient.post(`/workflows/${workflowId}/stop`);
    return response.data;
};
