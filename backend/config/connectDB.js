require('dotenv').config();
const mongoose = require('mongoose');

// Async function to connect to the database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true, // To ensure MongoDB creates an index for optimization
            useFindAndModify: false, // To avoid deprecation warnings
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); // Exit process with failure if connection fails
    }
};

module.exports = connectDB;
