const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { hasPermission } = require('./rbacService');
const { recordActivity } = require('./activityLogService');
const { query } = require('./db'); // Database integration
const Redis = require('redis');

// Environment variables for security (set these in a .env file)
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize Redis for token blacklisting
const redisClient = Redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

// Hash a password for secure storage
const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password is required for hashing.');
    }
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Compare a password with its hashed version
const verifyPassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) {
        throw new Error('Both password and hashed password are required for verification.');
    }
    return bcrypt.compare(password, hashedPassword);
};

// Generate a JWT token
const generateToken = (userId, permissions = []) => {
    if (!userId) {
        throw new Error('User ID is required to generate a token.');
    }
    const payload = { userId, permissions };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

// Verify a JWT token
const verifyToken = (token) => {
    if (!token) {
        throw new Error('Token is required for verification.');
    }
    return jwt.verify(token, JWT_SECRET);
};

// Encrypt sensitive data
const encryptData = (data) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(JWT_SECRET)).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

// Decrypt sensitive data
const decryptData = (encryptedData) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(JWT_SECRET)).digest('base64').substr(0, 32);

    const [iv, encrypted] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
};

// Log a security event (e.g., failed login, token refresh attempt, etc.)
const logSecurityEvent = async (userId, eventType, details = {}) => {
    if (!userId || !eventType) {
        throw new Error('User ID and event type are required for logging security events.');
    }

    try {
        // Store security event in the database (for auditing)
        await query(
            'INSERT INTO security_events (user_id, event_type, details, timestamp) VALUES ($1, $2, $3, $4)',
            [userId, eventType, JSON.stringify(details), new Date()]
        );

        // Log activity
        await recordActivity(userId, 'securityEvent', null, { eventType, details });

        console.log(`Security event logged: ${eventType} for user: ${userId}`);
    } catch (error) {
        console.error('Error logging security event:', error);
        throw new Error('Failed to log security event.');
    }
};

// Blacklist a JWT token (invalidate it before its expiration)
const blacklistToken = async (token) => {
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.set(token, 'blacklisted', 'EX', expiresIn); // Store the token in Redis with expiration time
};

// Check if a JWT token is blacklisted
const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(token);
    return result !== null;
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    encryptData,
    decryptData,
    logSecurityEvent,
    blacklistToken,
    isTokenBlacklisted,
};
