// File Path: backend/api/authRoutes.js

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
    resetPassword,
    monitorLoginAttempts, // AI-driven login monitoring
} = require('../services/authService');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const rateLimit = require('express-rate-limit');

// Middleware to validate required fields in requests
const validateRequestBody = (requiredFields) => (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }
    next();
};

// Rate limiter for critical endpoints
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per window
    message: 'Too many requests from this IP, please try again later.',
});

// **1️⃣ Login endpoint**
router.post('/login', authRateLimiter, validateRequestBody(['email', 'password']), async (req, res) => {
    try {
        const { email, password } = req.body;

        // AI-driven login monitoring
        await monitorLoginAttempts(email);

        const response = await loginUser(email, password);
        res.status(200).json({ success: true, message: 'Login successful.', data: response });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred during login.' });
    }
});

// **2️⃣ Register endpoint**
router.post('/register', rbacMiddleware(['admin']), validateRequestBody(['email', 'password', 'role']), async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const response = await registerUser(email, password, role);
        res.status(201).json({ success: true, message: 'User registered successfully.', data: response });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred during registration.' });
    }
});

// **3️⃣ Refresh token endpoint**
router.post('/refresh', validateRequestBody(['refreshToken']), async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        const response = await refreshToken(token);
        res.status(200).json({ success: true, message: 'Token refreshed successfully.', data: response });
    } catch (error) {
        console.error('Token Refresh Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while refreshing the token.' });
    }
});

// **4️⃣ Logout endpoint**
router.post('/logout', validateRequestBody(['userId']), async (req, res) => {
    try {
        const { userId } = req.body;

        const response = await logoutUser(userId);
        res.status(200).json({ success: true, message: 'Logout successful.', data: response });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred during logout.' });
    }
});

// **5️⃣ Verify token endpoint**
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(400).json({ success: false, error: 'Authorization token is required.' });
        }

        const response = await verifyToken(token);
        res.status(200).json({ success: true, message: 'Token verified successfully.', data: response });
    } catch (error) {
        console.error('Token Verification Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while verifying the token.' });
    }
});

// **6️⃣ Change password endpoint**
router.post('/change-password', authRateLimiter, rbacMiddleware(['user']), validateRequestBody(['userId', 'oldPassword', 'newPassword']), async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const response = await changePassword(userId, oldPassword, newPassword);
        res.status(200).json({ success: true, message: 'Password changed successfully.', data: response });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while changing the password.' });
    }
});

// **7️⃣ Reset password request endpoint**
router.post('/request-password-reset', authRateLimiter, validateRequestBody(['email']), async (req, res) => {
    try {
        const { email } = req.body;

        const response = await resetPasswordRequest(email);
        res.status(200).json({ success: true, message: 'Password reset link sent successfully.', data: response });
    } catch (error) {
        console.error('Password Reset Request Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while requesting the password reset.' });
    }
});

// **8️⃣ Reset password endpoint**
router.post('/reset-password', authRateLimiter, validateRequestBody(['resetToken', 'newPassword']), async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        const response = await resetPassword(resetToken, newPassword);
        res.status(200).json({ success: true, message: 'Password reset successfully.', data: response });
    } catch (error) {
        console.error('Password Reset Error:', error);
        res.status(500).json({ success: false, error: 'An error occurred while resetting the password.' });
    }
});

module.exports = router;
