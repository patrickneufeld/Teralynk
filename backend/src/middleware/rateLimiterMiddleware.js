import rateLimit from "express-rate-limit";

const rateLimiterMiddleware = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 100, // Limit each IP to 100 requests per minute
    message: 'Too many requests, please try again later.',
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit headers
});

module.exports = rateLimiterMiddleware;
