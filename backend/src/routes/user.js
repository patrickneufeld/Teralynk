// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/routes/user.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
    getUserDetails,
    updateUser,
    logoutUser,
    getUserRoleById
} from "../controllers/userController.js";

const router = express.Router();

// ✅ Middleware to Ensure Authentication (Require Token)
router.use(requireAuth);

// ✅ Fetch User Details
/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID
 * @access  Private (requires authentication)
 */
router.get("/:id", getUserDetails);

// ✅ Update User Details
/**
 * @route   PUT /api/users/:id
 * @desc    Update user details
 * @access  Private (requires authentication)
 */
router.put("/:id", updateUser);

// ✅ Logout User (Revoke Token)
/**
 * @route   POST /api/users/logout
 * @desc    Log out the user and revoke their token
 * @access  Private (requires authentication)
 */
router.post("/logout", logoutUser);

// ✅ Fetch User Role by ID
/**
 * @route   GET /api/users/role/:id
 * @desc    Get the user's role by ID (e.g., Admin, Viewer)
 * @access  Private (requires authentication)
 */
router.get("/role/:id", getUserRoleById);

export default router;
