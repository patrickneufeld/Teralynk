const winston = require('winston');

// Create a logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' }),
    ],
});

// Log information
const logInfo = (message) => {
    logger.info(message);
};

// Log errors
const logError = (message) => {
    logger.error(message);
};

module.exports = { logInfo, logError };
