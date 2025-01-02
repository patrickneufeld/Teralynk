const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: './backend/logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './backend/logs/combined.log' }),
    ],
});

// Middleware for logging requests
const requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
};

module.exports = {
    logger,
    requestLogger,
};
