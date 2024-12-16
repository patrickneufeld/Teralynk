const { query } = require('./db');

// Fetch user activity data (e.g., usage statistics)
const getUserActivityData = async (userId) => {
    const result = await query(
        'SELECT * FROM activity_log WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
        [userId]
    );

    return result.rows;
};

// Generate a report of system activity
const generateSystemActivityReport = async () => {
    const result = await query(
        'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 100'
    );

    return result.rows;
};

module.exports = { getUserActivityData, generateSystemActivityReport };
