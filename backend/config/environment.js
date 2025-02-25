const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
    PORT: process.env.PORT || 5001,
    DATABASE_URL: process.env.DB_CONNECTION_STRING,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};