import apiClient from './apiClient';

// Create a webhook
export const createWebhook = async (webhookData) => {
    const response = await apiClient.post('/webhooks', webhookData);
    return response.data;
};

// Get all webhooks
export const getWebhooks = async () => {
    const response = await apiClient.get('/webhooks');
    return response.data;
};

// Delete a webhook
export const deleteWebhook = async (webhookId) => {
    const response = await apiClient.delete(`/webhooks/${webhookId}`);
    return response.data;
};
