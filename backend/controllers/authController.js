// File Path: backend/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Login Controller
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set secure cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

/**
 * Signup Controller
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({ email, password: hashedPassword });

        res.status(201).json({ message: 'Signup successful', user });
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).json({ message: 'Error signing up', error: err.message });
    }
};

/**
 * Logout Controller
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const logout = (req, res) => {
    try {
        res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Error logging out', error: err.message });
    }
};

/**
 * Status Controller
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const status = (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Verify JWT
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ message: 'Authenticated', user });
    } catch (err) {
        console.error('Invalid token:', err);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { login, signup, logout, status };
