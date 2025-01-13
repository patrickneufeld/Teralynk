// File Path: frontend/src/api/notifications.js

export const getNotifications = async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
};
