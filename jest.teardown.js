// File Path: jest.teardown.js

const Redis = require('redis');

const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

module.exports = async () => {
    await redisClient.quit();
};
