// File: /backend/api/auth.js

const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    refreshToken,
    logoutUser,
    verifyToken,
    changePassword,
    resetPasswordRequest,
    resetPassword
} = require('../services/authService');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// **1️⃣ Login endpoint**
router.post('/login', validateRequestBody(['email', 'password']), async (req, res) => {
    try {
        const { email, password } = req.body;

        const response = await loginUser(email, password);
        res.status(200).json(response);
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// **2️⃣ Register endpoint**
router.post('/register', rbacMiddleware(['admin']), validateRequestBody(['email', 'password', 'role']), async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const response = await registerUser(email, password, role);
        res.status(201).json({ message: 'User registered successfully.', response });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// **3️⃣ Refresh token endpoint**
router.post('/refresh', validateRequestBody(['refreshToken']), async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        const response = await refreshToken(token);
        res.status(200).json(response);
    } catch (error) {
        console.error('Token Refresh Error:', error);
        res.status(500).json({ error: 'An error occurred while refreshing the token.' });
    }
});

// **4️⃣ Logout endpoint**
router.post('/logout', validateRequestBody(['userId']), async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await logoutUser(userId);
        res.status(200).json({ message: 'Logout successful.', response });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'An error occurred during logout.' });
    }
});

// **5️⃣ Verify token endpoint**
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({ error: 'Authorization token is required.' });
        }

        const response = await verifyToken(token);
        res.status(200).json({ message: 'Token verified successfully.', response });
    } catch (error) {
        console.error('Token Verification Error:', error);
        res.status(500).json({ error: 'An error occurred while verifying the token.' });
    }
});

// **6️⃣ Change password endpoint**
router.post('/change-password', rbacMiddleware(['user']), validateRequestBody(['userId', 'oldPassword', 'newPassword']), async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const response = await changePassword(userId, oldPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully.', response });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ error: 'An error occurred while changing the password.' });
    }
});

// **7️⃣ Reset password request endpoint**
router.post('/request-password-reset', validateRequestBody(['email']), async (req, res) => {
    try {
        const { email } = req.body;

        const response = await resetPasswordRequest(email);
        res.status(200).json({ message: 'Password reset link sent successfully.', response });
    } catch (error) {
        console.error('Password Reset Request Error:', error);
        res.status(500).json({ error: 'An error occurred while requesting the password reset.' });
    }
});

// **8️⃣ Reset password endpoint**
router.post('/reset-password', validateRequestBody(['resetToken', 'newPassword']), async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        const response = await resetPassword(resetToken, newPassword);
        res.status(200).json({ message: 'Password reset successfully.', response });
    } catch (error) {
        console.error('Password Reset Error:', error);
        res.status(500).json({ error: 'An error occurred while resetting the password.' });
    }
});

module.exports = router;
