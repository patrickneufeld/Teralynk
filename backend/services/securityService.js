// File: /Users/patrick/Projects/Teralynk/backend/services/securityService.js

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { hasPermission } = require('./rbacService');
const { recordActivity } = require('./activityLogService');

// Environment variables for security (set these in a .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecretKey';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

// Hash a password for secure storage
const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password is required for hashing.');
    }
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
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

// Log a security event
const logSecurityEvent = async (userId, eventType, details = {}) => {
    if (!userId || !eventType) {
        throw new Error('User ID and event type are required for logging security events.');
    }

    await recordActivity(userId, 'securityEvent', null, { eventType, details });
    console.log(`Security event logged: ${eventType} for user: ${userId}`);
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    encryptData,
    decryptData,
    logSecurityEvent,
};
