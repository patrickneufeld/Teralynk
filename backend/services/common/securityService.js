// File: /backend/services/securityService.js

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { hasPermission } = require('./rbacService'); // RBAC integration
const { recordActivity } = require('../activityLogService'); // Activity logging
const { query } = require('../db'); // Database integration
const Redis = require('redis');

// **Environment Variables**
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// **Initialize Redis Client for Token Blacklisting**
const redisClient = Redis.createClient({ url: REDIS_URL });
redisClient.connect().catch((error) => {
    console.error('Error connecting to Redis:', error);
    process.exit(1); // Exit if Redis connection fails
});

// **Hash a Password**
const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password is required for hashing.');
    }
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// **Verify a Password**
const verifyPassword = async (password, hashedPassword) => {
    if (!password || !hashedPassword) {
        throw new Error('Both password and hashed password are required for verification.');
    }
    return bcrypt.compare(password, hashedPassword);
};

// **Generate a JWT Token**
const generateToken = (userId, permissions = []) => {
    if (!userId) {
        throw new Error('User ID is required to generate a token.');
    }
    const payload = { userId, permissions };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

// **Verify a JWT Token**
const verifyToken = (token) => {
    if (!token) {
        throw new Error('Token is required for verification.');
    }
    return jwt.verify(token, JWT_SECRET);
};

// **Encrypt Data**
const encryptData = (data) => {
    if (!data) {
        throw new Error('Data is required for encryption.');
    }
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(JWT_SECRET)).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

// **Decrypt Data**
const decryptData = (encryptedData) => {
    if (!encryptedData) {
        throw new Error('Encrypted data is required for decryption.');
    }
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(JWT_SECRET)).digest('base64').substr(0, 32);

    const [iv, encrypted] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));

    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
};

// **Log Security Events**
const logSecurityEvent = async (userId, eventType, details = {}) => {
    if (!userId || !eventType) {
        throw new Error('User ID and event type are required for logging security events.');
    }

    try {
        // Store security event in the database
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

// **Blacklist a Token**
const blacklistToken = async (token) => {
    if (!token) {
        throw new Error('Token is required for blacklisting.');
    }
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.set(token, 'blacklisted', 'EX', expiresIn); // Set expiration time
};

// **Check if a Token is Blacklisted**
const isTokenBlacklisted = async (token) => {
    if (!token) {
        throw new Error('Token is required to check blacklist status.');
    }
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
