const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('./db');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const Redis = require('redis');

// **Load environment variables**
dotenv.config();

// **AWS Secrets Manager Configuration**
const secretsManager = new AWS.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1'
});

// **Redis connection for token blacklisting**
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// **Helper function to retrieve secret from AWS Secrets Manager**
const getSecretValue = async (secretName) => {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        return data.SecretString ? JSON.parse(data.SecretString) : data.SecretBinary.toString('ascii');
    } catch (err) {
        console.error("Error retrieving the secret:", err);
        throw new Error('Failed to retrieve secret.');
    }
};

// **Get JWT Secret from AWS Secrets Manager**
const getJWTSecret = async () => {
    const secret = await getSecretValue(process.env.JWT_SECRET_NAME || 'jwt_secret');
    return secret.jwt_secret; // Assume the secret has the key 'jwt_secret'
};

// **Login function to authenticate a user**
const loginUser = async (email, password) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) throw new Error('User not found.');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error('Invalid password.');

    const JWT_SECRET_KEY = await getJWTSecret();
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '1h' });

    await recordActivity(user.id, 'login', null, { email });

    return { token, user };
};

// **Register a new user**
const registerUser = async (email, password, role) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) throw new Error('User already exists.');

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);

    return { email, role };
};

// **Refresh JWT token**
const refreshToken = async (oldToken) => {
    try {
        const JWT_SECRET_KEY = await getJWTSecret();
        const decoded = jwt.verify(oldToken, JWT_SECRET_KEY);
        
        if (await isTokenBlacklisted(oldToken)) throw new Error('Token has been blacklisted.');

        const newToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, JWT_SECRET_KEY, { expiresIn: '1h' });
        return { newToken };
    } catch (error) {
        throw new Error('Invalid or expired refresh token.');
    }
};

// **Blacklist JWT tokens**
const blacklistToken = async (token) => {
    const decoded = jwt.decode(token);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await redisClient.set(token, 'blacklisted', 'EX', expiresIn);
};

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
    if (!role || !role.permissions.includes(requiredPermission)) {
        throw new Error(`You do not have permission for '${requiredPermission}' action.`);
    }
};

// **Get the role of a user**
const getRole = async (userId) => {
    const result = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new Error('User not found.');
    return result.rows[0];
};

module.exports = {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
    secureRouteAccess,
    blacklistToken,
    isTokenBlacklisted
};
