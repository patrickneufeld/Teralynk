// File: /backend/services/authService.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('./db'); // Import your database query function
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// AWS Secrets Manager Configuration
const secretsManager = new AWS.SecretsManager({
    region: 'us-east-1'  // Use the correct region where your secret is stored
});

// Helper function to retrieve the JWT secret from AWS Secrets Manager
const getSecretValue = async (secretName) => {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        
        if (data.SecretString) {
            return JSON.parse(data.SecretString); // Parse JSON if SecretString exists
        } else {
            const buff = Buffer.from(data.SecretBinary, 'base64');
            return buff.toString('ascii');
        }
    } catch (err) {
        console.log("Error retrieving the secret:", err);
        throw err;
    }
};

// Fetch the JWT Secret for signing and verifying tokens
const getJWTSecret = async () => {
    const secret = await getSecretValue('jwt_secret');
    return secret.jwt_secret; // Assuming the secret is stored under "jwt_secret" key
};

// Login function to authenticate a user
const loginUser = async (email, password) => {
    // Query the database for user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
        throw new Error('User not found.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        throw new Error('Invalid password.');
    }

    // Get the JWT secret from Secrets Manager
    const JWT_SECRET_KEY = await getJWTSecret(); // Fetch from AWS Secrets Manager

    // Generate the token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY, {
        expiresIn: '1h',
    });

    // Log the activity (e.g., user logging in)
    await recordActivity(user.id, 'login', null, { email });

    return { token, user };
};

// Register a new user
const registerUser = async (email, password, role) => {
    // Check if the user already exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const userExists = result.rows.length > 0;

    if (userExists) {
        throw new Error('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { email, password: hashedPassword, role };

    // Insert new user into the database
    await query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);

    return newUser;
};

// Refresh the JWT token if it's expired
const refreshToken = async (oldToken) => {
    try {
        const decoded = jwt.verify(oldToken, JWT_SECRET_KEY);
        const newToken = jwt.sign(
            { userId: decoded.userId, role: decoded.role },
            JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );
        return { newToken };
    } catch (error) {
        throw new Error('Invalid or expired refresh token.');
    }
};

// Logout function (invalidate the token, ideally in a production system)
const logoutUser = async (userId) => {
    // For simplicity, just log the activity but ideally you should blacklist tokens in production
    await recordActivity(userId, 'logout', null, { message: 'User logged out' });

    return { message: 'User logged out successfully.' };
};

// Secure route access: middleware to verify user role and permission
const secureRouteAccess = async (userId, requiredPermission) => {
    const role = await getRole(userId);
    if (!role || !role.permissions.includes(requiredPermission)) {
        throw new Error(`You do not have permission for '${requiredPermission}' action.`);
    }
};

// Get the role of a user
const getRole = async (userId) => {
    const result = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new Error('User not found.');
    }
    return result.rows[0];
};

module.exports = {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
    secureRouteAccess,
};
