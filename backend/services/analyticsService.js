// File: /backend/services/analyticsService.js

const { query } = require('./db');
const { recordActivity } = require('./activityLogService');

/**
 * Fetch user activity data (e.g., usage statistics).
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - A list of user activity logs.
 */
const getUserActivityData = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to fetch activity data.');
    }

    try {
        const result = await query(
            'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
            [userId]
        );

        console.log(`Retrieved activity data for user ${userId}`);
        await recordActivity(userId, 'getUserActivityData', null, { count: result.rows.length });

        return result.rows;
    } catch (error) {
        console.error('Error fetching user activity data:', error.message);
        throw new Error('An error occurred while retrieving user activity data.');
    }
};

/**
 * Generate a report of system-wide activity.
 * @param {string} adminId - The ID of the admin requesting the report.
 * @returns {Promise<Array>} - A list of system-wide activity logs.
 */
const generateSystemActivityReport = async (adminId) => {
    if (!adminId) {
        throw new Error('Admin ID is required to generate system activity report.');
    }

    try {
        const result = await query(
            'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100'
        );

        console.log('System activity report generated.');
        await recordActivity(adminId, 'generateSystemActivityReport', null, { count: result.rows.length });

        return result.rows;
    } catch (error) {
        console.error('Error generating system activity report:', error.message);
        throw new Error('An error occurred while generating system activity report.');
    }
};

module.exports = { getUserActivityData, generateSystemActivityReport };
