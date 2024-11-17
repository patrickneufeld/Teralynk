// File: /backend/api/auth.js

const express = require('express');
const router = express.Router();
const { loginUser, registerUser, refreshToken, logoutUser } = require('../services/authService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const response = await loginUser(email, password);
        res.status(200).json(response);
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// Register endpoint (Optional: Enable if new user registration is needed)
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required.' });
        }

        const response = await registerUser(email, password, role);
        res.status(201).json({ message: 'User registered successfully.', response });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Refresh token is required.' });
        }

        const response = await refreshToken(token);
        res.status(200).json(response);
    } catch (error) {
        console.error('Token Refresh Error:', error);
        res.status(500).json({ error: 'An error occurred while refreshing token.' });
    }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const response = await logoutUser(userId);
        res.status(200).json({ message: 'Logout successful.', response });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'An error occurred during logout.' });
    }
});

module.exports = router;
