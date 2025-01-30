import apiClient from './apiClient';

export const getWorkflows = async () => {
    console.debug('Starting workflow fetch request');
    const abortController = new AbortController();
    let timeoutId;
    console.log('Starting workflow fetch request');
    console.log('Fetching workflows from API');
    try {
        // Log request attempt
        console.log('Initiating workflow fetch request');
        timeoutId = setTimeout(() => abortController.abort(), 5000);
        const response = await apiClient.get('/workflows', {
            signal: abortController.signal
        });
        clearTimeout(timeoutId);
        console.log('Workflow API Response:', response);

        if (!response.data?.success) {
            throw new Error(response.data?.error || 'Failed to fetch workflows');
        }

        const workflows = response.data?.data;
        if (!Array.isArray(workflows)) {
            throw new Error('Invalid workflow data received from server');
        }

        clearTimeout(timeoutId);
        return workflows;
    } catch (error) {
        console.error('Error fetching workflows:', error);
        throw error;
    }
};

export const createWorkflow = async (workflowData) => {
    try {
        const response = await apiClient.post('/workflows', workflowData);
        return response.data.data || [];
    } catch (error) {
        console.error('Error creating workflow:', error);
        throw error;
    }
};