// ✅ FILE: /Users/patrick/Projects/Teralynk/backend/src/controllers/userController.js

import { getUserRole, revokeToken } from "../services/authService.js";
import { getUserById, updateUserDetails } from "../services/userService.js"; // Assuming you have a userService for DB operations

// ✅ Fetch User Details
/**
 * @route   GET /api/users/:id
 * @desc    Get user details by ID
 * @access  Private (requires authentication)
 */
export const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ Error fetching user details:", error);
        res.status(500).json({ error: "Failed to fetch user details" });
    }
};

// ✅ Update User Details
/**
 * @route   PUT /api/users/:id
 * @desc    Update user details
 * @access  Private (requires authentication)
 */
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, username } = req.body;

        // Only allow updating email or username, not sensitive data like password
        const updatedUser = await updateUserDetails(userId, { email, username });

        if (!updatedUser) {
            return res.status(400).json({ error: "Unable to update user details" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("❌ Error updating user details:", error);
        res.status(500).json({ error: "Failed to update user details" });
    }
};

// ✅ Handle User Logout (Revoke Token)
/**
 * @route   POST /api/users/logout
 * @desc    Log the user out and revoke their token
 * @access  Private (requires authentication)
 */
export const logoutUser = (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (token) {
            revokeToken(token); // Blacklist the token for security
        }

        res.json({ message: "Logout successful, token revoked" });
    } catch (error) {
        console.error("❌ Logout Error:", error);
        res.status(500).json({ error: "Failed to log out" });
    }
};

// ✅ Handle Fetching User Role
/**
 * @route   GET /api/users/role/:id
 * @desc    Fetch the role of a user by their ID
 * @access  Private (requires authentication)
 */
export const getUserRoleById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const role = getUserRole(user);
        res.json({ role });
    } catch (error) {
        console.error("❌ Error fetching user role:", error);
        res.status(500).json({ error: "Failed to fetch user role" });
    }
};
