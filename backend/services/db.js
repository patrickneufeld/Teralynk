// File: /backend/services/db.js

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
    max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10, // Maximum number of clients in the pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000, // Time a client will remain idle before being closed
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 5000, // Time to wait for a connection before throwing an error
});

// **Event listener for pool errors**
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Exit the application on pool errors
});

// **Query function with logging and error handling**
const query = async (text, params = []) => {
    const start = Date.now(); // Track the query start time
    try {
        const result = await pool.query(text, params); // Execute the query
        const duration = Date.now() - start; // Calculate query duration
        console.log('Executed query:', { text, duration, rows: result.rowCount });
        return result; // Return the query result
    } catch (error) {
        console.error('Error executing query:', { text, params, error: error.message });
        throw error; // Rethrow the error for higher-level handling
    }
};

// **Function to close the connection pool**
const closePool = async () => {
    try {
        await pool.end(); // Gracefully close the pool
        console.log('Database connection pool closed successfully.');
    } catch (error) {
        console.error('Error closing connection pool:', error.message);
    }
};

// **Test the database connection (useful for debugging)**
const testConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()'); // Execute a simple query
        console.log('Database connection successful. Current time:', result.rows[0].now);
    } catch (error) {
        console.error('Error testing database connection:', error.message);
        throw error; // Rethrow the error for higher-level handling
    }
};

module.exports = {
    query,
    closePool,
    testConnection, // Expose the testConnection function for optional use
};
