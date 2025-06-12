// File: /backend/services/notificationDashboardService.js

const { v4: uuidv4 } = require('uuid');
const { query } = require('../db'); // Database integration
const { recordActivity } = require('../activityLogService');

// **Add a new notification for a user**
const addNotification = async (userId, type, message, data = {}) => {
    if (!userId || !type || !message) {
        throw new Error('User ID, type, and message are required to add a notification.');
    }

    const notification = {
        id: uuidv4(),
        type,
        message,
        data,
        timestamp: new Date(),
        read: false,
    };

    try {
        // Insert notification into the database
        await query(
            `INSERT INTO user_notifications (id, user_id, type, message, data, timestamp, read) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [notification.id, userId, type, message, JSON.stringify(data), notification.timestamp, notification.read]
        );

        // Log activity for adding a notification
        await recordActivity(userId, 'addNotification', null, { message });

        console.log(`Notification added for user ${userId}: ${message}`);
        return notification;
    } catch (error) {
        console.error('Error adding notification:', error);
        throw new Error('Failed to add notification.');
    }
};

// **Get all notifications for a user**
const getNotifications = async (userId) => {
    try {
        const result = await query(
            'SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY timestamp DESC',
            [userId]
        );

        return result.rows.map((row) => ({
            id: row.id,
            type: row.type,
            message: row.message,
            data: JSON.parse(row.data),
            timestamp: row.timestamp,
            read: row.read,
        }));
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        throw new Error('Failed to retrieve notifications.');
    }
};

// **Mark a notification as read**
const markAsRead = async (userId, notificationId) => {
    try {
        // Find the notification by user and notification ID
        const result = await query(
            'SELECT * FROM user_notifications WHERE user_id = $1 AND id = $2',
            [userId, notificationId]
        );

        if (result.rows.length === 0) {
            throw new Error(`Notification ${notificationId} not found for user ${userId}`);
        }

        // Mark the notification as read
        await query(
            'UPDATE user_notifications SET read = $1 WHERE id = $2',
            [true, notificationId]
        );

        // Log activity for marking as read
        await recordActivity(userId, 'markAsRead', null, { notificationId });

        console.log(`Notification ${notificationId} marked as read for user ${userId}`);
        return { message: `Notification ${notificationId} marked as read.` };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read.');
    }
};

// **Clear all notifications for a user**
const clearNotifications = async (userId) => {
    try {
        // Delete notifications from the database
        await query('DELETE FROM user_notifications WHERE user_id = $1', [userId]);

        // Log activity for clearing notifications
        await recordActivity(userId, 'clearNotifications', null, { message: 'All notifications cleared' });

        console.log(`All notifications cleared for user ${userId}`);
        return { message: 'All notifications cleared successfully.' };
    } catch (error) {
        console.error('Error clearing notifications:', error);
        throw new Error('Failed to clear notifications.');
    }
};

// **Automatically expire notifications after a certain period (e.g., 7 days)**
const expireOldNotifications = async () => {
    try {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - 7); // Set expiration to 7 days ago

        await query(
            'DELETE FROM user_notifications WHERE timestamp < $1',
            [expirationDate]
        );

        console.log('Expired notifications cleared.');
    } catch (error) {
        console.error('Error expiring old notifications:', error);
        throw new Error('Failed to expire old notifications.');
    }
};

// **Get the count of unread notifications for a user**
const getUnreadCount = async (userId) => {
    try {
        const result = await query(
            'SELECT COUNT(*) AS unread_count FROM user_notifications WHERE user_id = $1 AND read = false',
            [userId]
        );

        return { unreadCount: parseInt(result.rows[0].unread_count, 10) };
    } catch (error) {
        console.error('Error retrieving unread notifications count:', error);
        throw new Error('Failed to retrieve unread notifications count.');
    }
};

module.exports = {
    addNotification,
    getNotifications,
    markAsRead,
    clearNotifications,
    expireOldNotifications,
    getUnreadCount,
};
