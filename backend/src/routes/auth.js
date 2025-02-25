// File Path: /Users/patrick/Projects/Teralynk/backend/src/routes/auth.js

const express = require('express');
const { login, refresh, signup, logout, status } = require('../controllers/authController');

const router = express.Router();

// ✅ Authentication Routes
router.post('/signup', signup);   // Register user
router.post('/login', login);     // User login
router.post('/refresh', refresh); // Refresh access token
router.post('/logout', logout);   // User logout
router.get('/status', status);    // ✅ Check authentication status

module.exports = router;
