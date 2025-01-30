const cors = require('cors');

const corsMiddleware = cors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*', // Allow multiple origins via environment variable
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    credentials: true // Allow cookies and credentials
});

module.exports = corsMiddleware;
