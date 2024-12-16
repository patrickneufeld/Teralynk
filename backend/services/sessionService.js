const { query } = require('./db');
const { verifyToken } = require('./authenticationService');

// Validate user session
const validateSession = async (token) => {
    try {
        const decoded = verifyToken(token);
        const result = await query('SELECT * FROM user_sessions WHERE user_id = $1', [decoded.userId]);

        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }

        return decoded;
    } catch (error) {
        throw new Error('Invalid session.');
    }
};

module.exports = { validateSession };
