// File: /backend/services/cacheService.js

const Redis = require('redis');
const dotenv = require('dotenv');
const { recordActivity } = require('../activityLogService');

dotenv.config();

// **Initialize Redis client**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

// **Connect to Redis with error handling**
redisClient.connect().catch((error) => {
    console.error('Error connecting to Redis:', error);
    throw new Error('Failed to connect to Redis.');
});

// **Set a value in the cache**
const setCache = async (key, value, ttl = 3600, userId = null) => {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        if (userId) {
            await recordActivity(userId, 'setCache', null, { key, ttl });
        }
        console.log(`Cache set for key: ${key}`);
    } catch (error) {
        console.error('Error setting cache value:', error);
        throw new Error('Failed to set cache value.');
    }
};

// **Get a value from the cache**
const getCache = async (key, userId = null) => {
    try {
        const value = await redisClient.get(key);
        if (userId) {
            await recordActivity(userId, 'getCache', null, { key });
        }
        console.log(`Cache retrieved for key: ${key}`);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Error getting cache value:', error);
        throw new Error('Failed to get cache value.');
    }
};

// **Delete a key from the cache**
const deleteCache = async (key, userId = null) => {
    try {
        await redisClient.del(key);
        if (userId) {
            await recordActivity(userId, 'deleteCache', null, { key });
        }
        console.log(`Cache deleted for key: ${key}`);
    } catch (error) {
        console.error('Error deleting cache value:', error);
        throw new Error('Failed to delete cache value.');
    }
};

// **Clear all keys in the cache**
const clearCache = async (userId = null) => {
    try {
        await redisClient.flushDb();
        if (userId) {
            await recordActivity(userId, 'clearCache', null, { message: 'All cache cleared.' });
        }
        console.log('All cache cleared.');
    } catch (error) {
        console.error('Error clearing cache:', error);
        throw new Error('Failed to clear cache.');
    }
};

// **Exported methods**
module.exports = {
    setCache,
    getCache,
    deleteCache,
    clearCache,
};
