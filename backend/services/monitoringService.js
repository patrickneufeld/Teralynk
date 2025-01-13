// File: /backend/services/monitoringService.js

const { Client } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const Redis = require('redis');

// **Load environment variables**
dotenv.config();

// **Redis Client Setup**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch((error) => {
    console.error('Error connecting to Redis for monitoring:', error.message);
});

// **Check the health of the PostgreSQL database**
const checkDatabaseHealth = async () => {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        return { status: 'healthy' };
    } catch (error) {
        console.error('Database health check failed:', error.message);
        return { status: 'unhealthy', error: error.message };
    }
};

// **Check the health of Redis cache**
const checkRedisHealth = async () => {
    try {
        const pingResponse = await redisClient.ping();
        if (pingResponse === 'PONG') {
            return { status: 'healthy' };
        }
        throw new Error('Unexpected Redis response.');
    } catch (error) {
        console.error('Redis health check failed:', error.message);
        return { status: 'unhealthy', error: error.message };
    }
};

// **Check the health of an external API (e.g., third-party service)**
const checkApiHealth = async (url) => {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.status === 200) {
            return { status: 'healthy' };
        }
        throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
        console.error(`API health check failed for ${url}:`, error.message);
        return { status: 'unhealthy', error: error.message };
    }
};

// **Overall system health status**
const getSystemHealthStatus = async () => {
    const databaseHealth = await checkDatabaseHealth();
    const redisHealth = await checkRedisHealth();
    const apiHealth = await checkApiHealth(process.env.EXTERNAL_API_URL || 'https://api.example.com/health');

    return {
        database: databaseHealth,
        redis: redisHealth,
        externalApi: apiHealth,
    };
};

module.exports = {
    checkDatabaseHealth,
    checkRedisHealth,
    checkApiHealth,
    getSystemHealthStatus,
};
