const Redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

redisClient.connect().catch(console.error);

// Set a value in the cache
const setCache = async (key, value, ttl = 3600) => {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
};

// Get a value from the cache
const getCache = async (key) => {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
};

// Delete a key from the cache
const deleteCache = async (key) => {
    await redisClient.del(key);
};

module.exports = { setCache, getCache, deleteCache };
