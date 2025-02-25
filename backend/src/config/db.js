// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/config/db.js

const { Client } = require("pg");

const dbClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false, require: true } : false,
});

dbClient.connect()
    .then(() => console.log(`✅ PostgreSQL Connected Successfully at: ${new Date().toISOString()}`))
    .catch((err) => {
        console.error("❌ PostgreSQL Connection Failed:", err.message);
        process.exit(1);
    });

module.exports = dbClient;
