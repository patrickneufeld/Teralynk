const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { query } = require('../db'); // Database integration for user info
const dotenv = require('dotenv');
const { recordActivity } = require('../activityLogService'); // Log user activities

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'defaultSecretKey';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '1h';

/**
 * Register a new user.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} role - The role to assign to the user.
 * @returns {Promise<object>} - The registered user object.
 */
const registerUser = async (email, password, role) => {
    if (!email || !password || !role) {
        throw new Error('Email, password, and role are required for registration.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await query(
            'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
            [email, hashedPassword, role]
        );

        const newUser = result.rows[0];
        await recordActivity(newUser.id, 'registerUser', null, { email, role });

        console.log(`User registered successfully: ${email}`);
        return newUser;
    } catch (error) {
        console.error('Error registering user:', error.message);
        throw new Error('An error occurred while registering the user.');
    }
};

/**
 * Authenticate a user and generate a JWT token.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - An object containing the JWT token and user details.
 */
const authenticateUser = async (email, password) => {
    if (!email || !password) {
        throw new Error('Email and password are required for authentication.');
    }

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new Error('User not found.');
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Invalid password.');
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });

        await recordActivity(user.id, 'authenticateUser', null, { email });
        console.log(`User authenticated successfully: ${email}`);
        return { token, user };
    } catch (error) {
        console.error('Error authenticating user:', error.message);
        throw new Error('An error occurred while authenticating the user.');
    }
};

/**
 * Verify a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object} - The decoded token payload.
 */
const verifyToken = (token) => {
    if (!token) {
        throw new Error('Token is required for verification.');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verified successfully.');
        return decoded;
    } catch (error) {
        console.error('Error verifying token:', error.message);
        throw new Error('Invalid or expired token.');
    }
};

/**
 * Invalidate a JWT token by blacklisting it (requires Redis or similar implementation).
 * @param {string} token - The JWT token to invalidate.
 * @returns {Promise<void>}
 */
const invalidateToken = async (token) => {
    // This requires Redis or a similar solution for blacklisting tokens.
    console.log('Token invalidation is not yet implemented.');
};

module.exports = {
    registerUser,
    authenticateUser,
    verifyToken,
    invalidateToken,
};
