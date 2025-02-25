// File Path: backend/services/rateLimiterService.js

const rateLimitMap = new Map();

const checkRateLimit = (userId) => {
    const userLimit = rateLimitMap.get(userId) || { count: 0, startTime: Date.now() };

    const elapsed = Date.now() - userLimit.startTime;

    if (elapsed > 1000) { // Reset rate limit every second
        rateLimitMap.set(userId, { count: 1, startTime: Date.now() });
        return false;
    }

    userLimit.count += 1;
    rateLimitMap.set(userId, userLimit);
    return userLimit.count > 10; // Allow max 10 actions per second
};

module.exports = { checkRateLimit };
