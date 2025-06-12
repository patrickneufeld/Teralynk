// File: /backend/services/sessionService.js

const Redis = require('redis');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { query } = require('./db'); // Database integration for session validation

// **Load environment variables**
dotenv.config();

// **Connect to Redis**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch((error) => {
    console.error('Error connecting to Redis:', error);
    process.exit(1); // Exit if Redis connection fails
});

// **Add a token to the blacklist (revoking the token)**
const blacklistToken = async (token) => {
    if (!token) {
        throw new Error('Token is required to blacklist.');
    }

    try {
        const decoded = jwt.decode(token); // Decode token to get expiration time
        if (!decoded || !decoded.exp) {
            throw new Error('Invalid token format.');
        }

        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000); // Calculate remaining time
        if (expiresIn <= 0) {
            throw new Error('Token has already expired.');
        }

        // Store token in Redis with expiration time
        await redisClient.set(token, 'blacklisted', 'EX', expiresIn);
        console.log(`Token blacklisted successfully: ${token}`);
    } catch (error) {
        console.error('Error blacklisting token:', error.message);
        throw new Error('Failed to blacklist token.');
    }
};

// **Check if a token is blacklisted**
const isTokenBlacklisted = async (token) => {
    if (!token) {
        throw new Error('Token is required to check blacklist status.');
    }

    try {
        const result = await redisClient.get(token);
        return result !== null; // If token exists in Redis, it is blacklisted
    } catch (error) {
        console.error('Error checking token blacklist status:', error.message);
        throw new Error('Failed to check token blacklist status.');
    }
};

// **Validate user session**
const validateSession = async (token) => {
    if (!token) {
        throw new Error('Token is required to validate session.');
    }

    try {
        // Check if the token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
            throw new Error('Token has been revoked.');
        }

        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            throw new Error('Invalid token payload.');
        }

        // Check the session in the database
        const result = await query('SELECT * FROM user_sessions WHERE user_id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            throw new Error('Session not found.');
        }

        console.log(`Session validated for user: ${decoded.userId}`);
        return decoded; // Return decoded token if session is valid
    } catch (error) {
        console.error('Session validation failed:', error.message);
        throw new Error('Invalid session.');
    }
};

// **Cleanup expired tokens from Redis (optional background task)**
const cleanupExpiredTokens = async () => {
    try {
        const keys = await redisClient.keys('*');
        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            if (ttl <= 0) {
                await redisClient.del(key);
                console.log(`Expired token removed from Redis: ${key}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up expired tokens:', error.message);
    }
};

module.exports = {
    validateSession,
    blacklistToken,
    isTokenBlacklisted,
    cleanupExpiredTokens,
};
