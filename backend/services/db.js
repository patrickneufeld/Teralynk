// File: /backend/services/db.js

const { Pool } = require('pg');

// Set up your database connection
const pool = new Pool({
    user: 'yourUsername', // Username for your PostgreSQL
    host: 'teralynkpostgresdb.cxukqd50k36a.us-east-1.rds.amazonaws.com', // RDS endpoint
    database: 'yourDB', // Database name
    password: 'yourPassword', // Password for your database
    port: 5432,
});

// Query function
const query = (text, params) => pool.query(text, params);

module.exports = { query };
