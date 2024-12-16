const { Client } = require('pg');
const axios = require('axios');

// Check the health of the database
const checkDatabaseHealth = async () => {
    const client = new Client();
    try {
        await client.connect();
        await client.query('SELECT 1');
        client.end();
        return { status: 'healthy' };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};

// Check the health of external APIs (for example, a third-party service)
const checkApiHealth = async (url) => {
    try {
        await axios.get(url);
        return { status: 'healthy' };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
};

module.exports = { checkDatabaseHealth, checkApiHealth };
