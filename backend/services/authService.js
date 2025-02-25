const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('./db');
const { recordActivity } = require('./activityLogService');
const { getRole } = require('./rbacService');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const Redis = require('redis');
const standardErrorResponse = (res, message = 'An error occurred') => {
    res.status(500).json({ success: false, message });
};

// **Load environment variables**
dotenv.config();

// **AWS Secrets Manager Configuration**
const secretsManager = new AWS.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1',
});

// **Redis connection for token blacklisting**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis connection error:', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));
redisClient.connect().catch(console.error);

// **Helper function to retrieve secret from AWS Secrets Manager**
const getSecretValue = async (secretName) => {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        return data.SecretString ? JSON.parse(data.SecretString) : data.SecretBinary.toString('ascii');
    } catch (error) {
        console.error('Error retrieving the secret:', error.message);
        throw new Error('Failed to retrieve secret.');
    }
};

// **Get JWT Secret from AWS Secrets Manager**
const getJWTSecret = async () => {
    const secret = await getSecretValue(process.env.JWT_SECRET_NAME || 'jwt_secret');
    if (!secret || !secret.jwt_secret) {
        throw new Error('JWT secret not found in the secret value.');
    }
    return secret.jwt_secret;
};

// **Login function to authenticate a user**
const loginUser = async (email, password) => {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
        throw new Error('User not found.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        throw new Error('Invalid password.');
    }

    const JWT_SECRET_KEY = await getJWTSecret();
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '1h' });

    await recordActivity(user.id, 'login', null, { email });

    return { token, user };
};

// **Register a new user**
const registerUser = async (email, password, role) => {
    if (!email || !password || !role) {
        throw new Error('Email, password, and role are required.');
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
        throw new Error('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);

    return { email, role };
};

// **Refresh JWT token**
const refreshToken = async (oldToken) => {
    try {
        const JWT_SECRET_KEY = await getJWTSecret();
        const decoded = jwt.verify(oldToken, JWT_SECRET_KEY);

        if (await isTokenBlacklisted(oldToken)) {
            throw new Error('Token has been blacklisted.');
        }

        const newToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, JWT_SECRET_KEY, { expiresIn: '1h' });
        return { newToken };
    } catch (error) {
        console.error('Error refreshing token:', error.message);
        throw new Error('Invalid or expired refresh token.');
    }
};

// **Blacklist JWT tokens**
const blacklistToken = async (token) => {
    const decoded = jwt.decode(token);
    if (!decoded) {
        throw new Error('Invalid token.');
    }

    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.set(token, JSON.stringify({ userId: decoded.userId, issuedAt: decoded.iat }), 'EX', expiresIn);
};

// **Check if a token is blacklisted**
const isTokenBlacklisted = async (token) => {
    const result = await redisClient.get(token);
    return result !== null;
};

// **Logout function (blacklist the token)**
const logoutUser = async (userId, token) => {
    await blacklistToken(token);
    await recordActivity(userId, 'logout', null, { message: 'User logged out' });

    return { message: 'User logged out successfully.' };
};

// **Secure route access: ensure user has permission**
const secureRouteAccess = async (userId, requiredPermission) => {
    const role = await getRole(userId);
    const permissions = role.permissions || [];
    if (!permissions.includes(requiredPermission)) {
        throw new Error(`You do not have permission for '${requiredPermission}' action.`);
    }
};

module.exports = {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
    blacklistToken,
    isTokenBlacklisted,
};
