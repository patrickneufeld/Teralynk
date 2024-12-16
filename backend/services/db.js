const { Pool } = require('pg');
const dotenv = require('dotenv');

// **Load environment variables from .env file**
dotenv.config();

// **Set up your PostgreSQL connection pool**
const pool = new Pool({
    user: process.env.DB_USER, // PostgreSQL username from .env
    host: process.env.DB_HOST, // Database host (e.g., AWS RDS)
    database: process.env.DB_NAME, // Database name
    password: process.env.DB_PASSWORD, // Database password
    port: process.env.DB_PORT || 5432, // Port (default is 5432)
    max: process.env.DB_MAX_CONNECTIONS || 10, // Maximum number of clients in the pool
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT || 30000, // Time a client will remain idle before being closed
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT || 5000, // Time to wait for a connection before throwing an error
});

// **Event listener for pool errors**
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// **Query function with logging and error handling**
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query:', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Error executing query:', { text, params, error: error.message });
        throw error;
    }
};

// **Close the connection pool (for testing, maintenance, or app shutdown)**
const closePool = async () => {
    try {
        await pool.end();
        console.log('Database connection pool closed successfully.');
    } catch (error) {
        console.error('Error closing connection pool:', error);
    }
};

module.exports = {
    query,
    closePool,
};
