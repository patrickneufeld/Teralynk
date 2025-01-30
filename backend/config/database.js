// File Path: backend/config/database.js

const mongoose = require('mongoose');
const logger = require('./logger');

// Async function to connect to MongoDB database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_CONNECTION_STRING, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true, // To ensure MongoDB creates an index for optimization
            useFindAndModify: false, // To avoid deprecation warnings
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure if connection fails
    }
};

// Export the connectDB function
module.exports = connectDB;
