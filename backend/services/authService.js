// File: /backend/services/authService.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { recordActivity } = require('./activityLogService');
const { hasPermission } = require('./rbacService');

// Secret key for JWT (should be stored in .env for security)
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

// In-memory store for user data (replace with database in production)
const users = [
    { id: 1, email: 'user@example.com', password: '$2b$10$abcd...', role: 'Admin' }, // Sample user
];

// Login function to authenticate a user
const loginUser = async (email, password) => {
    const user = users.find((u) => u.email === email);
    if (!user) {
        throw new Error('User not found.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        throw new Error('Invalid password.');
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET_KEY, {
        expiresIn: '1h',
    });

    // Log the activity
    await recordActivity(user.id, 'login', null, { email });

    return { token, user };
};

// Register a new user (for testing purposes)
const registerUser = async (email, password, role) => {
    const userExists = users.find((u) => u.email === email);
    if (userExists) {
        throw new Error('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, email, password: hashedPassword, role };

    users.push(newUser);

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
        throw new Error('Invalid refresh token.');
    }
};

// Logout function (invalidate the token)
const logoutUser = async (userId) => {
    // For simplicity, just log out by not doing anything on server-side,
    // but ideally, you would invalidate the JWT token or store blacklisted tokens
    return { message: 'User logged out successfully.' };
};

module.exports = {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
};
