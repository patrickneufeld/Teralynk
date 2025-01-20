// File Path: backend/auth/authService.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ Environment variable JWT_SECRET is not set.');
    process.exit(1);
}

/**
 * Generate a JWT token for a user
 * @param {object} user - The user object containing user details.
 * @param {string} user.id - The user's ID.
 * @param {string} user.role - The user's role.
 * @returns {string} - The generated JWT token.
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify.
 * @returns {object} - The decoded token payload.
 * @throws {Error} - If the token is invalid or expired.
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Error verifying token:', error);
        throw new Error('Invalid or expired token');
    }
};

/**
 * Check if a user has a specific role
 * @param {string} userRole - The role of the user.
 * @param {string} requiredRole - The required role for access.
 * @returns {boolean} - Whether the user has the required role.
 */
const hasRole = (userRole, requiredRole) => {
    return userRole === requiredRole;
};

module.exports = {
    generateToken,
    verifyToken,
    hasRole,
};
