// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/auth.js

import express from "express";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import {
    login,
    refresh,
    signup,
    logout,
    status,
} from "../controllers/authController.js";  // Import controllers correctly
import { requireAuth } from "../middleware/authMiddleware.js";  // Import middleware for authorization

const router = express.Router();

// ✅ Rate Limiting Middleware (Prevents Brute-Force Attacks)
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 login attempts per window
    message: "⚠️ Too many login attempts. Please try again later.",
});

const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit to 3 signups per hour per IP
    message: "⚠️ Too many signup attempts. Please try again later.",
});

// ✅ Middleware for Input Validation
const validateSignup = [
    body("username").notEmpty().withMessage("⚠️ Username is required"),
    body("email").isEmail().withMessage("⚠️ A valid email is required"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("⚠️ Password must be at least 8 characters long"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateLogin = [
    body("username").notEmpty().withMessage("⚠️ Username is required"),
    body("password").notEmpty().withMessage("⚠️ Password is required"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

// ✅ Authentication Routes

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", signupRateLimiter, validateSignup, signup);

/**
 * @route   POST /api/auth/login
 * @desc    User login with Cognito authentication
 * @access  Public
 */
router.post("/login", loginRateLimiter, validateLogin, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh the authentication token
 * @access  Public
 */
router.post("/refresh", refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Log the user out (requires authentication)
 * @access  Private
 */
router.post("/logout", requireAuth, logout);

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Private
 */
router.get("/status", requireAuth, status);

export default router;  // Correctly export the router
