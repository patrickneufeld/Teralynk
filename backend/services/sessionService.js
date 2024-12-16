const Redis = require('redis'); // File: /backend/services/sessionService.js
const jwt = require('jsonwebtoken'); // File: /backend/services/sessionService.js
const dotenv = require('dotenv'); // File: /backend/services/sessionService.js

// Load environment variables
dotenv.config();

// Connect to Redis
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Add a token to the blacklist (revoking the token)
const blacklistToken = async (token) => {
    const decoded = jwt.decode(token); // Decode the token to get expiration time
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000); // Calculate remaining time until expiration

    // Store token in Redis with expiration time
    await redisClient.set(token, 'blacklisted', 'EX', expiresIn);
};

// Check if a token is blacklisted
const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(token);
    return result !== null; // If the token is found in Redis, it is blacklisted
};

// Validate user session by checking if the token is blacklisted
const validateSession = async (token) => {
    try {
        // Check if the token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
            throw new Error('Token has been revoked');
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // File: /backend/services/sessionService.js

        // If the token is valid, check the session in the database
        const result = await query('SELECT * FROM user_sessions WHERE user_id = $1', [decoded.userId]); // File: /backend/services/db.js

        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }

        return decoded; // Return the decoded token if session is valid
    } catch (error) {
        throw new Error('Invalid session.');
    }
};

module.exports = { validateSession, blacklistToken, isTokenBlacklisted };
